// On-chain performance verification.
//
// Every closed trade is hashed into a deterministic fingerprint. Fingerprints
// are batched into a Merkle tree on an interval, and only the Merkle root
// (32 bytes) is anchored on a public chain — one cheap transaction proves the
// integrity of thousands of trades without ever writing PnL data on-chain.
//
// If LEDGER_RPC_URL / LEDGER_PRIVATE_KEY are not configured, anchoring falls
// back to a clearly-labeled simulated mode so the rest of the pipeline
// (hashing, Merkle proofs, verification) is fully testable without a funded
// wallet.

import crypto from 'crypto';
import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';

// ---------------------------------------------------------------------------
// Canonical hashing
// ---------------------------------------------------------------------------

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `"${k}":${canonicalize(value[k])}`).join(',')}}`;
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  return JSON.stringify(value);
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Deterministic fingerprint for a single closed trade. Never includes anything not already visible to the trade's own user — only identifiers, prices, and timestamps. */
export function hashTrade(trade) {
  const payload = canonicalize({
    agentId: trade.agentId,
    deploymentId: trade.deploymentId,
    positionId: trade.positionId,
    pair: trade.pair,
    direction: trade.direction,
    size: trade.size,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    realizedPnl: trade.realizedPnl,
    openedAt: trade.openedAt,
    closedAt: trade.closedAt,
  });
  return '0x' + sha256Hex(payload);
}

// ---------------------------------------------------------------------------
// Merkle tree (sha256, sorted-pair hashing, duplicate-last-if-odd)
// ---------------------------------------------------------------------------

function strip0x(h) { return h.startsWith('0x') ? h.slice(2) : h; }

function hashPair(a, b) {
  const [x, y] = [strip0x(a), strip0x(b)].sort();
  return '0x' + sha256Hex(Buffer.from(x + y, 'hex'));
}

/** Builds a Merkle tree from an ordered list of leaf hashes. Returns the root and every intermediate layer (needed to derive proofs). */
export function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: null, layers: [] };
  let layer = leaves.slice();
  const layers = [layer];
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] || layer[i];
      next.push(hashPair(left, right));
    }
    layer = next;
    layers.push(layer);
  }
  return { root: layer[0], layers };
}

/** Derives the sibling-hash proof path for the leaf at `index`. */
export function getMerkleProof(layers, index) {
  const proof = [];
  let idx = index;
  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isRight = idx % 2 === 1;
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    if (siblingIdx < layer.length) {
      proof.push({ position: isRight ? 'left' : 'right', hash: layer[siblingIdx] });
    } else {
      // Odd node at this layer — it was duplicated against itself when the
      // parent was built, so the "sibling" is the node's own hash.
      proof.push({ position: 'right', hash: layer[idx] });
    }
    idx = Math.floor(idx / 2);
  }
  return proof;
}

/** Recomputes the root from a leaf + its proof and checks it matches. Anyone can run this independently — it needs no database access. */
export function verifyMerkleProof(leaf, proof, root) {
  let computed = leaf;
  for (const step of proof || []) {
    computed = step.position === 'left' ? hashPair(step.hash, computed) : hashPair(computed, step.hash);
  }
  return computed === root;
}

// ---------------------------------------------------------------------------
// On-chain anchoring
// ---------------------------------------------------------------------------

let wallet = null;
if (config.ledger.rpcUrl && config.ledger.privateKey) {
  const provider = new ethers.JsonRpcProvider(config.ledger.rpcUrl);
  wallet = new ethers.Wallet(config.ledger.privateKey, provider);
}

/** Writes a Merkle root to the configured public chain as a zero-value self-transaction carrying the root as calldata. Falls back to a simulated anchor when no chain credentials are configured. */
export async function anchorMerkleRoot(root) {
  if (!wallet) {
    return {
      txHash: '0xsim' + sha256Hex(`${root}:${Date.now()}`).slice(0, 60),
      chain: 'simulated',
      blockNumber: null,
      anchoredAt: new Date(),
      simulated: true,
    };
  }
  const tx = await wallet.sendTransaction({ to: wallet.address, value: 0n, data: root });
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    chain: config.ledger.chainName,
    blockNumber: receipt.blockNumber,
    anchoredAt: new Date(),
    simulated: false,
  };
}

/** Batches every unanchored PerformanceRecord into one Merkle tree, anchors the root, and stores each record's proof. Safe to call repeatedly (e.g. from an interval or a cron endpoint) — it's a no-op when there's nothing pending. */
export async function runAnchorBatch() {
  const pending = await prisma.performanceRecord.findMany({
    where: { merkleRoot: null },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
  if (pending.length === 0) return null;

  const leaves = pending.map((p) => p.tradeHash);
  const { root, layers } = buildMerkleTree(leaves);
  const anchor = await anchorMerkleRoot(root);

  await Promise.all(pending.map((p, i) =>
    prisma.performanceRecord.update({
      where: { id: p.id },
      data: {
        merkleRoot: root,
        merkleProof: getMerkleProof(layers, i),
        txHash: anchor.txHash,
        chain: anchor.chain,
        blockNumber: anchor.blockNumber,
        anchoredAt: anchor.anchoredAt,
      },
    })
  ));

  return { root, count: pending.length, txHash: anchor.txHash, chain: anchor.chain, simulated: anchor.simulated };
}

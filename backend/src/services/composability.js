// Agent composability: lets one agent's signal output automatically trigger
// one or more downstream agents, so strategies can be chained into pipelines
// (e.g. a sentiment agent's bullish read feeds a grid-trading agent's entry
// logic) without any manual routing by the user.

import { prisma } from '../db/prisma.js';
import { broadcast } from '../ws/server.js';

const MAX_CHAIN_DEPTH = 5;

/**
 * Given a signal that was just routed to `sourceAgentId`, finds any active
 * AgentLinks whose source is that agent and, for each, emits a derived signal
 * attributed to the source agent and recurses into the target agent so chains
 * of arbitrary length can form. A visited-set guards against cycles and a
 * depth cap guards against runaway fan-out.
 */
export async function cascadeSignal({ signalId, sourceAgentId, action = 'trigger_entry', visited, depth = 0 }) {
  const seen = visited || new Set();
  if (depth >= MAX_CHAIN_DEPTH || seen.has(sourceAgentId)) return [];
  seen.add(sourceAgentId);

  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) return [];

  const links = await prisma.agentLink.findMany({
    where: { sourceAgentId, active: true, triggerOn: { in: ['signal_routed', 'any_signal'] } },
    include: { targetAgent: true, sourceAgent: true },
  });

  const triggered = [];
  for (const link of links) {
    if (signal.confidence < link.minConfidence) continue;
    if (seen.has(link.targetAgentId)) continue; // cycle guard on the edge itself

    const derived = await prisma.signal.create({
      data: {
        type: 'agent_output',
        asset: signal.asset,
        title: `${link.sourceAgent.name} → ${link.targetAgent.name}`,
        detail: `Cascaded from "${signal.title}" (${(signal.confidence * 100).toFixed(0)}% confidence) via a composability link.`,
        confidence: signal.confidence,
        impact: signal.impact,
        source: `agent:${sourceAgentId}`,
      },
    });

    broadcast({
      type: 'agent_cascade',
      sourceAgentId,
      sourceAgentName: link.sourceAgent.name,
      targetAgentId: link.targetAgentId,
      targetAgentName: link.targetAgent.name,
      signalId: derived.id,
      depth,
      ts: Date.now(),
    });

    triggered.push({ linkId: link.id, targetAgentId: link.targetAgentId, derivedSignalId: derived.id, depth });

    const downstream = await cascadeSignal({
      signalId: derived.id,
      sourceAgentId: link.targetAgentId,
      action,
      visited: seen,
      depth: depth + 1,
    });
    triggered.push(...downstream);
  }
  return triggered;
}

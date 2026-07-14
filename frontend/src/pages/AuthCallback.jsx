import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { setToken, addToast } = useAppStore();
  const navigate = useNavigate();
  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      addToast({ type:'success', msg:'OKX account connected via OAuth' });
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  }, []);
  return <div style={{ color:'var(--sub)', padding:'40px', textAlign:'center' }}>Connecting your OKX account...</div>;
}

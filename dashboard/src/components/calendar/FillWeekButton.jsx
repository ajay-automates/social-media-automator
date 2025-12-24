import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMagic, FaSpinner } from 'react-icons/fa';
import api from '../../lib/api';

export default function FillWeekButton({ onFillWeek, isGenerating }) {
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnectedPlatforms();
  }, []);

  const fetchConnectedPlatforms = async () => {
    try {
      const response = await api.get('/accounts');
      const accounts = response.data?.accounts || response.data || [];
      const platforms = [...new Set(accounts.map(acc => acc.platform).filter(Boolean))];
      setConnectedPlatforms(platforms);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      setConnectedPlatforms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (connectedPlatforms.length === 0) {
      alert('Please connect at least one platform first!');
      return;
    }
    await onFillWeek(connectedPlatforms);
  };

  if (loading) {
    return (
      <motion.button
        className="blaze-action-btn fill-week"
        disabled
        style={{ opacity: 0.6 }}
      >
        <FaSpinner className="animate-spin" style={{ fontSize: '12px', marginRight: '6px' }} />
        Loading...
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="blaze-action-btn fill-week"
      onClick={handleClick}
      disabled={isGenerating || connectedPlatforms.length === 0}
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        padding: '10px 20px',
        opacity: (isGenerating || connectedPlatforms.length === 0) ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: 'none',
        borderRadius: '8px',
        cursor: connectedPlatforms.length === 0 ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      <FaMagic style={{ fontSize: '12px' }} />
      {isGenerating ? 'Filling Week...' : `Fill My Week (${connectedPlatforms.length} platforms)`}
    </motion.button>
  );
}


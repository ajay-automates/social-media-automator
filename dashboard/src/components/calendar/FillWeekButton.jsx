import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaMagic, FaSpinner, FaCalendarWeek } from 'react-icons/fa';
import { addDays } from 'date-fns';
import api from '../../lib/api';

export default function FillWeekButton({ onFillWeek, isGenerating, events = [], checkCurrentWeekHasPosts }) {
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

  // Determine if we should schedule for current week or next week
  const weekInfo = useMemo(() => {
    if (!checkCurrentWeekHasPosts || events.length === 0) {
      return { isNextWeek: false, label: 'Fill My Week' };
    }
    
    const hasCurrentWeekPosts = checkCurrentWeekHasPosts();
    return {
      isNextWeek: hasCurrentWeekPosts,
      label: hasCurrentWeekPosts ? 'Schedule Next Week' : 'Fill My Week'
    };
  }, [events, checkCurrentWeekHasPosts]);

  const handleClick = async () => {
    if (connectedPlatforms.length === 0) {
      alert('Please connect at least one platform first!');
      return;
    }
    // Pass weekOffset: 0 for current week, 1 for next week
    await onFillWeek(connectedPlatforms, weekInfo.isNextWeek ? 1 : 0);
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

  const buttonText = isGenerating 
    ? (weekInfo.isNextWeek ? 'Scheduling Next Week...' : 'Filling Week...')
    : `${weekInfo.label} (${connectedPlatforms.length} platforms)`;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="blaze-action-btn fill-week"
      onClick={handleClick}
      disabled={isGenerating || connectedPlatforms.length === 0}
      style={{
        background: weekInfo.isNextWeek 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
      {weekInfo.isNextWeek ? (
        <FaCalendarWeek style={{ fontSize: '12px' }} />
      ) : (
        <FaMagic style={{ fontSize: '12px' }} />
      )}
      {buttonText}
    </motion.button>
  );
}


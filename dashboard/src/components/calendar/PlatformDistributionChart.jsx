import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaChartPie } from 'react-icons/fa';

export default function PlatformDistributionChart({ events, platformConfig }) {
  const distribution = useMemo(() => {
    const counts = {};
    events.forEach(event => {
      if (event.platforms && Array.isArray(event.platforms)) {
        event.platforms.forEach(platform => {
          counts[platform] = (counts[platform] || 0) + 1;
        });
      } else if (event.platform) {
        // Handle single platform format
        counts[event.platform] = (counts[event.platform] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const sortedPlatforms = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 platforms

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FaChartPie style={{ color: '#6366f1', fontSize: '14px' }} />
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
          Platform Distribution
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
          {total} total posts
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedPlatforms.map(([platform, count]) => {
          const config = platformConfig[platform];
          const percentage = ((count / total) * 100).toFixed(0);
          
          return (
            <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {config && <config.Icon style={{ color: config.color, fontSize: '16px' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                    {config?.name || platform}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {count} ({percentage}%)
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  background: '#f3f4f6',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5 }}
                    style={{
                      height: '100%',
                      background: config?.color || '#6366f1',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


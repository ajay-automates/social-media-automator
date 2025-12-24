import { motion } from 'framer-motion';
import { FaPlus, FaCalendarDay } from 'react-icons/fa';
import { format } from 'date-fns';

export default function EmptySlotIndicator({ emptySlots, onFillSlot }) {
  if (emptySlots.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        background: 'white',
        border: '2px dashed #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
        zIndex: 50,
        maxWidth: '300px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <FaCalendarDay style={{ color: '#6366f1', fontSize: '16px' }} />
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
          {emptySlots.length} Empty Day{emptySlots.length > 1 ? 's' : ''}
        </h3>
      </div>
      
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
        Fill empty days to maintain consistent presence
      </div>
      
      {emptySlots.length > 0 && emptySlots.length <= 3 && (
        <div style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          marginBottom: '12px',
          padding: '8px',
          background: '#f9fafb',
          borderRadius: '6px'
        }}>
          {emptySlots.slice(0, 3).map((slot, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              {format(slot.date, 'EEE, MMM d')}
            </div>
          ))}
        </div>
      )}
      
      <button
        onClick={() => onFillSlot(emptySlots)}
        style={{
          width: '100%',
          padding: '10px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#4f46e5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#6366f1';
        }}
      >
        <FaPlus style={{ fontSize: '12px' }} />
        Fill Empty Slots
      </button>
    </motion.div>
  );
}


import { motion } from 'framer-motion';

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionOnClick,
  illustration
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 px-4 text-center"
  >
    {illustration ? (
      <img src={illustration} alt="" className="w-64 h-64 mb-6" />
    ) : (
      <div className="text-6xl mb-6">{icon}</div>
    )}

    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-[#52525b] mb-6 max-w-sm">{description}</p>

    {actionLabel && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={actionOnClick}
        className="bg-[#06b6d4] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#06b6d4] transition"
      >
        {actionLabel}
      </motion.button>
    )}
  </motion.div>
);

export const NoPostsEmpty = ({ onCreate }) => (
  <EmptyState
    icon="📝"
    title="No posts yet"
    description="Create your first post and reach your audience across all platforms"
    actionLabel="Create First Post"
    actionOnClick={onCreate}
  />
);

export const NoScheduledEmpty = ({ onSchedule }) => (
  <EmptyState
    icon="📅"
    title="Nothing scheduled"
    description="Schedule posts in advance to maintain consistent presence"
    actionLabel="Schedule Post"
    actionOnClick={onSchedule}
  />
);

export const NoAnalyticsEmpty = () => (
  <EmptyState
    icon="📊"
    title="No data yet"
    description="Analytics will appear here once you start posting"
  />
);

export const NoNotificationsEmpty = () => (
  <EmptyState
    icon="🔔"
    title="All caught up!"
    description="You don't have any notifications right now"
  />
);

export const NoTemplatesEmpty = ({ onCreate }) => (
  <EmptyState
    icon="📋"
    title="No templates yet"
    description="Create your first template to save time on future posts"
    actionLabel="Create Template"
    actionOnClick={onCreate}
  />
);

export const NoActivityEmpty = () => (
  <EmptyState
    icon="⚡"
    title="No activity yet"
    description="Team activity and actions will appear here"
  />
);

export const NoHistoryEmpty = ({ onCreate }) => (
  <EmptyState
    icon="📜"
    title="No post history"
    description="Your published posts will appear here"
    actionLabel="Create Post"
    actionOnClick={onCreate}
  />
);


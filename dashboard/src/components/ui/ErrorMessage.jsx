const ERROR_TYPES = {
  TWITTER_AUTH_FAILED: {
    title: 'Twitter Connection Lost',
    message: 'Your Twitter account needs to be reconnected.',
    action: 'Reconnect Twitter',
    actionUrl: '/dashboard/settings',
    icon: '🔗',
    color: 'red',
  },
  RATE_LIMIT: {
    title: 'Slow Down There!',
    message: 'You've hit your posting limit. Upgrade or try again later.',
    action: 'View Plans',
    actionUrl: '/dashboard/settings',
    icon: '⏱️',
    color: 'yellow',
  },
  IMAGE_TOO_LARGE: {
    title: 'Image Too Large',
    message: 'Please upload an image under 5MB.',
    action: 'Choose Another',
    icon: '📸',
    color: 'orange',
  },
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Check your internet connection and try again.',
    action: 'Retry',
    icon: '🌐',
    color: 'red',
  },
  INVALID_CREDENTIALS: {
    title: 'Authentication Failed',
    message: 'Your session has expired. Please log in again.',
    action: 'Log In',
    actionUrl: '/auth',
    icon: '🔐',
    color: 'red',
  },
};

export const ErrorMessage = ({ type, onAction, customMessage }) => {
  const error = ERROR_TYPES[type] || {
    title: 'Error',
    message: customMessage || 'Something went wrong',
    icon: '❌',
    color: 'red',
  };

  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[error.color]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{error.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{error.title}</h3>
          <p className="text-sm mb-3">{error.message}</p>
          {error.action && (
            <button
              onClick={() => {
                if (error.actionUrl) {
                  window.location.href = error.actionUrl;
                } else if (onAction) {
                  onAction();
                }
              }}
              className={`text-sm font-medium underline hover:no-underline`}
            >
              {error.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


import toast from 'react-hot-toast';

export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    icon: '🚀',
    duration: 4000,
    ...options,
  });
};

export const showError = (message, action = null) => {
  return toast.error(message, {
    icon: '❌',
    duration: 5000,
    ...(action && {
      action: {
        label: action.label || 'Retry',
        onClick: action.onClick || (() => {}),
      },
    }),
  });
};

export const showInfo = (message) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  });
};

export const showLoading = (message) => {
  return toast.loading(message, {
    duration: Infinity,
  });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};


import toast from 'react-hot-toast';

export const showSuccessToast = (message) => {
  toast.success(message, {
    icon: '✅',
    style: {
      background: '#000000',
      color: '#fff',
      border: '1px solid #333333',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#22c55e',
      secondary: '#fff',
    },
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    icon: '❌',
    style: {
      background: '#ef4444',
      color: '#fff',
      border: '1px solid #dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

export const showLoadingToast = (message) => {
  toast.loading(message, {
    style: {
      background: '#3b82f6',
      color: '#fff',
      border: '1px solid #2563eb',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
    },
  });
};

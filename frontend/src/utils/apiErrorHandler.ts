import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

export class ApiErrorHandler {
  static handle(error: any, defaultMessage: string = 'An error occurred') {
    console.error('API Error:', error);
    
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
          break;
          
        case 403:
          toast.error('Access denied. You do not have permission for this action.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 422:
          toast.error(data?.message || 'Invalid input data.');
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data?.message || defaultMessage);
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other errors
      toast.error(defaultMessage);
    }
    
    // Return standardized error object
    return {
      message: error.response?.data?.message || error.message || defaultMessage,
      status: error.response?.status,
      data: error.response?.data
    };
  }

  static validateResponse(response: any): boolean {
    if (!response || !response.data) {
      return false;
    }
    
    if (typeof response.data !== 'object') {
      return false;
    }
    
    return true;
  }

  static safeParseJSON(jsonString: string | null): any {
    if (!jsonString) {
      return null;
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      return null;
    }
  }
}

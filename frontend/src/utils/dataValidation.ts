/**
 * Utility functions for safe data operations and validation
 */

export class DataValidation {
  /**
   * Safely parse JSON with error handling
   */
  static safeParseJSON<T>(jsonString: string | null): T | null {
    if (!jsonString) {
      return null;
    }
    
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('JSON Parse Error:', error);
      return null;
    }
  }

  /**
   * Safely get numeric value from object
   */
  static safeGetNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Safely get string value from object
   */
  static safeGetString(value: any, defaultValue: string = ''): string {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    return String(value);
  }

  /**
   * Validate API response data
   */
  static validateApiResponse(response: any): boolean {
    if (!response || !response.data) {
      return false;
    }
    
    if (typeof response.data !== 'object') {
      return false;
    }
    
    return true;
  }

  /**
   * Safe array operations
   */
  static safeArrayAccess<T>(array: T[], index: number, defaultValue: T | null = null): T | null {
    if (!array || array.length <= index) {
      return defaultValue;
    }
    
    return array[index] || defaultValue;
  }

  /**
   * Calculate average score safely
   */
  static calculateAverageScore(apps: any[]): number {
    if (!apps || apps.length === 0) {
      return 0;
    }
    
    const totalScore = apps.reduce((sum: number, app: any) => {
      const score = this.safeGetNumber(app.total_score, 0);
      return sum + score;
    }, 0);
    
    return Math.round(totalScore / apps.length);
  }

  /**
   * Filter applications by status
   */
  static filterByStatus(applications: any[], status: string): any[] {
    return applications.filter((app: any) => 
      app && typeof app === 'object' && app.status === status
    );
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data: any, requiredFields: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

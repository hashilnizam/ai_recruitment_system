import { useState, useCallback } from 'react';
import { DataValidation } from '@/utils/dataValidation';
import toast from 'react-hot-toast';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export const useFormValidation = (initialValues: any, validationRules: ValidationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationRules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // Min length validation
    if (rule.minLength && value && value.length < rule.minLength) {
      return `${name} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value && value.length > rule.maxLength) {
      return `${name} must not exceed ${rule.maxLength} characters`;
    }

    // Pattern validation (email)
    if (rule.pattern && value) {
      if (!rule.pattern.test(value)) {
        return `Invalid ${name} format`;
      }
    }

    // Custom validation
    if (rule.custom && value) {
      return rule.custom(value);
    }

    return null;
  }, [validationRules]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  const handleChange = useCallback((name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));
    setTouched((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(name);
      return newSet;
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: string) => {
    setTouched((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(name);
      return newSet;
    });
    const error = validateField(name, values[name]);
    setErrors((prev: FormErrors) => ({ ...prev, [name]: error || undefined }));
  }, [values, validationRules, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched(new Set());
  }, [initialValues]);

  const getFieldError = useCallback((name: string): string | undefined => {
    return touched.has(name) ? errors[name] : undefined;
  }, [errors, touched]);

  const isFieldValid = useCallback((name: string): boolean => {
    return touched.has(name) && !errors[name];
  }, [errors, touched]);

  const isFormValid = useCallback((): boolean => {
    return Object.keys(validationRules).every(name => isFieldValid(name));
  }, [isFieldValid]);

  return {
    values,
    errors,
    touched,
    isValid: isFormValid(),
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    getFieldError,
    isFieldValid,
  };
};

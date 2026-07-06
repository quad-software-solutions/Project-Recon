import { useState } from 'react';
import type { StudentRegistrationRequest } from '../api/registerApi';
import { registerApi } from '../api/registerApi';

interface UseRegisterReturn {
  register: (data: StudentRegistrationRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRegister(onSuccess?: () => void): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: StudentRegistrationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerApi(data);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
}

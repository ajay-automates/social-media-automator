import { useState } from 'react';

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  
  const startLoading = (step = null) => {
    setIsLoading(true);
    setCurrentStep(step);
  };
  
  const stopLoading = () => {
    setIsLoading(false);
    setCurrentStep(null);
  };
  
  return { isLoading, currentStep, startLoading, stopLoading };
};


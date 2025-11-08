import { createContext, useContext, useState, useEffect } from 'react';

const OnboardingContext = createContext();

const STORAGE_KEY = 'sma_onboarding_state';

const defaultState = {
  isNewUser: true,
  currentStep: 0,
  hasConnectedAccount: false,
  hasCreatedFirstPost: false,
  onboardingComplete: false,
  skipped: false,
  skipCount: 0,
  completedAt: null,
  firstPostData: null,
  postResults: null
};

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    }
    return defaultState;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }, [state]);

  const goToStep = (stepNumber) => {
    setState(prev => ({ ...prev, currentStep: stepNumber }));
  };

  const nextStep = () => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const previousStep = () => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.max(0, prev.currentStep - 1) 
    }));
  };

  const skipOnboarding = () => {
    setState(prev => ({
      ...prev,
      skipped: true,
      onboardingComplete: true,
      skipCount: prev.skipCount + 1,
      completedAt: new Date().toISOString()
    }));
  };

  const completeOnboarding = (results = null) => {
    setState(prev => ({
      ...prev,
      onboardingComplete: true,
      completedAt: new Date().toISOString(),
      postResults: results,
      currentStep: 4 // Move to success modal
    }));
  };

  const finishOnboarding = () => {
    setState(prev => ({
      ...prev,
      isComplete: true
    }));
  };

  const markAccountConnected = () => {
    setState(prev => ({ ...prev, hasConnectedAccount: true }));
  };

  const markPostCreated = () => {
    setState(prev => ({ ...prev, hasCreatedFirstPost: true }));
  };

  const setFirstPostData = (data) => {
    setState(prev => ({ ...prev, firstPostData: data }));
  };

  const updateProgress = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetOnboarding = () => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const restartOnboarding = () => {
    setState({
      ...defaultState,
      isNewUser: false, // Not a brand new user, just restarting
      currentStep: 0,
      onboardingComplete: false,
      isComplete: false
    });
  };

  const value = {
    ...state,
    isComplete: state.onboardingComplete,
    goToStep,
    nextStep,
    prevStep: previousStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    finishOnboarding,
    markAccountConnected,
    markPostCreated,
    setFirstPostData,
    updateProgress,
    resetOnboarding,
    restartOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}


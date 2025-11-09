import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import WelcomeModal from './WelcomeModal';
import ConnectAccountsStep from './ConnectAccountsStep';
import FirstPostStep from './FirstPostStep';
import ReviewStep from './ReviewStep';
import SuccessModal from './SuccessModal';

export default function OnboardingFlow({ onComplete }) {
  const { currentStep, isComplete, postResults } = useOnboarding();

  // If onboarding is complete, close the flow (defer to useEffect to avoid render-phase state updates)
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {currentStep === 0 && <WelcomeModal key="welcome" />}
      {currentStep === 1 && <ConnectAccountsStep key="connect" />}
      {currentStep === 2 && <FirstPostStep key="first-post" />}
      {currentStep === 3 && <ReviewStep key="review" />}
      {currentStep === 4 && postResults && (
        <SuccessModal 
          key="success" 
          results={postResults.results}
          platformCount={postResults.platformCount}
        />
      )}
    </AnimatePresence>
  );
}


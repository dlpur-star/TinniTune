import React, { useState } from 'react';
import Step1CalmMode from './steps/Step1CalmMode';
import Step2TherapyMode from './steps/Step2TherapyMode';
import Step3NotchConfig from './steps/Step3NotchConfig';
import Step4Summary from './steps/Step4Summary';

export default function TherapySetupWizard({
  frequency,
  ear,
  onComplete,
  onCancel
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupConfig, setSetupConfig] = useState({
    // Calm mode settings
    calmMode: false,
    heartbeatBPM: 55,
    breathingEnabled: true,

    // Therapy mode
    therapyMode: getRecommendedMode(),

    // Notch therapy
    notchEnabled: true,
    notchIntensity: 'standard'
  });

  // Get recommended mode based on time of day
  function getRecommendedMode() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'daytime';
    if (hour >= 12 && hour < 20) return 'evening';
    return 'sleep';
  }

  const updateConfig = (updates) => {
    setSetupConfig(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(setupConfig);
  };

  const steps = [
    { number: 1, title: 'Calm Mode', component: Step1CalmMode },
    { number: 2, title: 'Therapy Mode', component: Step2TherapyMode },
    { number: 3, title: 'Notch Therapy', component: Step3NotchConfig },
    { number: 4, title: 'Ready', component: Step4Summary }
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Progress Indicator */}
      <div style={{
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                flex: 1,
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                margin: '0 auto 5px',
                background: currentStep >= step.number
                  ? 'linear-gradient(135deg, #4ECDC4, #44B3AA)'
                  : 'rgba(255,255,255,0.2)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px',
                border: currentStep === step.number
                  ? '3px solid #4ECDC4'
                  : 'none',
                boxShadow: currentStep === step.number
                  ? '0 0 0 4px rgba(78, 205, 196, 0.2)'
                  : 'none'
              }}>
                {step.number}
              </div>
              <div style={{
                fontSize: '12px',
                color: currentStep >= step.number
                  ? '#4ECDC4'
                  : 'rgba(255,255,255,0.5)',
                fontWeight: currentStep === step.number ? '700' : '500'
              }}>
                {step.title}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '15px'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4ECDC4, #44B3AA)',
            width: `${(currentStep / steps.length) * 100}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Current Step Content */}
      <CurrentStepComponent
        config={setupConfig}
        updateConfig={updateConfig}
        nextStep={nextStep}
        prevStep={prevStep}
        onComplete={handleComplete}
        frequency={frequency}
        ear={ear}
      />

      {/* Cancel option */}
      {onCancel && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            Cancel setup
          </button>
        </div>
      )}
    </div>
  );
}

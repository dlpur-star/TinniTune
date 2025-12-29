/**
 * TinniTune Audio Engine - Integration Guide
 * 
 * This guide shows how to integrate the bespoke TinniTune audio engine
 * into your React application for clinical-grade tinnitus therapy.
 * 
 * @author TinniTune Development Team
 */

// ============================================================================
// INSTALLATION
// ============================================================================

/*
1. Copy all engine files to your project:
   - TinniTuneAudioEngine.js
   - ThreeAFCTester.js
   - ClinicalTherapyModule.js
   - CalibrationSafetyModule.js

2. Ensure Tone.js is installed:
   npm install tone

3. Import in your React component:
*/

import { getAudioEngine } from './TinniTuneAudioEngine';
import { ThreeAFCTester, FrequencyVerifier } from './ThreeAFCTester';
import { ClinicalTherapyModule } from './ClinicalTherapyModule';
import { CalibrationManager, SafetyMonitor } from './CalibrationSafetyModule';

// ============================================================================
// BASIC USAGE - React Component Example
// ============================================================================

function TinniTuneApp() {
  const [engine, setEngine] = useState(null);
  const [tester, setTester] = useState(null);
  const [therapy, setTherapy] = useState(null);
  const [safety, setSafety] = useState(null);
  const [calibration, setCalibration] = useState(null);

  // State
  const [matchedFrequency, setMatchedFrequency] = useState(null);
  const [isTestingFrequency, setIsTestingFrequency] = useState(false);
  const [isTherapyActive, setIsTherapyActive] = useState(false);

  // Initialize engine on mount
  useEffect(() => {
    const audioEngine = getAudioEngine({
      enableLogging: true,
      safetyLimiterEnabled: true,
      maxVolume: -10
    });

    setEngine(audioEngine);

    // Initialize modules
    const calibrationMgr = new CalibrationManager(audioEngine);
    const safetyMon = new SafetyMonitor(audioEngine);
    
    setCalibration(calibrationMgr);
    setSafety(safetyMon);

    // Cleanup on unmount
    return () => {
      if (audioEngine) {
        audioEngine.dispose();
      }
    };
  }, []);

  // ========================================================================
  // FREQUENCY TESTING WORKFLOW
  // ========================================================================

  const startFrequencyTest = async (ear = 'both') => {
    if (!engine) return;

    try {
      // Initialize audio context (requires user gesture)
      await engine.initialize();

      // Create 3AFC tester
      const afcTester = new ThreeAFCTester(engine, {
        startFrequency: 4000,
        minFrequency: 250,
        maxFrequency: 16000,
        targetPrecision: 0.1
      });

      setTester(afcTester);
      setIsTestingFrequency(true);

      // Start test
      const testPromise = afcTester.startTest(ear);

      // Play first test set
      await afcTester.playTestSet();

      // Wait for completion
      const result = await testPromise;
      
      // Test complete!
      setMatchedFrequency(result.frequency);
      setIsTestingFrequency(false);
      
      console.log('Frequency matched:', result);
      
    } catch (error) {
      console.error('Test error:', error);
      setIsTestingFrequency(false);
    }
  };

  // Handle user's tone selection (1, 2, or 3)
  const handleToneSelection = async (selection) => {
    if (!tester) return;

    // Submit selection (0-indexed: 0, 1, or 2)
    tester.submitSelection(selection);

    // If test continues, play next set
    if (tester.isRunning) {
      await tester.playTestSet();
    }
    // Otherwise test is complete, result handled by promise
  };

  // ========================================================================
  // THERAPY SESSION WORKFLOW
  // ========================================================================

  const startTherapy = async ({
    frequency,
    volumeLeft = -25,
    volumeRight = -25,
    ear = 'both',
    notchIntensity = 'moderate',
    binauralMode = 'focus'
  }) => {
    if (!engine) return;

    try {
      // Initialize if needed
      await engine.initialize();

      // Create therapy module
      const therapyModule = new ClinicalTherapyModule(engine, {
        notchEnabled: true,
        notchIntensity,
        binauralMode
      });

      // Register with engine
      engine.registerModule('therapy', therapyModule);

      // Start therapy
      await therapyModule.start({
        frequency,
        volumeLeft,
        volumeRight,
        ear,
        notchIntensity,
        binauralMode
      });

      setTherapy(therapyModule);
      setIsTherapyActive(true);

      // Start safety monitoring
      safety?.startMonitoring(Math.max(volumeLeft, volumeRight));

      console.log('Therapy started');

    } catch (error) {
      console.error('Therapy error:', error);
    }
  };

  const stopTherapy = async () => {
    if (!therapy) return;

    await engine.stop();
    therapy.dispose();
    engine.unregisterModule('therapy');
    
    setIsTherapyActive(false);
    safety?.stopMonitoring();

    console.log('Therapy stopped');
  };

  // Update therapy parameters in real-time
  const updateTherapyVolume = (ear, volumeDb) => {
    if (!therapy) return;
    therapy.updateVolume(ear, volumeDb);
    safety?.updateVolume(volumeDb);
  };

  const updateNotchIntensity = (intensity) => {
    if (!therapy) return;
    therapy.updateNotchIntensity(intensity);
  };

  const updateBinauralMode = (mode) => {
    if (!therapy) return;
    therapy.updateBinauralMode(mode);
  };

  // ========================================================================
  // CALIBRATION WORKFLOW
  // ========================================================================

  const runCalibration = async () => {
    if (!calibration) return;

    console.log('Running calibration...');

    // Test frequency accuracy
    const freqCalib = await calibration.calibrateFrequencyAccuracy();
    console.log('Frequency accuracy:', freqCalib);

    // Detect hearing range
    const hearingRange = await calibration.detectHearingRange();
    console.log('Hearing range:', hearingRange);

    // Save calibration
    calibration.saveCalibration();

    // Get device recommendations
    const recommendations = calibration.getDeviceRecommendations();
    console.log('Device recommendations:', recommendations);
  };

  // ========================================================================
  // SAFETY MONITORING
  // ========================================================================

  useEffect(() => {
    // Listen for safety warnings
    const handleWarning = (event) => {
      const { type, message } = event.detail;
      
      // Show warning to user
      alert(`Safety Warning: ${message}`);
      
      // Log to analytics
      console.warn('Safety warning:', type, message);
    };

    window.addEventListener('tinnitune-safety-warning', handleWarning);

    return () => {
      window.removeEventListener('tinnitune-safety-warning', handleWarning);
    };
  }, []);

  // Check safety status periodically
  const checkSafetyStatus = () => {
    if (!safety) return null;
    return safety.getSafetyStatus();
  };

  // ========================================================================
  // RENDER EXAMPLE
  // ========================================================================

  return (
    <div className="tinnitune-app">
      <h1>TinniTune - Clinical Tinnitus Therapy</h1>

      {/* Frequency Testing */}
      <section>
        <h2>Step 1: Match Your Tinnitus Frequency</h2>
        
        {!isTestingFrequency && !matchedFrequency && (
          <button onClick={() => startFrequencyTest('both')}>
            Start 3AFC Frequency Test
          </button>
        )}

        {isTestingFrequency && (
          <div>
            <p>Listen to the three tones...</p>
            <p>Which tone sounds most like your tinnitus?</p>
            <button onClick={() => handleToneSelection(0)}>Tone 1</button>
            <button onClick={() => handleToneSelection(1)}>Tone 2</button>
            <button onClick={() => handleToneSelection(2)}>Tone 3</button>
          </div>
        )}

        {matchedFrequency && (
          <div>
            <p>✓ Frequency matched: {matchedFrequency} Hz</p>
          </div>
        )}
      </section>

      {/* Therapy Session */}
      <section>
        <h2>Step 2: Start Therapy</h2>
        
        {matchedFrequency && !isTherapyActive && (
          <button onClick={() => startTherapy({
            frequency: matchedFrequency,
            volumeLeft: -25,
            volumeRight: -25,
            ear: 'both',
            notchIntensity: 'moderate',
            binauralMode: 'focus'
          })}>
            Start Therapy Session
          </button>
        )}

        {isTherapyActive && (
          <div>
            <p>✓ Therapy active at {matchedFrequency} Hz</p>
            
            {/* Volume controls */}
            <div>
              <label>Left Ear Volume</label>
              <input 
                type="range" 
                min="-40" 
                max="-10" 
                defaultValue="-25"
                onChange={(e) => updateTherapyVolume('left', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label>Right Ear Volume</label>
              <input 
                type="range" 
                min="-40" 
                max="-10" 
                defaultValue="-25"
                onChange={(e) => updateTherapyVolume('right', parseInt(e.target.value))}
              />
            </div>

            {/* Notch intensity */}
            <div>
              <label>Notch Intensity</label>
              <select onChange={(e) => updateNotchIntensity(e.target.value)}>
                <option value="gentle">Gentle</option>
                <option value="moderate" selected>Moderate</option>
                <option value="strong">Strong</option>
                <option value="precise">Precise</option>
              </select>
            </div>

            {/* Binaural mode */}
            <div>
              <label>Binaural Mode</label>
              <select onChange={(e) => updateBinauralMode(e.target.value)}>
                <option value="focus" selected>Daytime Focus</option>
                <option value="calm">Evening Calm</option>
                <option value="sleep">Deep Sleep</option>
              </select>
            </div>

            <button onClick={stopTherapy}>Stop Therapy</button>
          </div>
        )}
      </section>

      {/* Calibration */}
      <section>
        <h2>Calibration & Setup</h2>
        <button onClick={runCalibration}>
          Run Device Calibration
        </button>
      </section>

      {/* Safety Status */}
      <section>
        <h2>Safety Monitor</h2>
        {safety && (
          <SafetyStatusDisplay status={checkSafetyStatus()} />
        )}
      </section>
    </div>
  );
}

// ============================================================================
// ADVANCED USAGE PATTERNS
// ============================================================================

// Pattern 1: Quick frequency verification
async function verifyFrequency(engine, frequency, ear) {
  const verifier = new FrequencyVerifier(engine);
  await verifier.playVerification(frequency, ear);
}

// Pattern 2: Sequential frequency testing (both ears separately)
async function testBothEarsSequentially(engine) {
  const tester = new ThreeAFCTester(engine);
  
  // Test right ear
  const rightResult = await tester.startTest('right');
  await tester.playTestSet();
  // ... user interaction ...
  
  // Test left ear
  const leftResult = await tester.startTest('left');
  await tester.playTestSet();
  // ... user interaction ...
  
  return { right: rightResult.frequency, left: leftResult.frequency };
}

// Pattern 3: Therapy with custom notch parameters
async function advancedTherapy(engine, frequency) {
  const therapy = new ClinicalTherapyModule(engine, {
    notchEnabled: true,
    notchIntensity: 'precise',
    binauralMode: 'calm'
  });

  await therapy.start({
    frequency,
    volumeLeft: -20,
    volumeRight: -22,
    ear: 'both',
    notchIntensity: 'precise',
    binauralMode: 'calm'
  });

  // Dynamically adjust during session
  setTimeout(() => {
    therapy.updateBinauralMode('sleep'); // Transition to sleep mode
  }, 30 * 60 * 1000); // After 30 minutes
}

// Pattern 4: Safety-first therapy with monitoring
async function safetherapySession(engine, frequency) {
  const safety = new SafetyMonitor(engine);
  const therapy = new ClinicalTherapyModule(engine);

  // Start safety monitoring first
  safety.startMonitoring(-25);

  // Start therapy
  await therapy.start({ frequency, volumeLeft: -25, volumeRight: -25 });

  // Check safety every minute
  const safetyCheck = setInterval(() => {
    const status = safety.getSafetyStatus();
    
    if (!status.isVolumeSafe || !status.isDurationSafe) {
      console.warn('Safety threshold exceeded, stopping therapy');
      therapy.stop();
      safety.stopMonitoring();
      clearInterval(safetyCheck);
    }
  }, 60000);

  return { therapy, safety, safetyCheck };
}

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Common Issues and Solutions:

1. "Audio context initialization failed"
   - Solution: Initialize in response to user gesture (button click)
   - await engine.initialize() must be called after user interaction

2. "No sound during frequency test"
   - Check device volume is not muted
   - Verify headphones are connected
   - Run calibration to check audio quality

3. "Octave confusion in testing"
   - The 3AFC method prevents this automatically
   - If still occurring, reduce initial step size

4. "Therapy volume too loud/quiet"
   - Start at -25 dB and adjust
   - Use safety monitor to track volume
   - Calibrate device for optimal levels

5. "Binaural beats not working"
   - Requires stereo headphones
   - Ensure both ears are being used ('both' parameter)
   - Check audio context has 2 output channels

6. "High audio latency"
   - Close other applications using audio
   - Use wired headphones instead of Bluetooth
   - Check AudioQualityValidator for recommendations

For more help: See full documentation in TinniTuneEngine_Documentation.md
*/

export default TinniTuneApp;

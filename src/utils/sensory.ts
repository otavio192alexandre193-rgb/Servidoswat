/**
 * Sensory Feedback Engine for ciclocred CRM
 * Custom sound synthesis, system vibration, and visual pulse feedback
 */

export interface AccessibilitySettings {
  enableSound: boolean;
  enableVibration: boolean;
  soundVolume: number; // 0 to 1
  fontSizeClass: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  visualPulse: boolean;
  soundsEnabled?: boolean;
  hapticsEnabled?: boolean;
  speakAloudEnabled?: boolean;
}

export const INITIAL_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  enableSound: true,
  enableVibration: true,
  soundVolume: 0.5,
  fontSizeClass: 'normal',
  highContrast: false,
  visualPulse: true,
  soundsEnabled: true,
  hapticsEnabled: true,
  speakAloudEnabled: false
};

export type SensoryAction = 'click' | 'success' | 'warning' | 'alarm' | 'complete' | 'chime';

export function triggerSensoryFeedback(action: SensoryAction, config: AccessibilitySettings = INITIAL_ACCESSIBILITY_SETTINGS) {
  // 1. PHYSICAL NAVIGATION VIBRATION
  const finalVibe = config.enableVibration && config.hapticsEnabled !== false;
  if (finalVibe && navigator.vibrate) {
    try {
      switch (action) {
        case 'click':
          navigator.vibrate(10);
          break;
        case 'success':
          navigator.vibrate([40, 30, 40]);
          break;
        case 'warning':
          navigator.vibrate(120);
          break;
        case 'alarm':
          navigator.vibrate([150, 100, 150, 100, 200]);
          break;
        case 'complete':
          navigator.vibrate([60, 45, 100]);
          break;
        case 'chime':
          navigator.vibrate([20, 20, 20, 20]);
          break;
      }
    } catch (e) {
      console.warn("Vibration not allowed by iframe permissions yet.", e);
    }
  }

  // 2. SYNTHESIZED SOUND (WEB AUDIO API)
  const finalSound = config.enableSound && config.soundsEnabled !== false;
  if (finalSound) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const mainVolume = config.soundVolume;

        const playTone = (freq: number, startDelay: number, duration: number, type: OscillatorType = 'sine') => {
          setTimeout(() => {
            try {
              if (audioCtx.state === 'suspended') {
                audioCtx.resume();
              }
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();

              osc.type = type;
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

              // Linear envelope to avoid clicking pops
              gain.gain.setValueAtTime(0, audioCtx.currentTime);
              gain.gain.linearRampToValueAtTime(mainVolume * 0.15, audioCtx.currentTime + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

              osc.connect(gain);
              gain.connect(audioCtx.destination);

              osc.start();
              osc.stop(audioCtx.currentTime + duration);
            } catch (err) {
              // Fail silently (user interaction required for AudioContext)
            }
          }, startDelay);
        };

        switch (action) {
          case 'click':
            // Fast soft high frequency tap
            playTone(980, 0, 0.08);
            break;
          case 'success':
            // Pleasant double beep going up
            playTone(523.25, 0, 0.12); // C5
            playTone(659.25, 100, 0.22); // E5
            break;
          case 'warning':
            // Deeper warning blips
            playTone(220, 0, 0.15, 'triangle');
            playTone(220, 160, 0.15, 'triangle');
            break;
          case 'alarm':
            // High frequency police siren style
            playTone(880, 0, 0.15);
            playTone(1100, 120, 0.20);
            playTone(880, 320, 0.15);
            playTone(1100, 440, 0.25);
            break;
          case 'complete':
            // Dynamic resolution chord (C maj arpeggio)
            playTone(523.25, 0, 0.1); // C5
            playTone(659.25, 50, 0.1); // E5
            playTone(783.99, 100, 0.1); // G5
            playTone(1046.50, 150, 0.2); // C6
            break;
          case 'chime':
            // Retro sparkling chime synth
            playTone(1318.51, 0, 0.15); // E6
            playTone(1567.98, 40, 0.15); // G6
            playTone(2093.00, 80, 0.25); // C7
            break;
        }
      }
    } catch (e) {
      console.warn("AudioContext blocked or unavailable", e);
    }
  }

  // 3. VISUAL FLASH PULSE EMITTER
  if (config.visualPulse) {
    const flashEl = document.createElement('div');
    flashEl.style.position = 'fixed';
    flashEl.style.inset = '0';
    flashEl.style.pointerEvents = 'none';
    flashEl.style.zIndex = '9999';
    flashEl.style.transition = 'all 0.35s ease-out';
    
    let color = 'rgba(99, 102, 241, 0.25)'; // indigo standard
    if (action === 'success' || action === 'complete' || action === 'chime') {
      color = 'rgba(16, 185, 129, 0.3)'; // emerald green
    } else if (action === 'warning' || action === 'alarm') {
      color = 'rgba(239, 68, 68, 0.32)'; // rose red
    }
    
    flashEl.style.boxShadow = `inset 0 0 40px 10px ${color}`;
    document.body.appendChild(flashEl);
    
    // Quick fadeout
    setTimeout(() => {
      flashEl.style.boxShadow = 'inset 0 0 0px 0px transparent';
      flashEl.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(flashEl);
      }, 350);
    }, 150);
  }
}

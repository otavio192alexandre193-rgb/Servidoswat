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
  highLegibilityFont?: boolean;
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
  speakAloudEnabled: false,
  highLegibilityFont: false
};

export type SensoryAction = 'click' | 'success' | 'warning' | 'alarm' | 'complete' | 'chime';

let audioCtx: AudioContext | null = null;

export function triggerSensoryFeedback(action: SensoryAction, config: AccessibilitySettings = INITIAL_ACCESSIBILITY_SETTINGS) {
  // 1. PHYSICAL NAVIGATION VIBRATION
  const finalVibe = config.enableVibration && config.hapticsEnabled !== false;
  if (finalVibe && navigator.vibrate) {
    try {
      switch (action) {
        case 'click':
          navigator.vibrate(5); // Shorter vibe
          break;
        case 'success':
          navigator.vibrate([20, 20, 20]);
          break;
        case 'warning':
          navigator.vibrate(80);
          break;
        case 'alarm':
          navigator.vibrate([100, 50, 100, 50, 100]);
          break;
        case 'complete':
          navigator.vibrate([40, 30, 60]);
          break;
        case 'chime':
          navigator.vibrate([10, 10, 10, 10]);
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
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
        }
        const ctx = audioCtx;
        const mainVolume = config.soundVolume;

        const playTone = (freq: number, startDelay: number, duration: number, type: OscillatorType = 'sine') => {
          setTimeout(() => {
            try {
              if (ctx.state === 'suspended') {
                ctx.resume();
              }
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = type;
              osc.frequency.setValueAtTime(freq, ctx.currentTime);

              // Linear envelope to avoid clicking pops
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(mainVolume * 0.1, ctx.currentTime + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start();
              osc.stop(ctx.currentTime + duration);
            } catch (err) {
              // Fail silently
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
  if (config.visualPulse && action !== 'click') { // Skip visual pulse for standard clicks for performance
    const flashEl = document.createElement('div');
    flashEl.style.position = 'fixed';
    flashEl.style.inset = '0';
    flashEl.style.pointerEvents = 'none';
    flashEl.style.zIndex = '9999';
    flashEl.style.transition = 'all 0.15s ease-out'; // Faster transition
    
    let color = 'rgba(99, 102, 241, 0.15)'; // indigo standard
    if (action === 'success' || action === 'complete' || action === 'chime') {
      color = 'rgba(16, 185, 129, 0.2)'; // emerald green
    } else if (action === 'warning' || action === 'alarm') {
      color = 'rgba(239, 68, 68, 0.25)'; // rose red
    }
    
    flashEl.style.boxShadow = `inset 0 0 20px 5px ${color}`;
    document.body.appendChild(flashEl);
    
    // Quick fadeout
    setTimeout(() => {
      flashEl.style.boxShadow = 'inset 0 0 0px 0px transparent';
      flashEl.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(flashEl)) {
          document.body.removeChild(flashEl);
        }
      }, 150);
    }, 80);
  }
}

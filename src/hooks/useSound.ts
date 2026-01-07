// Web Audio API hook for generating sounds
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

export const playTick = () => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

export const playComplete = () => {
  if (!audioContext) return;
  
  // Play a pleasant completion melody
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = audioContext.currentTime + i * 0.15;
    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
};

export const playBreakOver = () => {
  if (!audioContext) return;
  
  // Play an energizing sound for break over
  const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'triangle';
    
    const startTime = audioContext.currentTime + i * 0.1;
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.25);
  });
};

export const playReminderSound = (type: 'eye' | 'water') => {
  if (!audioContext) return;
  
  // Different sounds for different reminders
  const notes = type === 'eye' 
    ? [440, 554.37, 659.25] // A4, C#5, E5 - gentle arpeggio
    : [523.25, 587.33, 659.25, 783.99]; // C5, D5, E5, G5 - water drop sound
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = type === 'eye' ? 'sine' : 'triangle';
    
    const startTime = audioContext.currentTime + i * 0.12;
    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.35);
  });
};

export type AlarmTone = 'classic' | 'digital' | 'gentle';

export const playAlarmTone = (tone: AlarmTone, type: 'eye' | 'water' = 'eye') => {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const baseGain = 0.18;

  const playBeep = (frequency: number, startTime: number, duration: number, oscType: OscillatorType) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = oscType;

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(baseGain, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  if (tone === 'classic') {
    // Classic repeating alarm (two-tone, 3 cycles)
    const a = type === 'eye' ? 880 : 784;
    const b = type === 'eye' ? 660 : 523.25;
    for (let i = 0; i < 3; i++) {
      const t0 = now + i * 0.75;
      playBeep(a, t0, 0.18, 'square');
      playBeep(b, t0 + 0.22, 0.18, 'square');
      playBeep(a, t0 + 0.44, 0.18, 'square');
    }
    return;
  }

  if (tone === 'digital') {
    // Digital chirp (fast triplets)
    const f1 = type === 'eye' ? 1200 : 900;
    const f2 = type === 'eye' ? 950 : 720;
    const step = 0.12;
    for (let i = 0; i < 10; i++) {
      const t = now + i * step;
      playBeep(i % 2 === 0 ? f1 : f2, t, 0.06, 'sawtooth');
    }
    return;
  }

  // gentle: soft chime arpeggio
  const chord = type === 'eye' ? [523.25, 659.25, 783.99] : [440, 554.37, 659.25];
  chord.forEach((freq, i) => {
    playBeep(freq, now + i * 0.14, 0.28, 'sine');
  });
  chord.forEach((freq, i) => {
    playBeep(freq * 2, now + 0.55 + i * 0.14, 0.22, 'sine');
  });
};

export const triggerHaptic = (pattern: number | number[] = 50) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const resumeAudioContext = () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

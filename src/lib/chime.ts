/**
 * Synthesizes a high-fidelity, pleasant dual-tone chime loop using Web Audio API.
 * Returns a teardown function to stop the alarm.
 */
export function playAlarmSound(): () => void {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (freq: number, duration: number, delayTime: number) => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delayTime);
    
    // Attack
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delayTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + delayTime + 0.05);
    // Smooth decay
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delayTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(audioCtx.currentTime + delayTime);
    osc.stop(audioCtx.currentTime + delayTime + duration);
  };

  const triggerChime = () => {
    // E5 (659.25Hz) and G#5 (830.61Hz) double chord
    playTone(659.25, 0.4, 0);
    playTone(830.61, 0.4, 0.08);
  };

  // Play immediately
  triggerChime();
  
  // Pleasant alarm repetition every 1.6 seconds
  const intervalId = setInterval(() => {
    triggerChime();
  }, 1600);

  return () => {
    clearInterval(intervalId);
    audioCtx.close();
  };
}

import { NotificationSound } from '../types.ts';

/**
 * Audio Synthesizer and Text-to-Speech helper for KafeKu Notifications
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 1. "Ting! Klasik" (Suara bel kafe standar / two-tone dining chime)
 */
export function playTingKlasik(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Note 2: A5 (880 Hz) - 180ms later
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.18);
      gain2.gain.setValueAtTime(0, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.32, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.9);

      setTimeout(() => resolve(), 700);
    } catch {
      resolve();
    }
  });
}

/**
 * 2. "Dering Ceria" (Melodi pendek santai: arpeggio C5 -> E5 -> G5 -> C6)
 */
export function playDeringCeria(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const step = 0.11;

      notes.forEach((freq, idx) => {
        const startTime = now + (idx * step);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });

      setTimeout(() => resolve(), (notes.length * step + 0.35) * 1000);
    } catch {
      resolve();
    }
  });
}

/**
 * 3. "Retro Game" (Suara efek pixel 8-bit yang seru: fast square arpeggio jump)
 */
export function playRetroGame(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const freqs = [330, 440, 660, 880, 1320];
      const step = 0.06;

      freqs.forEach((freq, idx) => {
        const startTime = now + (idx * step);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });

      setTimeout(() => resolve(), (freqs.length * step + 0.15) * 1000);
    } catch {
      resolve();
    }
  });
}

/**
 * 4. "Suara Kasir Digital" (Efek bip register khas POS / barcode scanner modern: dual high chirps)
 */
export function playKasirDigital(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1760, now); // A6
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Beep 2 (higher, celebratory register beep)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2637, now + 0.10); // E7
      gain2.gain.setValueAtTime(0, now + 0.10);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.10);
      osc2.stop(now + 0.28);

      setTimeout(() => resolve(), 350);
    } catch {
      resolve();
    }
  });
}

/**
 * Play a specific notification sound variation
 */
export function playNotificationSound(soundType: NotificationSound = 'ting_klasik'): Promise<void> {
  switch (soundType) {
    case 'dering_ceria':
      return playDeringCeria();
    case 'retro_game':
      return playRetroGame();
    case 'kasir_digital':
      return playKasirDigital();
    case 'ting_klasik':
    default:
      return playTingKlasik();
  }
}

/**
 * Alias for backward compatibility
 */
export function playKitchenChime(soundType?: NotificationSound): Promise<void> {
  return playNotificationSound(soundType || 'ting_klasik');
}

/**
 * Speak order details using Web Speech Synthesis API
 */
export function speakOrderAnnouncement(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID'; // Indonesian
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      // Try finding Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech error:', e);
      resolve();
    }
  });
}

/**
 * Full notification flow: Plays the selected notification sound, then speaks the order items!
 */
export async function announceOrderToKitchen(
  sourceName: string, 
  itemsDescription: string, 
  soundType: NotificationSound = 'ting_klasik'
) {
  try {
    await playNotificationSound(soundType);
    // small pause after chime
    await new Promise(r => setTimeout(r, 200));
    const announcement = `Pesanan baru dari ${sourceName}: ${itemsDescription}`;
    await speakOrderAnnouncement(announcement);
  } catch (err) {
    console.warn('Could not complete audio announcement', err);
  }
}

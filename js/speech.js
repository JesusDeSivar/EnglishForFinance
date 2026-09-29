// Text-to-speech with the browser's built-in voices (free, offline-capable).
// Prefers natural-sounding US English voices when the OS provides them.

const synth = window.speechSynthesis;
let voice = null;

function pickVoice() {
  const all = synth?.getVoices() || [];
  const us = all.filter(v => /^en[-_]US/i.test(v.lang));
  voice = us.find(v => /natural|online/i.test(v.name))
    || us.find(v => /google/i.test(v.name))
    || us[0]
    || all.find(v => /^en/i.test(v.lang))
    || null;
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const canSpeak = !!synth;

// Long text is spoken sentence by sentence: some engines cut off long utterances.
export function speak(text, { rate = 1, onend } = {}) {
  if (!synth) return;
  synth.cancel();
  const parts = String(text).split(/(?<=[.!?]["”’)]?)\s+/).filter(p => p.trim());
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === parts.length - 1 && onend) u.onend = onend;
    synth.speak(u);
  });
}

export const stopSpeaking = () => synth?.cancel();

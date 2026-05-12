let audioContext;
let alarmTimer;
let isRinging = false;

export async function startMedicineAlarm() {
  if (isRinging) {
    return true;
  }

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return false;
    }

    audioContext = audioContext || new AudioContext();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    playBeep();
    alarmTimer = window.setInterval(playBeep, 1400);
    isRinging = true;
    return true;
  } catch {
    return false;
  }
}

export function stopMedicineAlarm() {
  if (alarmTimer) {
    window.clearInterval(alarmTimer);
  }

  alarmTimer = null;
  isRinging = false;
}

function playBeep() {
  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);
}

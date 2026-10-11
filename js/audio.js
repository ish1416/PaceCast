// PaceCast - Audio Engine (Speech Synthesis, Cadence Metronome & Split Chimes)

class PaceAudioEngine {
  constructor() {
    this.speechSynth = window.speechSynthesis;
    this.audioCtx = null;
    this.metronomeInterval = null;
    this.isMetronomeActive = false;
    this.preferredVoice = null;
    this.isSpeaking = false;
    this.volume = 1.0;
    this.onSpeakingChange = null;

    this.initAudioContext();
    this.loadVoices();
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("AudioContext not supported:", e);
    }
  }

  loadVoices() {
    if (!this.speechSynth) return;
    const setVoice = () => {
      const voices = this.speechSynth.getVoices();
      // Pick natural English voices
      this.preferredVoice = voices.find(v => 
        (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen") || v.name.includes("Arthur")) && v.lang.startsWith("en")
      ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    };

    setVoice();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = setVoice;
    }
  }

  setSpeakingState(speaking) {
    this.isSpeaking = speaking;
    if (this.onSpeakingChange) {
      this.onSpeakingChange(speaking);
    }
  }

  /**
   * Speaks a coaching message with Web Speech API & harmonic chime
   */
  async speak(text, onComplete = null) {
    if (!text) return;
    console.log("[PaceCast Audio Coach]:", text);

    // Play milestone chime first
    this.playChime();

    if (!this.speechSynth) {
      if (onComplete) onComplete();
      return;
    }

    this.speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = 1.02; // Athletic, clear pace
    utterance.pitch = 1.0;
    utterance.volume = this.volume;

    utterance.onstart = () => {
      this.setSpeakingState(true);
    };

    utterance.onend = () => {
      this.setSpeakingState(false);
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.setSpeakingState(false);
      if (onComplete) onComplete();
    };

    this.speechSynth.speak(utterance);
  }

  /**
   * Harmonious chime for KM milestones
   */
  playChime() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    // Dual harmonic chime: E5 (659Hz) -> G#5 (830Hz)
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Cadence Metronome (Tick at e.g. 172 BPM)
   */
  startMetronome(bpm = 172) {
    this.stopMetronome();
    this.isMetronomeActive = true;
    const intervalMs = (60 / bpm) * 1000;

    this.metronomeInterval = setInterval(() => {
      if (!this.isSpeaking && this.isMetronomeActive) {
        this.playMetronomeClick();
      }
    }, intervalMs);
  }

  stopMetronome() {
    this.isMetronomeActive = false;
    if (this.metronomeInterval) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

  playMetronomeClick() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

window.paceAudio = new PaceAudioEngine();

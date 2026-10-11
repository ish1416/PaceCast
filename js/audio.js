// PaceCast - Audio Engine (Speech Synthesis, Cadence Metronome & Split Chimes)

class PaceAudioEngine {
  constructor() {
    this.speechSynth = window.speechSynthesis;
    this.audioCtx = null;
    this.metronomeInterval = null;
    this.isMetronomeActive = false;
    this.elevenLabsApiKey = "";
    this.elevenLabsVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel - calm, natural voice
    this.preferredVoice = null;
    this.isSpeaking = false;
    this.volume = 1.0;

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
      // Try to pick an expressive, natural English voice (e.g. Google, Daniel, Samantha, Karen)
      this.preferredVoice = voices.find(v => 
        (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen")) && v.lang.startsWith("en")
      ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    };

    setVoice();
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = setVoice;
    }
  }

  /**
   * Speaks a coaching message via ElevenLabs or Web Speech API
   */
  async speak(text, onComplete = null) {
    if (!text) return;
    console.log("[PaceCast Audio Coach]:", text);

    // Play milestone chime first
    this.playChime();

    // If user provided ElevenLabs key, try ElevenLabs streaming
    if (this.elevenLabsApiKey) {
      try {
        const success = await this.speakElevenLabs(text, onComplete);
        if (success) return;
      } catch (err) {
        console.warn("ElevenLabs failed, falling back to Web Speech:", err);
      }
    }

    // Default: Web Speech API (100% offline, zero-latency)
    if (!this.speechSynth) {
      if (onComplete) onComplete();
      return;
    }

    this.speechSynth.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = 1.02; // Slightly brisk, athletic pace
    utterance.pitch = 1.0;
    utterance.volume = this.volume;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onComplete) onComplete();
    };

    this.isSpeaking = true;
    this.speechSynth.speak(utterance);
  }

  async speakElevenLabs(text, onComplete) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenLabsVoiceId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) return false;

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (onComplete) onComplete();
    };
    audio.play();
    return true;
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
    // Play dual harmonic chime: E5 (659Hz) -> G#5 (830Hz)
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
   * Cadence Metronome (Tick at e.g. 170 BPM)
   */
  startMetronome(bpm = 170) {
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

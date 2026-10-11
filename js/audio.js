// PaceCast - Advanced Audio Engine
// Features: Generative Adaptive Music (Lo-Fi, Synthwave, Forest Ambient), 
// Audio Ducking, Stride Metronome & Google Gemma 2 Athletic Voice Coach.

class PaceAudioEngine {
  constructor() {
    this.speechSynth = window.speechSynthesis;
    this.audioCtx = null;
    this.duckingGain = null;
    this.musicGain = null;
    
    // Playback State
    this.isMusicPlaying = false;
    this.selectedTrack = "lofi"; // "lofi", "synthwave", "ambient", "click", "mute"
    this.musicVolume = 0.75;
    this.targetCadence = 172;
    this.bpm = 86; // half-time for lofi
    this.schedulerTimer = null;
    this.nextNoteTime = 0.0;
    this.currentStep = 0;
    this.noiseBuffer = null;
    
    // Voice State
    this.preferredVoice = null;
    this.isSpeaking = false;
    this.voiceVolume = 1.0;
    this.onSpeakingChange = null;
    this.onBeat = null;

    this.initAudioContext();
    this.loadVoices();
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();

        // Music Ducking Chain: [Music Generators] -> duckingGain -> musicGain -> destination
        this.duckingGain = this.audioCtx.createGain();
        this.duckingGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);

        this.duckingGain.connect(this.musicGain);
        this.musicGain.connect(this.audioCtx.destination);

        // Pre-render a 1-second white noise buffer for drums & wind
        const sampleRate = this.audioCtx.sampleRate;
        this.noiseBuffer = this.audioCtx.createBuffer(1, sampleRate, sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      }
    } catch (e) {
      console.warn("AudioContext initialization warning:", e);
    }
  }

  loadVoices() {
    if (!this.speechSynth) return;
    const setVoice = () => {
      const voices = this.speechSynth.getVoices();
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

    // Professional Audio Ducking: Smoothly dip background music when coach speaks
    if (this.audioCtx && this.duckingGain) {
      const now = this.audioCtx.currentTime;
      this.duckingGain.gain.cancelScheduledValues(now);
      if (speaking) {
        // Dip music down to 18% so coach advice is crystal clear
        this.duckingGain.gain.setTargetAtTime(0.18, now, 0.08);
      } else {
        // Smoothly swell music back to 100%
        this.duckingGain.gain.setTargetAtTime(1.0, now, 0.35);
      }
    }
  }

  /**
   * Speaks a coaching message with Web Speech API & harmonic chime
   */
  async speak(text, onComplete = null) {
    if (!text) return;
    console.log("[PaceCast Audio Coach]:", text);

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

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
    utterance.volume = this.voiceVolume;

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
    gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /* ======================================================================
     MUSIC ENGINE: Generative Web Audio Soundtracks
     ====================================================================== */

  setMusicTrack(trackName) {
    this.selectedTrack = trackName;
    console.log("[PaceCast Music]: Switched track to", trackName);
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.audioCtx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioCtx.currentTime, 0.05);
    }
  }

  startMusic(trackName = null, cadence = 172) {
    this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    if (trackName) this.selectedTrack = trackName;
    this.targetCadence = cadence;
    
    // Tempo mapping
    if (this.selectedTrack === "lofi") {
      this.bpm = cadence / 2; // half-time feel ~86 BPM
    } else if (this.selectedTrack === "synthwave") {
      this.bpm = cadence; // 1:1 energetic pulse
    } else if (this.selectedTrack === "ambient") {
      this.bpm = 55; // slow meditative flow
    } else {
      this.bpm = cadence;
    }

    this.stopMusic();
    if (this.selectedTrack === "mute") return;

    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.audioCtx ? this.audioCtx.currentTime + 0.05 : 0;

    // Chris Wilson Lookahead Scheduler loop (every 30ms)
    this.schedulerTimer = setInterval(() => {
      this.scheduleLoop();
    }, 30);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  // Backwards compatibility methods
  startMetronome(bpm = 172) {
    this.startMusic(this.selectedTrack, bpm);
  }

  stopMetronome() {
    this.stopMusic();
  }

  scheduleLoop() {
    if (!this.isMusicPlaying || !this.audioCtx) return;
    const lookahead = 0.15; // 150ms scheduling window
    const currentTime = this.audioCtx.currentTime;

    while (this.nextNoteTime < currentTime + lookahead) {
      this.dispatchMusicStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    // 16th note duration in seconds
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4.0; 

    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop (64 steps)
  }

  dispatchMusicStep(step, time) {
    if (this.selectedTrack === "mute") return;

    if (this.selectedTrack === "click") {
      // Woodblock click on quarter notes
      if (step % 4 === 0) {
        this.playWoodblock(time, step % 16 === 0);
      }
      return;
    }

    if (this.selectedTrack === "lofi") {
      this.playLofiStep(step, time);
    } else if (this.selectedTrack === "synthwave") {
      this.playSynthwaveStep(step, time);
    } else if (this.selectedTrack === "ambient") {
      this.playAmbientStep(step, time);
    }
  }

  /* ----------------------------------------------------------------------
     Track 1: Autumn Lo-Fi Chill Beats (Warm Rhodes, sub-bass & chill groove)
     ---------------------------------------------------------------------- */
  playLofiStep(step, time) {
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Lo-Fi Chord Progression (Dm9 -> Bbmaj7 -> C9 -> Am7)
    const chords = [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [116.54, 146.83, 174.61, 220.00, 293.66], // Bbmaj7
      [130.81, 164.81, 196.00, 233.08, 293.66], // C9
      [110.00, 130.81, 164.81, 196.00, 261.63]  // Am7
    ];
    const bassNotes = [73.42, 58.27, 65.41, 55.00]; // D1, Bb0, C1, A0

    // Rhodes Electric Piano Chords on beat 0 and syncopated beat 10
    if (stepInBar === 0) {
      this.playRhodesChord(chords[bar], time, 1.3);
      this.playSubBass(bassNotes[bar], time, 0.9);
      this.playLofiKick(time);
    } else if (stepInBar === 6) {
      this.playLofiKick(time, 0.5);
    } else if (stepInBar === 8) {
      // Snare / rimshot on beat 2
      this.playLofiSnare(time);
    } else if (stepInBar === 10) {
      this.playRhodesChord(chords[bar], time, 0.7, 0.15);
      this.playLofiKick(time, 0.7);
    } else if (stepInBar === 14) {
      // Sub-bass glide pickup
      this.playSubBass(bassNotes[bar] * 1.5, time, 0.25, 0.12);
    }

    // Relaxed Swing Hi-Hat on even 16th notes
    if (stepInBar % 2 === 0) {
      const isAccent = (stepInBar % 4 === 0);
      this.playLofiHat(time, isAccent ? 0.05 : 0.025);
    }
  }

  /* ----------------------------------------------------------------------
     Track 2: Synthwave Horizon Run (16th rolling bass, 80s brass & electro kick)
     ---------------------------------------------------------------------- */
  playSynthwaveStep(step, time) {
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // Rolling 16th Bassline roots (D, F, C, G)
    const bassRoots = [73.42, 87.31, 65.41, 49.00];
    const root = bassRoots[bar];
    const octave = (stepInBar % 2 === 0) ? root : root * 2;
    this.playSynthwaveBass(octave, time);

    // Four-on-the-floor electro kick
    if (stepInBar % 4 === 0) {
      this.playPunchyKick(time);
    }

    // Snappy gated electronic snare on beats 2 & 4
    if (stepInBar === 4 || stepInBar === 12) {
      this.playGatedSnare(time);
    }

    // Upbeat open hi-hat
    if (stepInBar % 4 === 2) {
      this.playElectroHat(time);
    }

    // Soaring 80s Synth Chords on bar start & offbeats
    if (stepInBar === 0 || stepInBar === 6) {
      const chords = [
        [220.00, 261.63, 293.66, 349.23], // Dm
        [174.61, 220.00, 261.63, 349.23], // F
        [196.00, 261.63, 329.63, 392.00], // C
        [196.00, 246.94, 293.66, 392.00]  // G
      ];
      this.playSynthwavePad(chords[bar], time, stepInBar === 0 ? 0.7 : 0.4);
    }
  }

  /* ----------------------------------------------------------------------
     Track 3: Zen Forest Trail Ambient (Meditative pads, chimes & canopy wind)
     ---------------------------------------------------------------------- */
  playAmbientStep(step, time) {
    const stepInBar = step % 16;

    // Slow ambient pad changes every 16 steps (1 bar)
    if (stepInBar === 0) {
      const ambientChords = [
        [110.00, 164.81, 220.00, 261.63, 329.63], // Am9
        [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7
        [130.81, 196.00, 261.63, 329.63, 392.00], // Cmaj9
        [98.00, 146.83, 196.00, 246.94, 293.66]   // G6
      ];
      const bar = Math.floor(step / 16);
      this.playAmbientDrone(ambientChords[bar], time, 3.8);
    }

    // Zen Forest Chimes randomly bell at peaceful intervals
    if (step === 4 || step === 20 || step === 36 || step === 52) {
      const chimePitches = [880.00, 1046.50, 1318.51, 1567.98, 1760.00];
      const note = chimePitches[Math.floor(Math.random() * chimePitches.length)];
      this.playWindChime(note, time);
    }

    // Gentle canopy rustle breeze
    if (stepInBar === 0) {
      this.playCanopyWind(time, 3.5);
    }
  }

  /* ======================================================================
     SYNTHESIS MODULES (Web Audio DSP with Warm Lowpass Filters & Envelopes)
     ====================================================================== */

  playRhodesChord(frequencies, time, duration, gainLevel = 0.22) {
    if (!this.audioCtx || !this.duckingGain) return;

    frequencies.forEach((freq, idx) => {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      // Warm vintage lowpass filter
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(850 + idx * 40, time);
      filter.Q.setValueAtTime(1.2, time);

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, time);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq + 0.6, time); // warm chorus detune

      // Smooth attack & warm decay
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(gainLevel / frequencies.length, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.duckingGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    });
  }

  playSubBass(freq, time, duration, gainLevel = 0.28) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, time);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(gainLevel, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playLofiKick(time, gainLevel = 0.35) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  playLofiSnare(time) {
    if (!this.audioCtx || !this.duckingGain || !this.noiseBuffer) return;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1900, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  playLofiHat(time, gainLevel = 0.04) {
    if (!this.audioCtx || !this.duckingGain || !this.noiseBuffer) return;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6800, time);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  playPunchyKick(time) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.09);

    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  playGatedSnare(time) {
    if (!this.audioCtx || !this.duckingGain || !this.noiseBuffer) return;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1100, time);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  playElectroHat(time) {
    if (!this.audioCtx || !this.duckingGain || !this.noiseBuffer) return;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    noise.start(time);
    noise.stop(time + 0.1);
  }

  playSynthwaveBass(freq, time) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, time);
    filter.frequency.exponentialRampToValueAtTime(320, time + 0.1);
    filter.Q.setValueAtTime(3.5, time);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  playSynthwavePad(chords, time, duration) {
    if (!this.audioCtx || !this.duckingGain) return;

    chords.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, time);
      filter.Q.setValueAtTime(1.0, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.duckingGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  playAmbientDrone(chords, time, duration) {
    if (!this.audioCtx || !this.duckingGain) return;

    chords.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const gain = this.audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(550, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.duckingGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  playWindChime(freq, time) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.07, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

    osc.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + 1.9);
  }

  playCanopyWind(time, duration) {
    if (!this.audioCtx || !this.duckingGain || !this.noiseBuffer) return;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, time);
    filter.frequency.linearRampToValueAtTime(380, time + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(220, time + duration);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.05, time + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingGain);

    noise.start(time);
    noise.stop(time + duration);
  }

  playWoodblock(time, accent = false) {
    if (!this.audioCtx || !this.duckingGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(accent ? 920 : 640, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.025);

    gain.gain.setValueAtTime(accent ? 0.08 : 0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    osc.connect(gain);
    gain.connect(this.duckingGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }
}

window.paceAudio = new PaceAudioEngine();

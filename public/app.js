// ==============================================================
// AMAZON RELAY DISPATCH AI COPILOT - MINIMALIST WORKSPACE CONTROLLER
// 100% Automated Voice & SMS, Auto-Pilot, Desktop Alerts, CSV Export & Accents
// ==============================================================

/**
 * TabAudioCoordinator: Guarantees that only ONE active/focused browser tab
 * plays voice and audio effects across the entire machine, eliminating multi-tab echo.
 */
class TabAudioCoordinator {
  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.storageKey = 'relay_audio_master_lease';
    this.audioChannel = null;

    if ('BroadcastChannel' in window) {
      try {
        this.audioChannel = new BroadcastChannel('relay_audio_coordinator');
        this.audioChannel.onmessage = (e) => {
          if (e.data?.type === 'CLAIM_MASTER' && e.data?.tabId !== this.tabId) {
            // Another tab explicitly claimed focus/master
            if (window.dispatchApp?.sound) {
              window.dispatchApp.sound.stopAllAudio();
            }
          }
        };
      } catch (e) {}
    }

    this.claimMaster();

    // Re-claim leadership on user interaction or tab focus
    window.addEventListener('focus', () => this.claimMaster());
    document.addEventListener('click', () => this.claimMaster(), { passive: true });
    document.addEventListener('keydown', () => this.claimMaster(), { passive: true });
    window.addEventListener('beforeunload', () => this.releaseMaster());

    // Continuous heartbeat every 1 second
    setInterval(() => {
      if (this.isMaster()) {
        this.writeLease(this.tabId);
      }
    }, 1000);
  }

  claimMaster() {
    this.writeLease(this.tabId);
    if (this.audioChannel) {
      try {
        this.audioChannel.postMessage({ type: 'CLAIM_MASTER', tabId: this.tabId });
      } catch (e) {}
    }
  }

  releaseMaster() {
    try {
      const lease = this.readLease();
      if (lease && lease.tabId === this.tabId) {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {}
  }

  writeLease(tabId) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ tabId, timestamp: Date.now() }));
    } catch (e) {}
  }

  readLease() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  isMaster() {
    // If tab is in background and hidden, it shouldn't hold master over an active tab
    if (document.hidden) {
      return false;
    }
    const lease = this.readLease();
    if (!lease) {
      this.claimMaster();
      return true;
    }
    if (lease.tabId === this.tabId) {
      return true;
    }
    // If previous master is stale (> 2.5s old), current active tab takes over
    if (Date.now() - lease.timestamp > 2500) {
      this.claimMaster();
      return true;
    }
    return false;
  }
}

class SoundEngine {
  constructor() {
    this.coordinator = new TabAudioCoordinator();
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.95;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.audioPlayer = null;
    this.currentSpeechId = 0;
    this.selectedVoice = 'en-US-GuyNeural';
    this.voices = [];
    this.selectedVoiceIndex = 0;
    this.onVoicesReady = null;

    this.loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
        if (this.onVoicesReady) this.onVoicesReady(this.getRankedVoices());
      };
    }
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  loadVoices() {
    if ('speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  getRankedVoices() {
    return [
      { id: 'en-US-GuyNeural', name: 'Guy (Natural American Male Dispatcher)' },
      { id: 'en-US-ChristopherNeural', name: 'Christopher (Natural American Male Driver)' },
      { id: 'en-US-EricNeural', name: 'Eric (Clear American Male Operator)' },
      { id: 'en-US-AriaNeural', name: 'Aria (Natural American Female)' },
      { id: 'en-US-JennyNeural', name: 'Jenny (Conversational American Female)' },
      { id: 'en-US-SteffanNeural', name: 'Steffan (Crisp American Male)' }
    ];
  }

  setSelectedVoice(voiceName) {
    this.selectedVoice = voiceName || 'en-US-GuyNeural';
  }

  setRate(r) { this.rate = Math.max(0.7, Math.min(1.4, parseFloat(r) || 1.0)); }
  setPitch(p) { this.pitch = Math.max(0.7, Math.min(1.3, parseFloat(p) || 1.0)); }

  playTone(freq, type, durationMs) {
    if (this.isMuted || !this.coordinator.isMaster()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {}
  }

  playRingTone() {
    if (this.isMuted || !this.coordinator.isMaster()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      gain.gain.setValueAtTime(this.volume * 0.12, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }

  playConnectedBeep() { this.playTone(880, 'sine', 180); }
  playSilenceTick() { this.playTone(550, 'triangle', 50); }
  playHangupTone() { this.playTone(320, 'sawtooth', 300); }

  playChimeAlert() {
    if (this.isMuted || !this.coordinator.isMaster()) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 200);
        }, idx * 100);
      });
    } catch (e) {}
  }

  stopAllAudio() {
    this.currentSpeechId = (this.currentSpeechId || 0) + 1;
    if (this.audioPlayer) {
      try {
        this.audioPlayer.onended = null;
        this.audioPlayer.onerror = null;
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.audioPlayer.removeAttribute('src');
      } catch (e) {}
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  isPlaying() {
    return !!(this.audioPlayer && !this.audioPlayer.paused && !this.audioPlayer.ended && this.audioPlayer.currentTime > 0);
  }

  /**
   * Speaks text using 100% natural Microsoft Edge Neural TTS
   * Single-stream guaranteed, 0% overlap, 0% echo across all browser tabs.
   */
  speakText(text, speaker = 'AI', onEndCallback = null) {
    if (this.isMuted || !text || !text.trim()) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Single-tab election: Secondary/unfocused tabs suppress audio output completely
    if (!this.coordinator.isMaster()) {
      console.log('[SoundEngine] Secondary tab audio playback suppressed (echo prevention active).');
      if (onEndCallback) {
        const estDuration = Math.max(1200, text.trim().length * 75);
        setTimeout(onEndCallback, estDuration);
      }
      return;
    }

    // 1. Instantly kill any previous audio element or speech synthesis
    this.stopAllAudio();
    this.getAudioContext();

    const thisSpeechId = ++this.currentSpeechId;
    const cleanedText = text.trim();
    let isFinished = false;
    let safetyWatchdog = null;

    const finishHandler = () => {
      if (isFinished || thisSpeechId !== this.currentSpeechId) return;
      isFinished = true;
      if (safetyWatchdog) clearTimeout(safetyWatchdog);
      if (onEndCallback) onEndCallback();
    };

    if (!this.audioPlayer) {
      this.audioPlayer = new Audio();
    }

    const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanedText)}&speaker=${encodeURIComponent(speaker)}`;
    this.audioPlayer.volume = this.volume;
    this.audioPlayer.src = ttsUrl;

    this.audioPlayer.onended = () => {
      if (thisSpeechId === this.currentSpeechId) {
        finishHandler();
      }
    };

    this.audioPlayer.onerror = (err) => {
      console.warn('[SoundEngine] Audio load notice, proceeding safely:', err);
      if (thisSpeechId === this.currentSpeechId) {
        finishHandler();
      }
    };

    // Watchdog timer: ensures conversation never hangs if network slows
    const estimatedDurationMs = Math.max(2200, (cleanedText.length * 85) + 2200);
    safetyWatchdog = setTimeout(() => {
      if (thisSpeechId === this.currentSpeechId && !isFinished) {
        finishHandler();
      }
    }, estimatedDurationMs);

    const playPromise = this.audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        if (e.name !== 'AbortError') {
          console.warn('[SoundEngine] Audio play error:', e.message);
        }
        if (thisSpeechId === this.currentSpeechId) {
          finishHandler();
        }
      });
    }
  }
}

class DispatchApp {
  constructor() {
    this.sound = new SoundEngine();
    this.recognition = null;
    this.isMicActive = false;
    this.isAISpeaking = false;
    this.isAutoPilotOn = false;
    this.silenceTimer = null;
    this.silenceRemaining = 2.5;
    this.driverSpokenBuffer = '';
    this.isInteractiveCall = false;
    this.currentInteractiveTourId = null;
    this.driverSearchTerm = '';
    this.driverStatusFilter = 'all';

    // Audio Replay states
    this.isAudioReplayActive = false;
    this.activeReplayTarget = null; // 'console' | 'modal'
    this.replayCurrentIndex = 0;
    this.currentModalTranscript = [];

    this.state = {
      tours: [],
      pendingReports: [],
      allReports: [],
      activeCall: null,
      config: null,
      filterStatus: 'pending'
    };

    this.initElements();
    this.initVoiceSelector();
    this.initSpeechRecognition();
    this.initEvents();
    this.initSSE();
    this.loadInitialData();
  }

  initElements() {
    // Navigation Tabs & Indicators
    this.tabBtns = document.querySelectorAll('.nav-tab');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.badgeStoppedCount = document.getElementById('badgeStoppedCount');
    this.badgePendingCount = document.getElementById('badgePendingCount');
    this.liveCallIndicator = document.getElementById('liveCallIndicator');

    // Smart Priority Banner
    this.smartPriorityBanner = document.getElementById('smartPriorityBanner');
    this.bannerTitle = document.getElementById('bannerTitle');
    this.bannerSub = document.getElementById('bannerSub');
    this.bannerBtnCall = document.getElementById('bannerBtnCall');
    this.bannerBtnChat = document.getElementById('bannerBtnChat');
    this.bannerBtnWA = document.getElementById('bannerBtnWA');

    // Tab 1: Stopped Loads
    this.stoppedLoadsContainer = document.getElementById('stoppedLoadsContainer');
    this.emptyStoppedState = document.getElementById('emptyStoppedState');
    this.btnSimulateTour = document.getElementById('btnSimulateTour');

    // Tab 2: Live Console
    this.btnPlayFullRecording = document.getElementById('btnPlayFullRecording');
    this.btnTakeOverCall = document.getElementById('btnTakeOverCall');
    this.btnResumeAICall = document.getElementById('btnResumeAICall');
    this.btnFinishAndDraft = document.getElementById('btnFinishAndDraft');
    this.btnForceHangup = document.getElementById('btnForceHangup');
    this.btnQuickDemoCall = document.getElementById('btnQuickDemoCall');
    this.btnQuickInteractiveCall = document.getElementById('btnQuickInteractiveCall');
    this.btnQuickDemoChat = document.getElementById('btnQuickDemoChat');
    this.idleActionButtons = document.getElementById('idleActionButtons');
    this.callStatusBadge = document.getElementById('callStatusBadge');
    this.targetDriverName = document.getElementById('targetDriverName');
    this.targetDriverMeta = document.getElementById('targetDriverMeta');
    this.turnCountBadge = document.getElementById('turnCountBadge');
    this.consoleModeSub = document.getElementById('consoleModeSub');
    this.waveformBars = document.getElementById('waveformBars');
    this.waveformStatus = document.getElementById('waveformStatus');
    this.silenceCountdown = document.getElementById('silenceCountdown');
    this.silenceProgress = document.getElementById('silenceProgress');
    this.transcriptScroll = document.getElementById('transcriptScroll');
    this.btnMicToggle = document.getElementById('btnMicToggle');
    this.micIcon = document.getElementById('micIcon');
    this.micText = document.getElementById('micText');
    this.isHumanTakeover = false;

    // Tab 3: Approvals
    this.btnExportCSV = document.getElementById('btnExportCSV');
    this.btnFilterPending = document.getElementById('btnFilterPending');
    this.btnFilterAll = document.getElementById('btnFilterAll');
    this.pendingReportsContainer = document.getElementById('pendingReportsContainer');
    this.emptyApprovalsState = document.getElementById('emptyApprovalsState');

    // Tab 4: All Fleet Loads
    this.driverSearchInput = document.getElementById('driverSearchInput');
    this.btnClearDriverSearch = document.getElementById('btnClearDriverSearch');
    this.chipAllLoads = document.getElementById('chipAllLoads');
    this.chipStoppedLoads = document.getElementById('chipStoppedLoads');
    this.chipInTransitLoads = document.getElementById('chipInTransitLoads');
    this.driversListContainer = document.getElementById('driversListContainer');

    // Header Controls
    this.btnAudioToggle = document.getElementById('btnAudioToggle');
    this.audioIcon = document.getElementById('audioIcon');
    this.btnAutoPilotToggle = document.getElementById('btnAutoPilotToggle');
    this.apIcon = document.getElementById('apIcon');
    this.apText = document.getElementById('apText');
    this.btnOpenConfigModal = document.getElementById('btnOpenConfigModal');

    // Settings Modal
    this.configModal = document.getElementById('configModal');
    this.btnCloseConfigModal = document.getElementById('btnCloseConfigModal');
    this.btnCancelConfig = document.getElementById('btnCancelConfig');
    this.btnSaveConfig = document.getElementById('btnSaveConfig');
    this.cfgFormalOpening = document.getElementById('cfgFormalOpening');
    this.cfgFormalClosing = document.getElementById('cfgFormalClosing');
    this.cfgSilenceWindow = document.getElementById('cfgSilenceWindow');
    this.cfgSafetyTimeout = document.getElementById('cfgSafetyTimeout');
    this.cfgVoiceSpeed = document.getElementById('cfgVoiceSpeed');
    this.cfgVoicePitch = document.getElementById('cfgVoicePitch');
    this.valVoiceSpeed = document.getElementById('valVoiceSpeed');
    this.valVoicePitch = document.getElementById('valVoicePitch');
    this.btnPreviewTunedVoice = document.getElementById('btnPreviewTunedVoice');
    this.btnLaunchRelayLogin = document.getElementById('btnLaunchRelayLogin');
    this.btnLaunchOpenPhoneLogin = document.getElementById('btnLaunchOpenPhoneLogin');
    this.inputGeminiKey = document.getElementById('inputGeminiKey');
    this.btnSaveGeminiKey = document.getElementById('btnSaveGeminiKey');
    this.voiceSelector = document.getElementById('voiceSelector');
    this.questionsContainer = document.getElementById('questionsContainer');

    // Transcript Modal
    this.transcriptModal = document.getElementById('transcriptModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalTranscriptBody = document.getElementById('modalTranscriptBody');
    this.btnModalPlayAudio = document.getElementById('btnModalPlayAudio');
    this.btnCloseTranscriptModal = document.getElementById('btnCloseTranscriptModal');
    this.toastContainer = document.getElementById('toastContainer');
  }

  switchTab(tabId) {
    if (!this.tabBtns || !this.tabPanels) return;
    this.stopFullCallRecording();
    this.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
    this.tabPanels.forEach(p => p.classList.toggle('active', p.id === tabId));
  }

  initVoiceSelector() {
    if (!this.voiceSelector) return;
    const updateDropdown = (voices) => {
      if (!this.voiceSelector) return;
      this.voiceSelector.innerHTML = '';
      if (voices.length === 0) {
        this.voiceSelector.innerHTML = '<option value="">Default Voice</option>';
        return;
      }
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.text = `${v.name.replace(/Microsoft|Google|English|United States/gi, '').trim()}`;
        if (i === 0) opt.selected = true;
        this.voiceSelector.appendChild(opt);
      });
    };

    this.sound.onVoicesReady = updateDropdown;
    const initialVoices = this.sound.getRankedVoices();
    if (initialVoices.length > 0) updateDropdown(initialVoices);

    this.voiceSelector.addEventListener('change', (e) => {
      this.sound.setSelectedVoice(e.target.value);
      this.showToast(`Voice set: ${e.target.value}`, 'info');
    });
  }

  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        if (!this.isAISpeaking && !this.sound.isPlaying() && this.isInteractiveCall) {
          this.setWaveformState('idle', 'WAITING FOR DRIVER (SPEAK FREELY)...');
        }
      };

      this.recognition.onspeechstart = () => {
        // Driver started making sound - strictly ignore if AI is speaking or audio is outputting
        if (this.isAISpeaking || this.sound.isPlaying()) return;
        this.resetSilenceCountdown();
        this.setWaveformState('speaking-driver', 'DRIVER SPEAKING (LISTENING...)');
      };

      this.recognition.onresult = (event) => {
        if (this.isAISpeaking || this.sound.isPlaying()) return;

        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalChunk = event.results[i][0].transcript.trim();
            if (finalChunk) {
              // Acoustic echo suppression gate: discard chunks matching recent AI dispatcher speech
              const lowerChunk = finalChunk.toLowerCase();
              if (this.lastAISpeech && lowerChunk.length > 6 && (this.lastAISpeech.includes(lowerChunk) || lowerChunk.includes('amazon relay') || lowerChunk.includes('dispatch'))) {
                console.log('[SpeechRec] Filtered acoustic speaker bleed:', finalChunk);
                continue;
              }
              if (this.isHumanTakeover) {
                const turn = {
                  speaker: 'Operator',
                  text: finalChunk,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                };
                this.appendTranscriptTurn(turn);
              } else {
                this.driverSpokenBuffer = (this.driverSpokenBuffer ? this.driverSpokenBuffer + ' ' : '') + finalChunk;
              }
            }
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (!this.isHumanTakeover) {
          this.resetSilenceCountdown();
          const currentLive = interimTranscript.trim() || this.driverSpokenBuffer;
          if (currentLive) {
            this.setWaveformState('speaking-driver', `DRIVER: "${currentLive}"`);
          }
        } else {
          if (interimTranscript.trim()) {
            this.setWaveformState('speaking-driver', `OPERATOR: "${interimTranscript.trim()}"`);
          }
        }
      };

      this.recognition.onspeechend = () => {
        if (!this.isAISpeaking && !this.sound.isPlaying() && this.isMicActive && this.isInteractiveCall) {
          // Driver paused or finished a phrase
          this.resetSilenceCountdown();
        }
      };

      this.recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[SpeechRec] Error:', e.error);
        }
      };

      this.recognition.onend = () => {
        // NEVER restart if AI is currently speaking or audio is playing (Strict Half-duplex lock)
        if (this.isMicActive && !this.isAISpeaking && !this.sound.isPlaying() && this.isInteractiveCall) {
          setTimeout(() => {
            try {
              if (this.isMicActive && !this.isAISpeaking && !this.sound.isPlaying() && this.isInteractiveCall) {
                this.recognition.start();
              }
            } catch(e){}
          }, 200);
        }
      };
    }
  }

  resetSilenceCountdown() {
    this.cancelSilenceTimer();
    const silenceLimit = this.state.config?.voiceRules?.silenceWindowSeconds || 2.5;
    this.silenceRemaining = silenceLimit;

    if (this.silenceCountdown) this.silenceCountdown.innerText = `${this.silenceRemaining.toFixed(1)}s`;
    if (this.silenceProgress) this.silenceProgress.style.width = '100%';

    const intervalMs = 100;
    this.silenceTimer = setInterval(() => {
      this.silenceRemaining = Math.max(0, this.silenceRemaining - intervalMs / 1000);
      if (this.silenceCountdown) this.silenceCountdown.innerText = `${this.silenceRemaining.toFixed(1)}s`;
      const pct = (this.silenceRemaining / silenceLimit) * 100;
      if (this.silenceProgress) this.silenceProgress.style.width = `${pct}%`;

      if (this.silenceRemaining <= 0) {
        this.cancelSilenceTimer();
        if (this.silenceCountdown) this.silenceCountdown.innerText = 'Safe to reply';
        if (this.silenceProgress) this.silenceProgress.style.width = '0%';
        this.finalizeDriverTurnAndReply();
      }
    }, intervalMs);
  }

  cancelSilenceTimer() {
    if (this.silenceTimer) {
      clearInterval(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  async finalizeDriverTurnAndReply() {
    if (this.isAISpeaking || this.sound.isPlaying() || !this.isInteractiveCall) return;

    const fullDriverStatement = (this.driverSpokenBuffer || '').trim();
    this.driverSpokenBuffer = '';

    if (!fullDriverStatement) {
      this.inaudibleAttempts = (this.inaudibleAttempts || 0) + 1;
      console.log(`[Interactive Call] Inaudible / Silence detected (Attempt ${this.inaudibleAttempts})`);

      if (this.inaudibleAttempts === 1) {
        const clarify1 = "Sorry, I didn't catch that clearly. Could you speak up a bit and confirm why you're stopped?";
        this.appendTranscriptTurn({ speaker: 'AI', text: clarify1, timestamp: new Date().toLocaleTimeString() });
        this.speakAISpeech(clarify1);
        return;
      } else if (this.inaudibleAttempts === 2) {
        const clarify2 = "Dispatch checking in. Are you in a safe location, or do you need emergency roadside dispatched?";
        this.appendTranscriptTurn({ speaker: 'AI', text: clarify2, timestamp: new Date().toLocaleTimeString() });
        this.speakAISpeech(clarify2);
        return;
      } else {
        const timeoutMsg = "Unable to establish clear audio communication. Dispatch will message you directly on Relay. Drive safe.";
        this.appendTranscriptTurn({ speaker: 'AI', text: timeoutMsg, timestamp: new Date().toLocaleTimeString() });
        this.speakAISpeech(timeoutMsg, () => this.finalizeInteractiveCall());
        return;
      }
    }

    // Clear inaudible attempts once clear words are received
    this.inaudibleAttempts = 0;

    // 1. Post ONE unified, clean Driver turn
    const turn = {
      speaker: 'Driver',
      text: fullDriverStatement,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.appendTranscriptTurn(turn);

    // 2. Lock half-duplex immediately so AI can formulate response without mic interference
    this.isAISpeaking = true;
    if (this.recognition) {
      try { this.recognition.abort(); } catch(e){}
    }
    this.setWaveformState('speaking-ai', 'AI FORMULATING CONTEXTUAL RESPONSE...');

    // 3. Collect conversation history
    const turnElements = this.transcriptScroll.querySelectorAll('.turn-box');
    const transcript = [];
    turnElements.forEach(el => {
      const isAI = el.classList.contains('ai');
      const text = el.querySelector('.turn-bubble-chat')?.innerText || '';
      if (text) {
        transcript.push({ speaker: isAI ? 'AI' : 'Driver', text });
      }
    });

    try {
      const res = await fetch('/api/calls/interactive-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: this.currentInteractiveTourId || 'TOU-984210',
          transcript
        })
      });

      const data = await res.json();
      const nextSpeech = data.nextSpeech || "Got that logged with dispatch. Appreciate the update, drive safe.";
      const isClosing = Boolean(data.isClosing);

      this.appendTranscriptTurn({
        speaker: 'AI',
        text: nextSpeech,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      this.speakAISpeech(nextSpeech, () => {
        if (isClosing) {
          this.finalizeInteractiveCall();
        }
      });
    } catch (err) {
      const fallbackSpeech = "Got that logged with dispatch. Appreciate the update, drive safe.";
      this.appendTranscriptTurn({ speaker: 'AI', text: fallbackSpeech, timestamp: new Date().toLocaleTimeString() });
      this.speakAISpeech(fallbackSpeech, () => this.finalizeInteractiveCall());
    }
  }

  speakAISpeech(text, onEndCallback = null) {
    this.isAISpeaking = true;
    this.lastAISpeech = (text || '').toLowerCase().trim();
    this.cancelSilenceTimer();
    this.driverSpokenBuffer = '';

    // Strictly abort speech recognition while AI is speaking
    if (this.recognition) {
      try { this.recognition.abort(); } catch(e){}
    }
    this.setWaveformState('speaking-ai', 'AI DISPATCHER SPEAKING (MIC MUTED)');

    this.sound.speakText(text, 'AI', () => {
      // 700ms room reverb cushion before reopening the microphone
      setTimeout(() => {
        if (this.isInteractiveCall) {
          this.isAISpeaking = false;
          this.driverSpokenBuffer = '';
          if (this.isMicActive && this.recognition) {
            try { this.recognition.start(); } catch(e){}
          }
          this.setWaveformState('idle', 'WAITING FOR DRIVER (YOUR TURN TO SPEAK)');
        } else {
          this.isAISpeaking = false;
        }
        if (onEndCallback) onEndCallback();
      }, 700);
    });
  }

  finalizeInteractiveCall() {
    this.setWaveformState('idle', 'CALL COMPLETED');
    this.callStatusBadge.className = 'hud-status-badge';
    this.callStatusBadge.innerText = 'COMPLETED';
    this.btnForceHangup.classList.add('hidden');
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.add('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
    this.isHumanTakeover = false;
    this.sound.playHangupTone();
    this.stopMic();
    this.isInteractiveCall = false;
    this.showToast('✅ Interactive Call finished. Delay report drafted!', 'success');
  }

  initEvents() {
    // Navigation Tabs Switching
    if (this.tabBtns) {
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          if (tabId) this.switchTab(tabId);
        });
      });
    }

    // Audio controls
    if (this.btnAudioToggle) {
      this.btnAudioToggle.addEventListener('click', () => {
        this.sound.isMuted = !this.sound.isMuted;
        this.audioIcon.innerText = this.sound.isMuted ? '🔇' : '🔊';
        this.showToast(this.sound.isMuted ? 'Voice audio muted' : 'Voice audio enabled', 'info');
      });
    }

    // Auto-Pilot Toggle
    if (this.btnAutoPilotToggle) {
      this.btnAutoPilotToggle.addEventListener('click', () => this.toggleAutoPilot());
    }

    // Tab 4: Search & Filter Chips for All Fleet
    if (this.driverSearchInput) {
      this.driverSearchInput.addEventListener('input', (e) => {
        this.driverSearchTerm = e.target.value.trim().toLowerCase();
        if (this.btnClearDriverSearch) {
          this.btnClearDriverSearch.classList.toggle('hidden', !this.driverSearchTerm);
        }
        this.renderFleetList();
      });
    }

    if (this.btnClearDriverSearch) {
      this.btnClearDriverSearch.addEventListener('click', () => {
        this.driverSearchInput.value = '';
        this.driverSearchTerm = '';
        this.btnClearDriverSearch.classList.add('hidden');
        this.renderFleetList();
      });
    }

    const filterChips = [this.chipAllLoads, this.chipStoppedLoads, this.chipInTransitLoads];
    filterChips.forEach(chip => {
      if (!chip) return;
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c && c.classList.remove('active'));
        chip.classList.add('active');
        this.driverStatusFilter = chip.getAttribute('data-filter') || 'all';
        this.renderFleetList();
      });
    });

    if (this.btnSimulateTour) {
      this.btnSimulateTour.addEventListener('click', () => this.simulateTour());
    }

    // Full Call Audio Replay
    if (this.btnPlayFullRecording) {
      this.btnPlayFullRecording.addEventListener('click', () => this.toggleConsoleAudioReplay());
    }
    if (this.btnModalPlayAudio) {
      this.btnModalPlayAudio.addEventListener('click', () => this.toggleModalAudioReplay());
    }

    // Tab 2: Console Actions & Human Takeover
    if (this.btnTakeOverCall) this.btnTakeOverCall.addEventListener('click', () => this.startHumanTakeover());
    if (this.btnResumeAICall) this.btnResumeAICall.addEventListener('click', () => this.resumeAICall());
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.addEventListener('click', () => this.finishAndDraftReport());
    if (this.btnForceHangup) this.btnForceHangup.addEventListener('click', () => this.forceHangup());

    if (this.btnQuickDemoCall) {
      this.btnQuickDemoCall.addEventListener('click', () => this.triggerAutoCall('TOU-984210'));
    }
    if (this.btnQuickInteractiveCall) {
      this.btnQuickInteractiveCall.addEventListener('click', () => this.startInteractiveCall('TOU-984210'));
    }
    if (this.btnQuickDemoChat) {
      this.btnQuickDemoChat.addEventListener('click', () => this.triggerAutoChat('TOU-984210'));
    }

    // Accent & Driver Style Test Scenario Buttons
    document.querySelectorAll('.accent-scenario-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = e.currentTarget.getAttribute('data-scenario');
        if (scenario) {
          const stoppedTour = this.state.tours.find(t => t.currentStatus === 'STOPPED' || t.isDelayed);
          const targetTourId = stoppedTour ? stoppedTour.tourId : 'TOU-984210';
          this.triggerAutoCall(targetTourId, scenario);
          this.switchTab('tab-console');
        }
      });
    });

    // Mic Toggle
    if (this.btnMicToggle) {
      this.btnMicToggle.addEventListener('click', () => {
        if (!this.isMicActive) this.startMic();
        else this.stopMic();
      });
    }

    // Tab 3: Approval Actions & CSV Export
    if (this.btnExportCSV) this.btnExportCSV.addEventListener('click', () => this.exportReportsCSV());
    if (this.btnFilterPending) {
      this.btnFilterPending.addEventListener('click', () => {
        this.state.filterStatus = 'pending';
        this.btnFilterPending.className = 'btn btn-primary btn-sm';
        this.btnFilterAll.className = 'btn btn-secondary btn-sm';
        this.renderApprovals();
      });
    }
    if (this.btnFilterAll) {
      this.btnFilterAll.addEventListener('click', () => {
        this.state.filterStatus = 'all';
        this.btnFilterAll.className = 'btn btn-primary btn-sm';
        this.btnFilterPending.className = 'btn btn-secondary btn-sm';
        this.renderApprovals();
      });
    }

    // Config Modal
    if (this.btnOpenConfigModal) this.btnOpenConfigModal.addEventListener('click', () => this.configModal.classList.remove('hidden'));
    if (this.btnCloseConfigModal) this.btnCloseConfigModal.addEventListener('click', () => this.configModal.classList.add('hidden'));
    if (this.btnCancelConfig) this.btnCancelConfig.addEventListener('click', () => this.configModal.classList.add('hidden'));
    if (this.btnSaveConfig) this.btnSaveConfig.addEventListener('click', () => this.saveConfiguration());
    if (this.btnLaunchRelayLogin) this.btnLaunchRelayLogin.addEventListener('click', () => this.launchSessionLogin('relay'));
    if (this.btnLaunchOpenPhoneLogin) this.btnLaunchOpenPhoneLogin.addEventListener('click', () => this.launchSessionLogin('openphone'));
    if (this.btnSaveGeminiKey) this.btnSaveGeminiKey.addEventListener('click', () => this.saveGeminiKey());

    // Voice Tuning Sliders
    if (this.cfgVoiceSpeed && this.valVoiceSpeed) {
      this.cfgVoiceSpeed.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value).toFixed(2);
        this.valVoiceSpeed.innerText = `${v}x`;
        this.sound.setRate(v);
      });
    }
    if (this.cfgVoicePitch && this.valVoicePitch) {
      this.cfgVoicePitch.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value).toFixed(2);
        this.valVoicePitch.innerText = `${v}x`;
        this.sound.setPitch(v);
      });
    }
    if (this.btnPreviewTunedVoice) {
      this.btnPreviewTunedVoice.addEventListener('click', () => {
        this.sound.speakText("Amazon Relay Dispatch audio test. Voice speed and pitch confirmed.", 'AI');
      });
    }

    // Transcript Modal
    if (this.btnCloseTranscriptModal) {
      this.btnCloseTranscriptModal.addEventListener('click', () => {
        this.stopFullCallRecording();
        this.transcriptModal.classList.add('hidden');
      });
    }
    if (this.transcriptModal) {
      this.transcriptModal.addEventListener('click', (e) => {
        if (e.target === this.transcriptModal) {
          this.stopFullCallRecording();
          this.transcriptModal.classList.add('hidden');
        }
      });
    }
  }

  startHumanTakeover() {
    this.isHumanTakeover = true;
    this.isAISpeaking = false;
    this.cancelSilenceTimer();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.startMic();
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.add('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.remove('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.remove('hidden');
    this.setWaveformState('speaking-driver', '👤 OPERATOR IN CONTROL (AI MUTED - SPEAK FREELY)');
    this.callStatusBadge.className = 'hud-status-badge active';
    this.callStatusBadge.innerText = 'HUMAN OVERRIDE';
    this.showToast('👤 Human Takeover Activated: AI muted. Speak directly to driver.', 'warning');
  }

  resumeAICall() {
    this.isHumanTakeover = false;
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.remove('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
    this.setWaveformState('idle', 'WAITING FOR DRIVER (AI ACTIVE)');
    this.callStatusBadge.innerText = 'LIVE MIC INQUIRY';
    this.showToast('🤖 Control returned to AI Dispatch Copilot.', 'info');
    this.finalizeDriverTurnAndReply();
  }

  async finishAndDraftReport() {
    this.showToast('Compiling official Amazon Delay Report from conversation...', 'info');
    this.finalizeInteractiveCall();

    const turnElements = this.transcriptScroll.querySelectorAll('.turn-box');
    const transcript = [];
    turnElements.forEach(el => {
      const isAI = el.classList.contains('ai');
      const isOp = el.classList.contains('operator');
      const speaker = isAI ? 'AI' : isOp ? 'Operator' : 'Driver';
      const text = el.querySelector('.turn-bubble-chat')?.innerText || '';
      if (text) transcript.push({ speaker, text });
    });

    try {
      const res = await fetch('/api/calls/interactive-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: this.currentInteractiveTourId || 'TOU-984210',
          transcript,
          forceFinalize: true
        })
      });
      const data = await res.json();
      if (data.draftReport) {
        this.fetchReports();
        this.showToast('✅ Delay report drafted in Approval Queue!', 'success');
      }
    } catch(e){}
  }

  injectQuickPrompt(type) {
    const prompts = {
      mileMarker: "Can you confirm your exact mile marker and highway direction?",
      trailerSeal: "Can you confirm your trailer number and seal integrity?",
      authRoadside: "Dispatch has authorized emergency roadside service. Stand by for technician.",
      confirmSafety: "Dispatch checking in. Are you and the equipment in a safe location?"
    };
    const text = prompts[type] || "Please provide an operational status update.";
    this.injectCustomWhisper(text);
  }

  injectCustomWhisper(text) {
    if (!text) return;
    this.appendTranscriptTurn({
      speaker: 'AI',
      text: `[Operator Whisper]: ${text}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    this.speakAISpeech(text);
    this.showToast(`🗣️ Injected Operator Whisper: "${text}"`, 'info');
  }

  async toggleAutoPilot() {
    const nextState = !this.isAutoPilotOn;
    try {
      const res = await fetch('/api/settings/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
      const data = await res.json();
      if (data.success) {
        this.isAutoPilotOn = data.enabled;
        this.updateAutoPilotUI();
        this.showToast(this.isAutoPilotOn ? '⚡ Auto-Pilot ENABLED: Autonomous monitoring active!' : '⚡ Auto-Pilot PAUSED.', 'info');
      }
    } catch (e) {
      this.showToast('Auto-Pilot toggle error', 'error');
    }
  }

  updateAutoPilotUI() {
    if (this.isAutoPilotOn) {
      this.btnAutoPilotToggle.className = 'btn btn-success btn-sm';
      this.apText.innerText = 'Auto-Pilot: ON';
    } else {
      this.btnAutoPilotToggle.className = 'btn btn-secondary btn-sm';
      this.apText.innerText = 'Auto-Pilot: OFF';
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        this.showToast('🔔 Desktop Notifications enabled!', 'success');
      } else {
        this.showToast('Notifications permission denied.', 'error');
      }
    }
  }

  showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'favicon.ico'
        });
      } catch(e) {}
    }
  }

  exportReportsCSV() {
    this.showToast('📊 Downloading Amazon Relay Reports CSV...', 'info');
    window.location.href = '/api/reports/export.csv';
  }

  async startMic() {
    if (!this.recognition) {
      this.showToast('Microphone recognition not supported in this browser. Please use Chrome/Edge.', 'error');
      return;
    }

    // Acquire audio stream with hardware acoustic echo cancellation & noise suppression
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            googEchoCancellation: true,
            googAutoGainControl: true,
            googNoiseSuppression: true,
            googHighpassFilter: true
          }
        });
      } catch (e) {
        console.warn('[Microphone] getUserMedia echo-cancellation notice:', e.message);
      }
    }

    this.isMicActive = true;
    this.btnMicToggle.className = 'btn btn-danger btn-sm';
    this.micIcon.innerText = '🔴';
    this.micText.innerText = 'Mic Active (Speak naturally)';
    if (!this.isAISpeaking) {
      try { this.recognition.start(); } catch(e) {}
    }
    this.showToast('🎤 Microphone Active (Acoustic Echo Cancellation ON)', 'info');
  }

  stopMic() {
    this.isMicActive = false;
    this.driverSpokenBuffer = '';
    this.cancelSilenceTimer();
    if (this.recognition) {
      try { this.recognition.abort(); } catch(e){}
    }
    this.btnMicToggle.className = 'btn btn-secondary btn-sm';
    this.micIcon.innerText = '🎙️';
    this.micText.innerText = 'Optional: Test with Your Mic';
  }

  // ==============================================================
  // REAL-TIME SSE FEED
  // ==============================================================
  initSSE() {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('INITIAL_STATE', (e) => {
      const data = JSON.parse(e.data);
      this.state.tours = data.tours || [];
      this.state.activeCall = data.activeCall || null;
      this.state.pendingReports = data.pendingReports || [];
      this.state.allReports = data.allReports || [];
      this.state.config = data.config || null;
      this.updateAllViews();
    });

    eventSource.addEventListener('AUTOPILOT_TOGGLED', (e) => {
      const { enabled } = JSON.parse(e.data);
      this.isAutoPilotOn = enabled;
      this.updateAutoPilotUI();
    });

    eventSource.addEventListener('TOUR_UPDATED', (e) => {
      const tour = JSON.parse(e.data);
      const idx = this.state.tours.findIndex(t => t.tourId === tour.tourId);
      if (idx !== -1) this.state.tours[idx] = tour;
      else this.state.tours.unshift(tour);
      this.updateAllViews();
    });

    eventSource.addEventListener('UNRESPONSIVE_ALERT', (e) => {
      const { tour, message } = JSON.parse(e.data);
      const idx = this.state.tours.findIndex(t => t.tourId === tour.tourId);
      if (idx !== -1) this.state.tours[idx] = tour;
      this.sound.playChimeAlert();
      this.showToast(`⚠️ ${message}`, 'warning');
      this.updateAllViews();
    });

    eventSource.addEventListener('AUTOREDIAL_TRIGGERED', (e) => {
      const { tour, attempt } = JSON.parse(e.data);
      this.showToast(`📞 Auto-Redial Attempt #${attempt} triggered for ${tour.driverName}`, 'info');
      this.switchTab('tab-console');
    });

    eventSource.addEventListener('CALL_STARTED', (e) => {
      const call = JSON.parse(e.data);
      this.state.activeCall = call;
      this.switchTab('tab-console');
      if (this.liveCallIndicator) this.liveCallIndicator.classList.remove('hidden');
      if (this.idleActionButtons) this.idleActionButtons.classList.add('hidden');
      this.renderLiveCallView(call);
      this.sound.playRingTone();
      this.showToast(`📞 Dialing ${call.driverName}...`, 'info');
    });

    eventSource.addEventListener('CALL_STATUS_CHANGE', (e) => {
      const call = JSON.parse(e.data);
      this.state.activeCall = call;
      if (call.status === 'CONNECTED') this.sound.playConnectedBeep();
      this.renderLiveCallView(call);
    });

    eventSource.addEventListener('TRANSCRIPT_UPDATE', (e) => {
      const { turn, transcript } = JSON.parse(e.data);
      if (this.state.activeCall) this.state.activeCall.transcript = transcript;
      this.appendTranscriptTurn(turn);
      if (!this.isAudioReplayActive && !this.isInteractiveCall) {
        this.sound.speakText(turn.text, turn.speaker);
      }
    });

    eventSource.addEventListener('CHAT_STARTED', (e) => {
      const chat = JSON.parse(e.data);
      this.switchTab('tab-console');
      if (this.liveCallIndicator) this.liveCallIndicator.classList.remove('hidden');
      if (this.idleActionButtons) this.idleActionButtons.classList.add('hidden');
      this.callStatusBadge.className = 'hud-status-badge active';
      this.callStatusBadge.innerText = 'AUTO-SMS RUNNING';
      this.targetDriverName.innerText = `Driver: ${chat.driverName} (${chat.tourId})`;
      this.targetDriverMeta.innerText = `📱 Automated Text Inquiry Active`;
      this.transcriptScroll.innerHTML = '';
      this.showToast(`💬 Automated SMS started with ${chat.driverName}`, 'info');
    });

    eventSource.addEventListener('CHAT_MESSAGE', (e) => {
      const { turn } = JSON.parse(e.data);
      this.appendTranscriptTurn(turn);
    });

    eventSource.addEventListener('CHAT_ENDED', () => {
      if (this.liveCallIndicator) this.liveCallIndicator.classList.add('hidden');
      if (this.idleActionButtons) this.idleActionButtons.classList.remove('hidden');
      this.callStatusBadge.className = 'hud-status-badge';
      this.callStatusBadge.innerText = 'SMS COMPLETE';
      this.showToast(`✅ Auto-SMS complete. Delay report drafted!`, 'success');
    });

    eventSource.addEventListener('DRIVER_SPEAKING_START', () => {
      this.setWaveformState('speaking-driver', 'DRIVER SPEAKING (AI MUTED)');
    });

    eventSource.addEventListener('SILENCE_WINDOW_START', (e) => {
      const { silenceWindowSeconds } = JSON.parse(e.data);
      this.setWaveformState('silence', `DRIVER FINISHED. WAITING ${silenceWindowSeconds}s...`);
    });

    eventSource.addEventListener('SILENCE_TICK', (e) => {
      const { silenceRemaining } = JSON.parse(e.data);
      this.silenceCountdown.innerText = `${silenceRemaining}s`;
      const max = this.state.config?.voiceRules?.silenceWindowSeconds || 2.5;
      const pct = Math.max(0, (silenceRemaining / max) * 100);
      this.silenceProgress.style.width = `${pct}%`;
      this.sound.playSilenceTick();
    });

    eventSource.addEventListener('SILENCE_WINDOW_COMPLETE', () => {
      this.silenceCountdown.innerText = 'Safe to reply';
      this.silenceProgress.style.width = '0%';
      this.setWaveformState('speaking-ai', 'AI SPOKEN TURN');
    });

    eventSource.addEventListener('CALL_ENDED', () => {
      this.state.activeCall = null;
      if (this.liveCallIndicator) this.liveCallIndicator.classList.add('hidden');
      if (this.idleActionButtons) this.idleActionButtons.classList.remove('hidden');
      this.sound.playHangupTone();
      this.setWaveformState('idle', 'CALL ENDED');
      this.callStatusBadge.className = 'hud-status-badge';
      this.callStatusBadge.innerText = 'COMPLETED';
      this.btnForceHangup.classList.add('hidden');
      if (this.btnTakeOverCall) this.btnTakeOverCall.classList.add('hidden');
      if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
      if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
      this.showToast(`Call ended. Delay report drafted!`, 'success');
    });

    eventSource.addEventListener('REPORT_DRAFTED', (e) => {
      const { report } = JSON.parse(e.data);
      this.sound.playChimeAlert();
      this.showDesktopNotification('🚨 New Amazon Relay Delay Report', `Tour ${report?.tourId || ''} (${report?.driverName || 'Driver'}) is pending your review.`);
      this.fetchReports();
      this.showToast(`🚨 New Delay Report ready in Approval Queue!`, 'warning');
    });

    eventSource.addEventListener('REPORT_ADDED', () => this.fetchReports());
    eventSource.addEventListener('REPORT_UPDATED', () => this.fetchReports());
    eventSource.addEventListener('REPORT_SUBMITTED', (e) => {
      const report = JSON.parse(e.data);
      this.showToast(`✅ Confirmed: Tour ${report.tourId} committed to Relay.`, 'success');
      this.fetchReports();
    });
    eventSource.addEventListener('REPORT_COPIED', () => this.fetchReports());
    eventSource.addEventListener('REPORT_DISCARDED', () => this.fetchReports());
  }

  async loadInitialData() {
    await this.fetchConfig();
    await this.fetchTours();
    await this.fetchReports();
    this.initRetryTicker();
  }

  initRetryTicker() {
    setInterval(() => {
      const tickerElements = document.querySelectorAll('.retry-ticker');
      tickerElements.forEach(el => {
        const targetMs = parseInt(el.getAttribute('data-target'), 10);
        if (targetMs) {
          const remainingSec = Math.max(0, Math.round((targetMs - Date.now()) / 1000));
          const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
          const ss = String(remainingSec % 60).padStart(2, '0');
          el.innerText = `${mm}:${ss}`;
          if (remainingSec === 0) {
            el.innerText = 'Redialing...';
          }
        }
      });
    }, 1000);
  }

  updateAllViews() {
    this.updateMetrics();
    this.updateSmartPriorityBanner();
    this.renderStoppedLoads();
    this.renderFleetList();
    this.renderApprovals();
    if (this.state.activeCall) this.renderLiveCallView(this.state.activeCall);
    if (this.state.config) this.renderConfig(this.state.config);
  }

  updateMetrics() {
    const totalTours = this.state.tours.length;
    const stoppedTours = this.state.tours.filter(t => t.currentStatus === 'STOPPED' || t.isDelayed);
    const pendingReports = this.state.allReports.filter(r => r.status === 'PENDING_APPROVAL');

    if (this.badgeStoppedCount) this.badgeStoppedCount.innerText = stoppedTours.length;
    if (this.badgePendingCount) this.badgePendingCount.innerText = pendingReports.length;
  }

  updateSmartPriorityBanner() {
    if (!this.smartPriorityBanner) return;
    const stopped = this.state.tours.find(t => t.currentStatus === 'STOPPED' || t.isDelayed);
    if (!stopped) {
      this.smartPriorityBanner.classList.add('hidden');
      return;
    }

    this.smartPriorityBanner.classList.remove('hidden');
    const stoppedMin = stopped.stoppedDurationMinutes || 25;
    this.bannerTitle.innerText = `${stopped.driverName} (${stopped.tourId}) stopped on ${stopped.location || 'Route'}`;
    this.bannerSub.innerText = `Stopped for ${stoppedMin}m • Gate: ${stopped.scheduledArrival || '14:30 EST'} (Late Risk)`;

    const cleanPhone = (stopped.driverPhone || '').replace(/[^0-9+]/g, '');
    const waMsg = encodeURIComponent(`Hello ${stopped.driverName}, this is Amazon Relay Dispatch regarding Tour ${stopped.tourId}. Please confirm your status and ETA.`);

    if (this.bannerBtnCall) {
      this.bannerBtnCall.onclick = () => {
        this.triggerAutoCall(stopped.tourId);
        this.switchTab('tab-console');
      };
    }
    if (this.bannerBtnChat) {
      this.bannerBtnChat.onclick = () => {
        this.triggerAutoChat(stopped.tourId);
        this.switchTab('tab-console');
      };
    }
    if (this.bannerBtnWA) {
      this.bannerBtnWA.href = `https://wa.me/${cleanPhone}?text=${waMsg}`;
    }
  }

  // ==============================================================
  // TAB 1: STOPPED & AT-RISK LOADS (PRIMARY WORKSPACE)
  // ==============================================================
  async fetchTours() {
    try {
      const res = await fetch('/api/tours');
      const data = await res.json();
      if (data.success) {
        this.state.tours = data.tours;
        this.updateAllViews();
      }
    } catch (e) {}
  }

  renderStoppedLoads() {
    if (!this.stoppedLoadsContainer) return;
    this.stoppedLoadsContainer.innerHTML = '';
    const stoppedTours = this.state.tours.filter(t => t.currentStatus === 'STOPPED' || t.isDelayed);

    if (stoppedTours.length === 0) {
      if (this.emptyStoppedState) this.emptyStoppedState.classList.remove('hidden');
      return;
    }

    if (this.emptyStoppedState) this.emptyStoppedState.classList.add('hidden');

    stoppedTours.forEach(tour => {
      const stoppedMin = tour.stoppedDurationMinutes || 25;
      const cleanPhone = (tour.driverPhone || '').replace(/[^0-9+]/g, '');
      const waMsg = encodeURIComponent(`Hello ${tour.driverName}, this is Amazon Relay Dispatch regarding Tour ${tour.tourId}. Please confirm your current status and ETA.`);

      let urgencyHtml = stoppedMin >= 30
        ? `<span class="urgency-badge high">🔴 CRITICAL RISK</span>`
        : `<span class="urgency-badge moderate">🟡 MODERATE DELAY</span>`;

      const isUnresponsive = tour.callStatus === 'UNRESPONSIVE_SMS_SENT' && tour.retryScheduledAt;
      const remainingSec = isUnresponsive ? Math.max(0, Math.round((tour.retryScheduledAt - Date.now()) / 1000)) : 0;
      const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
      const ss = String(remainingSec % 60).padStart(2, '0');

      const card = document.createElement('div');
      card.className = 'stopped-card';
      card.innerHTML = `
        <div class="card-header-bar">
          <div>
            <a href="https://relay.amazon.com/tours/${tour.tourId}" target="_blank" rel="noopener noreferrer" class="relay-link mono" title="Open in Amazon Relay Portal">
              🔗 ${tour.tourId}
            </a>
            ${urgencyHtml}
          </div>
          <span class="hud-status-badge active" style="color:var(--color-red); border-color:rgba(239,68,68,0.4);">
            ${isUnresponsive ? 'SMS SENT (3m RETRY)' : `STOPPED (${stoppedMin}m)`}
          </span>
        </div>

        ${isUnresponsive ? `
          <div style="background-color:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:6px 10px; font-size:0.78rem; color:var(--color-amber); font-weight:700; display:flex; justify-content:space-between; align-items:center;">
            <span>⚠️ Driver Unresponsive • SMS Sent • Redial in <span class="mono retry-ticker" data-target="${tour.retryScheduledAt}">${mm}:${ss}</span></span>
            <div style="display:flex; gap:4px;">
              <button class="btn btn-warning btn-xs" onclick="window.dispatchApp.redialNow('${tour.tourId}')">📞 Redial Now</button>
              <button class="btn btn-ghost btn-xs" onclick="window.dispatchApp.cancelRetry('${tour.tourId}')">✕ Cancel</button>
            </div>
          </div>
        ` : ''}

        <div class="driver-profile-row">
          <div class="driver-icon-badge">🚚</div>
          <div>
            <div class="driver-name-text">${tour.driverName}</div>
            <div class="sub-text">📞 ${tour.driverPhone || 'N/A'} • 🚛 Tractor: ${tour.truckId || 'VOL-8821'}</div>
          </div>
        </div>

        <div class="load-meta-grid">
          <div class="meta-item">
            <span class="lbl">Current Location</span>
            <span class="val">📍 ${tour.location || 'In Transit'}</span>
          </div>
          <div class="meta-item">
            <span class="lbl">Scheduled Gate Time</span>
            <span class="val">⏰ ${tour.scheduledArrival || '14:30 EST'}</span>
          </div>
        </div>

        <div class="card-action-bar">
          <button class="btn btn-primary btn-sm" onclick="window.dispatchApp.triggerAutoCall('${tour.tourId}'); window.dispatchApp.switchTab('tab-console');">
            📞 1-Click AI Call
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.dispatchApp.triggerAutoChat('${tour.tourId}'); window.dispatchApp.switchTab('tab-console');">
            💬 SMS Inquiry
          </button>
          <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-sm" title="Direct WhatsApp">
            📲 WA
          </a>
        </div>
      `;
      this.stoppedLoadsContainer.appendChild(card);
    });
  }

  async redialNow(tourId) {
    try {
      this.showToast(`Redialing driver for tour ${tourId}...`, 'info');
      await fetch(`/api/tours/${tourId}/redial-now`, { method: 'POST' });
      this.switchTab('tab-console');
    } catch (e) {
      this.showToast(`Redial error: ${e.message}`, 'error');
    }
  }

  async cancelRetry(tourId) {
    try {
      await fetch(`/api/tours/${tourId}/cancel-retry`, { method: 'POST' });
      this.showToast('Scheduled retry cancelled.', 'info');
    } catch (e) {}
  }

  // ==============================================================
  // TAB 4: ALL FLEET LOADS LIST
  // ==============================================================
  renderFleetList() {
    if (!this.driversListContainer) return;
    this.driversListContainer.innerHTML = '';
    let tours = [...this.state.tours];

    if (this.driverStatusFilter === 'stopped') {
      tours = tours.filter(t => t.currentStatus === 'STOPPED' || t.isDelayed);
    } else if (this.driverStatusFilter === 'transit') {
      tours = tours.filter(t => t.currentStatus === 'IN_TRANSIT' && !t.isDelayed);
    }

    if (this.driverSearchTerm) {
      const q = this.driverSearchTerm;
      tours = tours.filter(t =>
        (t.driverName || '').toLowerCase().includes(q) ||
        (t.tourId || '').toLowerCase().includes(q) ||
        (t.truckId || '').toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q)
      );
    }

    if (tours.length === 0) {
      this.driversListContainer.innerHTML = `<div class="empty-notice" style="grid-column: 1 / -1;">No fleet loads match your filter.</div>`;
      return;
    }

    tours.forEach(tour => {
      const isStopped = tour.currentStatus === 'STOPPED' || tour.isDelayed;
      const cleanPhone = (tour.driverPhone || '').replace(/[^0-9+]/g, '');
      const waMsg = encodeURIComponent(`Hello ${tour.driverName}, this is Amazon Relay Dispatch regarding Tour ${tour.tourId}. Please confirm status.`);

      const card = document.createElement('div');
      card.className = `fleet-card ${isStopped ? 'stopped' : ''}`;
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <a href="https://relay.amazon.com/tours/${tour.tourId}" target="_blank" class="relay-link mono">🔗 ${tour.tourId}</a>
          <span class="hud-status-badge ${isStopped ? 'active' : ''}">${isStopped ? 'STOPPED' : 'IN TRANSIT'}</span>
        </div>
        <div style="font-weight:700; color:var(--text-primary); font-size:0.92rem;">
          ${tour.driverName} <span style="font-weight:normal; font-size:0.75rem; color:var(--text-muted);">(🚛 ${tour.truckId || 'Tractor'})</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted);">
          📍 ${tour.location || 'In Transit'} • ⏰ Gate: ${tour.scheduledArrival || '14:30 EST'}
        </div>
        <div style="display:flex; gap:6px; margin-top:4px;">
          <button class="btn btn-primary btn-xs" onclick="window.dispatchApp.triggerAutoCall('${tour.tourId}'); window.dispatchApp.switchTab('tab-console');">📞 Call</button>
          <button class="btn btn-secondary btn-xs" onclick="window.dispatchApp.triggerAutoChat('${tour.tourId}'); window.dispatchApp.switchTab('tab-console');">💬 SMS</button>
          <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="btn btn-whatsapp btn-xs" style="text-decoration:none;">📲 WA</a>
        </div>
      `;
      this.driversListContainer.appendChild(card);
    });
  }

  async triggerAutoCall(tourId, scenarioType = null) {
    try {
      this.isInteractiveCall = false;
      this.stopMic(); // Make sure microphone is closed during automated calls to prevent any echo
      this.stopFullCallRecording();
      const scenarioLabel = scenarioType ? ` (${scenarioType.replace(/_/g, ' ')})` : '';
      this.showToast(`Dialing driver for Tour ${tourId}${scenarioLabel}...`, 'info');
      await fetch('/api/calls/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId, scenarioType })
      });
    } catch (err) {
      this.showToast(`Call error: ${err.message}`, 'error');
    }
  }

  async triggerAutoChat(tourId) {
    try {
      this.showToast(`Starting automated SMS inquiry for ${tourId}...`, 'info');
      await fetch('/api/chat/automated-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourId })
      });
    } catch (err) {
      this.showToast(`Chat error: ${err.message}`, 'error');
    }
  }

  async simulateTour() {
    try {
      const res = await fetch('/api/tours/simulate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        this.sound.playChimeAlert();
        this.showToast(`🚨 Simulated stopped tour added: ${data.tour.tourId}`, 'warning');
        this.fetchTours();
      }
    } catch (err) {}
  }

  // ==============================================================
  // COLUMN 2: CONSOLE VIEW
  // ==============================================================
  renderLiveCallView(call) {
    if (!call) return;
    this.btnForceHangup.classList.remove('hidden');
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.remove('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
    this.callStatusBadge.className = 'hud-status-badge active';
    this.callStatusBadge.innerText = call.status.replace(/_/g, ' ');

    this.targetDriverName.innerText = `Driver: ${call.driverName} (${call.tourId})`;
    this.targetDriverMeta.innerText = `📞 ${call.driverPhone} | 🚛 Tractor: ${call.truckId || 'N/A'}`;

    if (call.transcript && call.transcript.length === 0) {
      this.transcriptScroll.innerHTML = '';
    }
  }

  appendTranscriptTurn(turn) {
    const empty = document.getElementById('transcriptEmptyNotice');
    if (empty) empty.remove();

    const turnDiv = document.createElement('div');
    turnDiv.className = `turn-box ${turn.speaker.toLowerCase()}`;
    turnDiv.innerHTML = `
      <div class="turn-meta">
        <span>${turn.speaker === 'AI' ? '🤖 Relay AI' : turn.speaker === 'Operator' ? '👤 Dispatcher' : '🚚 Driver'}</span>
        <span class="sub-text">${turn.timestamp || ''}</span>
      </div>
      <div class="turn-bubble-chat">${this.escapeHtml(turn.text)}</div>
    `;

    this.transcriptScroll.appendChild(turnDiv);
    this.transcriptScroll.scrollTop = this.transcriptScroll.scrollHeight;

    const count = this.transcriptScroll.querySelectorAll('.turn-box').length;
    if (this.turnCountBadge) {
      this.turnCountBadge.innerText = `${count} Turns`;
    }

    if (turn.speaker === 'AI') {
      this.setWaveformState('speaking-ai', 'AI ACTIVE TURN');
    }
  }

  // ==============================================================
  // FULL CALL AUDIO REPLAY ENGINE
  // ==============================================================
  toggleConsoleAudioReplay() {
    if (this.isAudioReplayActive && this.activeReplayTarget === 'console') {
      this.stopFullCallRecording();
      return;
    }

    let turns = [];
    const turnElements = this.transcriptScroll.querySelectorAll('.turn-box');
    if (turnElements.length > 0) {
      turnElements.forEach(el => {
        const isAI = el.classList.contains('ai');
        const isOp = el.classList.contains('operator');
        const speaker = isAI ? 'AI' : isOp ? 'Operator' : 'Driver';
        const text = el.querySelector('.turn-bubble-chat')?.innerText || '';
        if (text) turns.push({ speaker, text });
      });
    } else if (this.state.activeCall?.transcript?.length > 0) {
      turns = this.state.activeCall.transcript;
    } else if (this.state.allReports?.length > 0 && this.state.allReports[0].transcript?.length > 0) {
      turns = this.state.allReports[0].transcript;
      this.transcriptScroll.innerHTML = '';
      turns.forEach(t => this.appendTranscriptTurn(t));
      const r = this.state.allReports[0];
      this.targetDriverName.innerText = `Driver: ${r.driverName} (${r.tourId})`;
      this.targetDriverMeta.innerText = `Recorded Call • ${turns.length} turns`;
    }

    if (turns.length === 0) {
      this.showToast('No call conversation recorded yet. Launch an AI call demo first!', 'warning');
      return;
    }

    this.startSequentialAudio(turns, this.transcriptScroll, this.btnPlayFullRecording, 'console');
  }

  toggleModalAudioReplay() {
    if (this.isAudioReplayActive && this.activeReplayTarget === 'modal') {
      this.stopFullCallRecording();
      return;
    }

    const turns = this.currentModalTranscript || [];
    if (turns.length === 0) {
      this.showToast('No audio turns available for this transcript.', 'warning');
      return;
    }

    this.startSequentialAudio(turns, this.modalTranscriptBody, this.btnModalPlayAudio, 'modal');
  }

  playReportDirectly(reportId) {
    this.viewTranscript(reportId);
    setTimeout(() => {
      this.toggleModalAudioReplay();
    }, 150);
  }

  startSequentialAudio(turns, containerEl, btnEl, targetType) {
    this.stopFullCallRecording();

    // Auto-unmute sound if muted
    if (this.sound.isMuted) {
      this.sound.isMuted = false;
      if (this.audioIcon) this.audioIcon.innerText = '🔊';
    }
    this.sound.getAudioContext()?.resume();

    this.isAudioReplayActive = true;
    this.activeReplayTarget = targetType;

    if (btnEl) {
      btnEl.innerText = '⏹️ Stop Audio';
      btnEl.className = 'btn btn-danger btn-sm';
    }

    this.showToast(`🔊 Playing full conversation (${turns.length} turns)...`, 'info');

    const playTurn = (idx) => {
      if (!this.isAudioReplayActive || idx >= turns.length) {
        this.stopFullCallRecording();
        this.showToast('✅ Call audio playback completed.', 'success');
        return;
      }

      this.replayCurrentIndex = idx;
      const turn = turns[idx];

      // Highlight active turn element in UI
      const boxes = containerEl.querySelectorAll('.turn-box');
      boxes.forEach((b, i) => {
        b.classList.toggle('playing-highlight', i === idx);
        if (i === idx) {
          b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      if (this.waveformBars) {
        this.setWaveformState(turn.speaker === 'AI' ? 'speaking-ai' : 'speaking-driver', `PLAYING [${turn.speaker.toUpperCase()}]: "${turn.text.slice(0, 35)}..."`);
      }

      this.sound.speakText(turn.text, turn.speaker, () => {
        if (!this.isAudioReplayActive) return;
        setTimeout(() => {
          if (this.isAudioReplayActive) {
            playTurn(idx + 1);
          }
        }, 350);
      });
    };

    playTurn(0);
  }

  stopFullCallRecording() {
    this.isAudioReplayActive = false;
    this.activeReplayTarget = null;
    this.sound.stopAllAudio();

    document.querySelectorAll('.turn-box.playing-highlight').forEach(el => el.classList.remove('playing-highlight'));

    if (this.btnPlayFullRecording) {
      this.btnPlayFullRecording.innerText = '🔊 Play Entire Call';
      this.btnPlayFullRecording.className = 'btn btn-secondary btn-sm';
    }

    if (this.btnModalPlayAudio) {
      this.btnModalPlayAudio.innerText = '🔊 Play Audio Recording';
      this.btnModalPlayAudio.className = 'btn btn-primary btn-sm';
    }

    if (this.waveformBars && (!this.state.activeCall || this.state.activeCall.status !== 'IN_CONVERSATION')) {
      this.setWaveformState('idle', 'SYSTEM READY');
    }
  }

  setWaveformState(stateClass, labelText) {
    if (this.waveformBars) this.waveformBars.className = `waveform-anim ${stateClass}`;
    if (this.waveformStatus) this.waveformStatus.innerText = labelText;
  }

  async forceHangup() {
    console.log('[DispatchApp] 🛑 Immediate Operator Force Hangup triggered.');

    // 1. Immediately cancel all speech synthesis and audio playback
    this.stopFullCallRecording();

    // 2. Stop microphone and cancel silence timers
    this.cancelSilenceTimer();
    this.stopMic();

    // 3. Reset internal state flags
    this.isAISpeaking = false;
    this.isInteractiveCall = false;
    this.isHumanTakeover = false;
    this.state.activeCall = null;

    // 4. Immediately update HUD display to TERMINATED state
    this.btnForceHangup.classList.add('hidden');
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.add('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
    this.callStatusBadge.className = 'hud-status-badge';
    this.callStatusBadge.innerText = 'CALL TERMINATED';
    this.targetDriverMeta.innerText = 'Call terminated by operator.';
    this.setWaveformState('idle', 'CALL TERMINATED / IDLE');
    if (this.silenceCountdown) this.silenceCountdown.innerText = '0.0s';
    if (this.silenceProgress) this.silenceProgress.style.width = '0%';

    // 5. Signal backend to terminate Playwright and mock loops
    try {
      await fetch('/api/calls/terminate', { method: 'POST' });
    } catch (err) {}

    this.sound.playHangupTone();
    this.showToast('🛑 Call terminated immediately.', 'info');
  }

  async startInteractiveCall(tourId = 'TOU-984210') {
    const tour = this.state.tours.find(t => t.tourId === tourId) || {
      tourId,
      driverName: 'Marcus Vance',
      driverPhone: '+1 (555) 349-2041',
      truckId: 'VOL-8821',
      location: 'I-80 EB MM 142'
    };

    // If an auto-call was in progress, stop it first
    if (this.state.activeCall) {
      await this.forceHangup();
    }

    this.currentInteractiveTourId = tour.tourId;
    this.isInteractiveCall = true;
    this.isHumanTakeover = false;
    this.state.activeCall = {
      callId: `INT-${Date.now()}`,
      ...tour,
      status: 'IN_CONVERSATION',
      transcript: []
    };

    // Update Console HUD
    this.btnForceHangup.classList.remove('hidden');
    if (this.btnTakeOverCall) this.btnTakeOverCall.classList.remove('hidden');
    if (this.btnResumeAICall) this.btnResumeAICall.classList.add('hidden');
    if (this.btnFinishAndDraft) this.btnFinishAndDraft.classList.add('hidden');
    if (this.consoleModeSub) {
      this.consoleModeSub.innerText = `🎙️ Live Voice Dialogue (Dispatcher Mic Test) with ${tour.driverName}...`;
    }
    this.callStatusBadge.className = 'hud-status-badge active';
    this.callStatusBadge.innerText = 'LIVE MIC INQUIRY';
    this.targetDriverName.innerText = `Driver: ${tour.driverName} (${tour.tourId})`;
    this.targetDriverMeta.innerText = `📞 ${tour.driverPhone} | 🎙️ Interactive Mode (Speak into your mic)`;
    this.transcriptScroll.innerHTML = '';
    if (this.turnCountBadge) {
      this.turnCountBadge.innerText = '0 Turns';
    }

    this.sound.playRingTone();
    setTimeout(async () => {
      this.sound.playConnectedBeep();
      this.isMicActive = true;
      if (this.btnMicToggle) {
        this.btnMicToggle.className = 'btn btn-danger btn-sm';
        this.micIcon.innerText = '🔴';
        this.micText.innerText = 'Mic Active (Speak naturally)';
      }

      // Pre-request microphone hardware permissions with echo cancellation
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              googEchoCancellation: true,
              googAutoGainControl: true,
              googNoiseSuppression: true,
              googHighpassFilter: true
            }
          });
        } catch(e) {}
      }

      const opening = `Hello ${tour.driverName}, this is Amazon Relay Dispatch. Notice your tractor ${tour.truckId || ''} is stopped. Everything okay?`;
      this.appendTranscriptTurn({
        speaker: 'AI',
        text: opening,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      // speakAISpeech will safely open the microphone ONLY AFTER the opening speech finishes
      this.speakAISpeech(opening);
    }, 1200);
  }

  // ==============================================================
  // COLUMN 3: APPROVAL QUEUE (WITH APPOINTMENT WARNINGS)
  // ==============================================================
  async fetchReports() {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        this.state.allReports = data.reports;
        this.renderApprovals();
        this.updateMetrics();
      }
    } catch (err) {}
  }

  renderApprovals() {
    const reports = this.state.filterStatus === 'pending'
      ? this.state.allReports.filter(r => r.status === 'PENDING_APPROVAL')
      : this.state.allReports;

    if (!this.pendingReportsContainer) return;
    this.pendingReportsContainer.innerHTML = '';

    if (reports.length === 0) {
      if (this.emptyApprovalsState) this.emptyApprovalsState.classList.remove('hidden');
      return;
    }

    if (this.emptyApprovalsState) this.emptyApprovalsState.classList.add('hidden');

    reports.forEach(report => {
      const card = document.createElement('div');
      const isPending = report.status === 'PENDING_APPROVAL';
      card.className = `approval-review-card ${!isPending ? 'submitted' : ''}`;

      const categories = [
        "Mechanical Breakdown",
        "Traffic Delay",
        "Mandatory Rest",
        "Facility/Gate Delay",
        "Weather",
        "Unresponsive"
      ];

      const categoryOptions = categories.map(cat =>
        `<option value="${cat}" ${cat === report.category ? 'selected' : ''}>${cat}</option>`
      ).join('');

      card.innerHTML = `
        <div class="approval-card-top">
          <div>
            <a href="https://relay.amazon.com/tours/${report.tourId}" target="_blank" class="relay-link mono" style="font-size:0.95rem;">🔗 ${report.tourId}</a>
            <span style="font-weight:700; color:var(--text-primary); margin-left:8px;">${report.driverName}</span>
          </div>
          <span class="hud-status-badge ${isPending ? 'active' : ''}">
            ${report.status.replace(/_/g, ' ')}
          </span>
        </div>

        ${report.appointmentImpact ? `
          <div style="background-color:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:6px 10px; font-size:0.78rem; color:var(--color-red); font-weight:700;">
            ${this.escapeHtml(report.appointmentImpact)}
          </div>
        ` : ''}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div class="form-group">
            <label>Identified Category</label>
            <select class="form-control-compact" id="cat-${report.id}" ${!isPending ? 'disabled' : ''}>
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Estimated Resume ETA</label>
            <input type="text" class="form-control-compact" id="eta-${report.id}" value="${this.escapeHtml(report.estimatedTimeToResume || '')}" ${!isPending ? 'disabled' : ''}>
          </div>
        </div>

        <div class="form-group">
          <label>Official Amazon Relay Memo</label>
          <textarea class="official-memo-box" rows="3" id="dispNotes-${report.id}" ${!isPending ? 'disabled' : ''}>${this.escapeHtml(report.dispatcherNotes || '')}</textarea>
        </div>

        <div class="approval-action-bar">
          ${isPending ? `
            <button class="btn btn-success btn-sm" onclick="window.dispatchApp.approveAndSubmit('${report.id}')">
              ✓ Approve & Send to Relay
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.dispatchApp.copyReportOnly('${report.id}')">
              📋 Copy Memo
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.dispatchApp.discardReport('${report.id}')">
              ✕ Discard
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" onclick="window.dispatchApp.copyReportOnly('${report.id}')">
              📋 Re-Copy Memo
            </button>
          `}
          <div style="display:flex; gap:6px; margin-left:auto;">
            <button class="btn btn-secondary btn-sm" onclick="window.dispatchApp.playReportDirectly('${report.id}')" title="Play full call conversation audio">
              🔊 Play Audio
            </button>
            <button class="btn btn-ghost btn-sm" onclick="window.dispatchApp.viewTranscript('${report.id}')">
              🔍 Transcript
            </button>
          </div>
        </div>
      `;

      this.pendingReportsContainer.appendChild(card);
    });
  }

  async approveAndSubmit(reportId) {
    const category = document.getElementById(`cat-${reportId}`).value;
    const eta = document.getElementById(`eta-${reportId}`).value;
    const dispatcherNotes = document.getElementById(`dispNotes-${reportId}`).value;

    try {
      this.showToast(`Submitting approved report to Amazon Relay...`, 'info');
      const res = await fetch(`/api/reports/${reportId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, estimatedTimeToResume: eta, dispatcherNotes })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`✅ Submitted & Confirmed on Amazon Relay!`, 'success');
        this.fetchReports();
      }
    } catch (err) {
      this.showToast(`Submission error: ${err.message}`, 'error');
    }
  }

  async copyReportOnly(reportId) {
    try {
      const res = await fetch(`/api/reports/${reportId}/copy`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.formattedMemo) {
        await navigator.clipboard.writeText(data.formattedMemo);
        this.showToast(`📋 Formatted Memo copied!`, 'success');
        this.fetchReports();
      }
    } catch (err) {}
  }

  async discardReport(reportId) {
    if (!confirm('Discard this report?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dismissed by dispatcher' })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Report discarded.`, 'info');
        this.fetchReports();
      }
    } catch (err) {}
  }

  viewTranscript(reportId) {
    const report = this.state.allReports.find(r => r.id === reportId);
    if (!report) return;

    this.stopFullCallRecording();
    this.currentModalTranscript = report.transcript || [];
    this.modalTitle.innerText = `Transcript - Tour ${report.tourId} (${report.driverName})`;
    this.modalTranscriptBody.innerHTML = '';

    if (!report.transcript || report.transcript.length === 0) {
      this.modalTranscriptBody.innerHTML = '<p class="sub-text" style="padding:24px; text-align:center;">No conversation turns recorded.</p>';
      if (this.btnModalPlayAudio) this.btnModalPlayAudio.classList.add('hidden');
    } else {
      if (this.btnModalPlayAudio) this.btnModalPlayAudio.classList.remove('hidden');
      report.transcript.forEach(t => {
        const turnDiv = document.createElement('div');
        turnDiv.className = `turn-box ${t.speaker.toLowerCase()}`;
        turnDiv.innerHTML = `
          <div class="turn-meta">
            <span>${t.speaker === 'AI' ? '🤖 Relay AI' : t.speaker === 'Operator' ? '👤 Dispatcher' : '🚚 ' + report.driverName}</span>
            <span class="sub-text">${t.timestamp || ''}</span>
          </div>
          <div class="turn-bubble-chat">${this.escapeHtml(t.text)}</div>
        `;
        this.modalTranscriptBody.appendChild(turnDiv);
      });
    }

    this.transcriptModal.classList.remove('hidden');
  }

  // ==============================================================
  // CONFIG & SCRIPTS MODAL
  // ==============================================================
  async fetchConfig() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success) {
        this.state.config = data.config;
        this.renderConfig(data.config);
      }
    } catch (err) {}
  }

  renderConfig(cfg) {
    if (!cfg) return;
    if (this.cfgFormalOpening) this.cfgFormalOpening.value = cfg.scripts?.formalOpening || '';
    if (this.cfgFormalClosing) this.cfgFormalClosing.value = cfg.scripts?.formalClosing || '';
    if (this.cfgSilenceWindow) this.cfgSilenceWindow.value = cfg.voiceRules?.silenceWindowSeconds || 2.5;
    if (this.cfgSafetyTimeout) this.cfgSafetyTimeout.value = cfg.voiceRules?.safetyTimeoutSeconds || 75;

    const speechRate = cfg.voiceRules?.speechRate || 0.95;
    const speechPitch = cfg.voiceRules?.speechPitch || 1.00;
    if (this.cfgVoiceSpeed) this.cfgVoiceSpeed.value = speechRate;
    if (this.valVoiceSpeed) this.valVoiceSpeed.innerText = `${speechRate}x`;
    if (this.cfgVoicePitch) this.cfgVoicePitch.value = speechPitch;
    if (this.valVoicePitch) this.valVoicePitch.innerText = `${speechPitch}x`;
    this.sound.setRate(speechRate);
    this.sound.setPitch(speechPitch);

    if (this.questionsContainer) {
      this.questionsContainer.innerHTML = '';
      (cfg.questions || []).forEach((q, idx) => {
        const div = document.createElement('div');
        div.style.marginBottom = '6px';
        div.innerHTML = `
          <div style="font-size:0.7rem; color:var(--color-amber); font-weight:700;">Question #${idx + 1} (${q.field})</div>
          <input type="text" class="form-control" id="cfg-q-${idx}" value="${this.escapeHtml(q.question)}">
        `;
        this.questionsContainer.appendChild(div);
      });
    }
  }

  addEmptyQuestion() {
    if (!this.state.config) return;
    if (!this.state.config.questions) this.state.config.questions = [];
    const count = this.state.config.questions.length + 1;
    this.state.config.questions.push({
      id: `q_${Date.now()}`,
      order: count,
      field: `field_${count}`,
      question: "Can you confirm your current truck location and condition?",
      required: true
    });
    this.renderConfig(this.state.config);
  }

  async saveConfiguration() {
    const questions = (this.state.config?.questions || []).map((q, idx) => ({
      ...q,
      question: document.getElementById(`cfg-q-${idx}`)?.value || q.question
    }));

    const updatedConfig = {
      ...this.state.config,
      scripts: {
        formalOpening: this.cfgFormalOpening?.value?.trim() || '',
        formalClosing: this.cfgFormalClosing?.value?.trim() || '',
        unresponsiveWarning: "Dispatch checking status. Please confirm when safe."
      },
      voiceRules: {
        silenceWindowSeconds: parseFloat(this.cfgSilenceWindow?.value) || 2.5,
        maxWordsPerTurn: 14,
        safetyTimeoutSeconds: parseInt(this.cfgSafetyTimeout?.value, 10) || 75,
        speechRate: parseFloat(this.cfgVoiceSpeed?.value || 0.95),
        speechPitch: parseFloat(this.cfgVoicePitch?.value || 1.0),
        zeroSmallTalk: true
      },
      questions
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (data.success) {
        this.state.config = updatedConfig;
        if (this.configModal) this.configModal.classList.add('hidden');
        this.showToast('✅ Configuration saved immediately!', 'success');
      }
    } catch (err) {}
  }

  async launchSessionLogin(service) {
    const serviceTitle = service === 'relay' ? 'Amazon Relay' : 'OpenPhone';
    const batName = service === 'relay' ? '1-Login-Amazon-Relay.bat' : '2-Login-OpenPhone.bat';
    const targetUrl = service === 'relay' ? 'https://relay.amazon.com/tours/in-transit' : 'https://my.openphone.com';

    this.showToast(`🚀 Opening ${serviceTitle}...`, 'info');
    try {
      await fetch(`/api/sessions/login-${service}`, { method: 'POST' });
    } catch (e) {}

    // Open direct tab in user's browser
    window.open(targetUrl, '_blank');
    this.showToast(`💡 Tip: You can also double-click "${batName}" on your Desktop to open the dedicated session window!`, 'success');
  }

  async saveGeminiKey() {
    const key = this.inputGeminiKey.value.trim();
    if (!key) return this.showToast('Please enter an API key.', 'error');
    try {
      const res = await fetch('/api/gemini/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('✅ Gemini API Key saved!', 'success');
        this.inputGeminiKey.value = '';
      }
    } catch (err) {}
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dispatchApp = new DispatchApp();
});

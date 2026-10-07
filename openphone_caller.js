const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const geminiService = require('./gemini_service');
const ttsService = require('./tts_service');
const dotenv = require('dotenv');
dotenv.config();

class OpenPhoneCaller {
  constructor(config) {
    this.config = config || this.loadConfig();
    this.sessionDir = path.resolve(__dirname, 'openphone_session');
    this.openphoneUrl = process.env.OPENPHONE_ACCOUNT_URL || 'https://my.openphone.com';
    this.isMockMode = process.env.MOCK_MODE === 'true';
    this.headless = process.env.HEADLESS_BROWSER === 'true';
    this.browserContext = null;
    this.page = null;
    this.activeCall = null;
    this.callHistory = [];
    this.listeners = [];
    this.isAborted = false;
    this.sleepResolvers = [];

    // Ensure session directory exists
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  loadConfig() {
    try {
      const configPath = path.resolve(__dirname, 'dispatch_config.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[OpenPhoneCaller] Could not load dispatch_config.json, using defaults:`, err.message);
      return {
        voiceRules: {
          ttsEngine: "edge-tts",
          defaultVoice: "en-US-GuyNeural",
          driverVoice: "en-US-ChristopherNeural",
          silenceWindowSeconds: 2.5,
          maxWordsPerTurn: 12,
          zeroSmallTalk: true,
          safetyTimeoutSeconds: 75
        },
        scripts: {
          formalOpening: "Hello, Amazon Relay Dispatch here. Notice your truck is stopped on route. Everything okay?",
          formalClosing: "Got that logged with dispatch. Appreciate the update, drive safe."
        },
        questions: [
          { order: 1, field: "stopReason", question: "What's causing the unscheduled stop right now?" },
          { order: 2, field: "estimatedTimeToResume", question: "About how long until you're rolling again?" },
          { order: 3, field: "assistanceNeeded", question: "Do you need roadside service or assistance dispatched?" }
        ]
      };
    }
  }

  updateConfig(newConfig) {
    this.config = newConfig;
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(eventType, data) {
    this.listeners.forEach(cb => {
      try {
        cb(eventType, data);
      } catch (err) {
        console.error('[OpenPhoneCaller] Listener error:', err);
      }
    });
  }

  /**
   * 1st-Time Interactive login launcher for OpenPhone Web
   */
  static activeLoginContext = null;

  static cleanupStaleLocks(dir) {
    if (!fs.existsSync(dir)) return;
    const lockFiles = ['lockfile', 'SingletonLock', 'SingletonCookie', 'SingletonSocket', path.join('Default', 'LOCK')];
    for (const f of lockFiles) {
      const fullPath = path.join(dir, f);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`[OpenPhoneCaller] Removed stale lock file: ${f}`);
        } catch (e) {}
      }
    }
  }

  static async launchLoginSession() {
    const sessionPath = path.resolve(__dirname, 'openphone_session');
    console.log(`[OpenPhoneCaller] Launching browser for OpenPhone authentication...`);
    console.log(`[OpenPhoneCaller] Saving persistent profile to: ${sessionPath}`);

    // Clean stale lock files if previous process died unexpectedly
    OpenPhoneCaller.cleanupStaleLocks(sessionPath);

    // If an active context is already open, focus and reuse it
    if (OpenPhoneCaller.activeLoginContext) {
      try {
        const pages = OpenPhoneCaller.activeLoginContext.pages();
        if (pages.length > 0) {
          await pages[0].bringToFront();
          await pages[0].goto('https://my.openphone.com', { waitUntil: 'domcontentloaded' }).catch(() => {});
          console.log(`[OpenPhoneCaller] Reused existing active login browser window.`);
          return { context: OpenPhoneCaller.activeLoginContext, page: pages[0] };
        }
      } catch (e) {
        OpenPhoneCaller.activeLoginContext = null;
      }
    }

    try {
      const context = await chromium.launchPersistentContext(sessionPath, {
        headless: false,
        viewport: { width: 1280, height: 800 },
        permissions: ['microphone'],
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--use-fake-ui-for-media-stream']
      });

      OpenPhoneCaller.activeLoginContext = context;
      context.on('close', () => {
        OpenPhoneCaller.activeLoginContext = null;
      });

      const pages = context.pages();
      const page = pages.length > 0 ? pages[0] : await context.newPage();
      page.goto('https://my.openphone.com', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(err => {
        console.warn('[OpenPhoneCaller] Navigation notice:', err.message);
      });
      console.log(`[OpenPhoneCaller] Please log into your OpenPhone account in the browser window.`);
      return { context, page };
    } catch (err) {
      console.error('[OpenPhoneCaller] Failed to launch interactive browser:', err.message);
      OpenPhoneCaller.activeLoginContext = null;
      return null;
    }
  }

  /**
   * Initializes persistent Playwright browser context for OpenPhone
   */
  async initBrowser() {
    if (this.browserContext) return;

    if (this.isMockMode) {
      console.log(`[OpenPhoneCaller] Running in Simulation/Voice Engine Mode.`);
      return;
    }

    try {
      console.log(`[OpenPhoneCaller] Starting persistent OpenPhone Playwright context at ${this.sessionDir}...`);
      this.browserContext = await chromium.launchPersistentContext(this.sessionDir, {
        headless: this.headless,
        permissions: ['microphone'],
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--use-fake-ui-for-media-stream',
          '--autoplay-policy=no-user-gesture-required'
        ],
        viewport: { width: 1280, height: 800 }
      });

      this.page = await this.browserContext.newPage();
      await this.page.goto(this.openphoneUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`[OpenPhoneCaller] Connected to OpenPhone Web.`);
    } catch (err) {
      console.error(`[OpenPhoneCaller] Failed to connect to OpenPhone session:`, err.message);
      console.log(`[OpenPhoneCaller] Defaulting to Voice Engine Simulation Mode.`);
      this.isMockMode = true;
    }
  }

  /**
   * Initiates an operational voice call to a stopped driver
   * @param {Object} tourDetails { tourId, tripId, driverName, driverPhone, truckId, location }
   * @param {Object} options Optional mock driver responses for simulation
   */
  async callDriver(tourDetails, options = {}) {
    this.isAborted = false;
    this.sleepResolvers = [];

    if (this.activeCall) {
      console.warn(`[OpenPhoneCaller] Auto-clearing previous active call session: ${this.activeCall.callId}`);
      this.activeCall = null;
    }

    const callId = `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();
    const safetyTimeoutSeconds = this.config.voiceRules?.safetyTimeoutSeconds || 120;
    const silenceWindowSeconds = this.config.voiceRules?.silenceWindowSeconds || 2.0;

    this.activeCall = {
      callId,
      tourId: tourDetails.tourId,
      tripId: tourDetails.tripId,
      driverName: tourDetails.driverName,
      driverPhone: tourDetails.driverPhone,
      truckId: tourDetails.truckId,
      location: tourDetails.location,
      status: 'DIALING', // DIALING, CONNECTED, IN_CONVERSATION, TERMINATING, ENDED, TIMED_OUT, UNRESPONSIVE
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      transcript: [],
      currentTurnIndex: 0,
      collectedData: {},
      isDriverSpeaking: false,
      silenceRemaining: silenceWindowSeconds
    };

    console.log(`[OpenPhoneCaller] ==========================================`);
    console.log(`[OpenPhoneCaller] INITIATING OPERATIONAL CALL TO: ${tourDetails.driverName} (${tourDetails.driverPhone})`);
    console.log(`[OpenPhoneCaller] Tour: ${tourDetails.tourId} | Tractor: ${tourDetails.truckId}`);
    console.log(`[OpenPhoneCaller] ==========================================`);

    this.notifyListeners('CALL_STARTED', this.activeCall);

    // Track safety timeout timer (120s hard cap)
    const timeoutHandle = setTimeout(() => {
      if (this.activeCall && this.activeCall.callId === callId) {
        console.warn(`[OpenPhoneCaller] ⚠️ SAFETY TIMEOUT REACHED (${safetyTimeoutSeconds}s). Force hanging up.`);
        this.activeCall.status = 'TIMED_OUT';
        const timeoutSpeech = this.config.scripts?.timeoutExit || "Call limit reached. Dispatch will follow up via message. Stay safe.";
        this.addTranscriptTurn('AI', timeoutSpeech);
        this.terminateCall('SAFETY_TIMEOUT');
      }
    }, safetyTimeoutSeconds * 1000);

    try {
      if (!this.isMockMode && this.page) {
        await this.dialLiveOpenPhone(tourDetails.driverPhone);
      }

      // Transition to CONNECTED
      await this.sleep(1200);
      if (!this.activeCall) return;
      this.activeCall.status = 'CONNECTED';
      this.notifyListeners('CALL_STATUS_CHANGE', this.activeCall);

      // Execute Operational Voice Dialogue Sequence
      await this.executeVoiceDialogue(tourDetails, options);

    } catch (err) {
      console.error(`[OpenPhoneCaller] Call execution error:`, err);
      if (this.activeCall) {
        this.activeCall.status = 'FAILED';
        this.activeCall.error = err.message;
      }
    } finally {
      clearTimeout(timeoutHandle);
      const finalizedCall = await this.terminateCall('NORMAL_COMPLETION');
      return finalizedCall;
    }
  }

  /**
   * Dials OpenPhone web interface using Playwright selectors
   */
  async dialLiveOpenPhone(phoneNumber) {
    try {
      console.log(`[OpenPhoneCaller] Dials OpenPhone Web input: ${phoneNumber}`);
      // Click New Call or Dial button
      const newCallBtn = this.page.locator('button[aria-label="New call"], [data-testid="dial-button"], button:has-text("Call")').first();
      if (await newCallBtn.isVisible()) {
        await newCallBtn.click();
      }

      // Enter phone number
      const phoneInput = this.page.locator('input[type="tel"], input[placeholder*="number"], [data-testid="phone-input"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill(phoneNumber);
        await this.page.keyboard.press('Enter');
        console.log(`[OpenPhoneCaller] Sent dial command in OpenPhone.`);
      }
    } catch (err) {
      console.warn(`[OpenPhoneCaller] Live dial interaction failed, continuing conversational flow:`, err.message);
    }
  }

  /**
   * Executes the Zero-Small-Talk, Non-Interruptive Voice Dialogue with Strict 2.0s Silence Window
   */
  async executeVoiceDialogue(tourDetails, options = {}) {
    if (this.isAborted || !this.activeCall) return;
    this.activeCall.status = 'IN_CONVERSATION';
    this.notifyListeners('CALL_STATUS_CHANGE', this.activeCall);

    // 1. Spoken Formal Opening (Under 10-12 words, zero small talk)
    const opening = this.config.scripts?.formalOpening || "Hello, Amazon Relay Dispatch here. Notice your truck is stopped on route. Everything okay?";
    await this.speakTurn(opening);
    if (this.isAborted || !this.activeCall) return;

    // Preset simulated driver answers for realistic automated simulation
    const simulatedAnswers = options.driverResponses || this.generateRealisticDriverResponses(tourDetails, options.scenarioType);
    if (simulatedAnswers.driverName && (!tourDetails.driverName || tourDetails.driverName === 'Marcus Vance')) {
      this.activeCall.driverName = simulatedAnswers.driverName;
      this.notifyListeners('CALL_STATUS_CHANGE', this.activeCall);
    }

    // Driver responds directly to the opening inquiry (Stop Reason)
    const initialReason = simulatedAnswers.stopReason || 'Got a flat drive tire on the right side of trailer.';
    this.activeCall.collectedData['stopReason'] = initialReason;
    await this.listenToDriver(initialReason);
    if (this.isAborted || !this.activeCall) return;

    // Sort remaining active questions (e.g. ETA, Roadside assistance)
    const questions = [...(this.config.questions || [])]
      .filter(q => q.field !== 'stopReason')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    for (let i = 0; i < questions.length; i++) {
      if (this.isAborted || !this.activeCall || this.activeCall.status === 'TIMED_OUT' || this.activeCall.status === 'TERMINATING') {
        break;
      }

      const q = questions[i];
      this.activeCall.currentTurnIndex = i + 2;

      // Spoken Follow-up Question
      await this.speakTurn(q.question);
      if (this.isAborted || !this.activeCall) break;

      // Driver Speaking Turn & Intentional Silence Window
      const driverAnswer = simulatedAnswers[q.field] || simulatedAnswers[i] || 'Resuming shortly, no issue.';
      await this.listenToDriver(driverAnswer);
      if (this.isAborted || !this.activeCall) break;

      this.activeCall.collectedData[q.field] = driverAnswer;

      // Check for Objective-Driven Exit
      if (this.isObjectiveFulfilled(this.activeCall.collectedData, this.config.questions || [])) {
        console.log(`[OpenPhoneCaller] Objective-Driven Exit criteria satisfied. Proceeding directly to formal closing.`);
        break;
      }
    }

    // Spoken Formal Closing
    if (!this.isAborted && this.activeCall && this.activeCall.status !== 'TIMED_OUT') {
      const closing = this.config.scripts?.formalClosing || "Got that logged with dispatch. Appreciate the update, drive safe.";
      await this.speakTurn(closing);
      await this.sleep(800);
    }
  }

  /**
   * Speaks a concise operational statement (Enforcing word count limit < 12 words)
   */
  async speakTurn(text) {
    if (this.isAborted || !this.activeCall) return;

    // Enforce Operational Brevity rule (< 12 words)
    const maxWords = this.config.voiceRules?.maxWordsPerTurn || 12;
    const words = text.split(/\s+/);
    let spokenText = text;
    if (words.length > maxWords) {
      spokenText = words.slice(0, maxWords).join(' ') + '.';
    }

    console.log(`[OpenPhone AI Voice] 🤖 Spoken: "${spokenText}"`);

    // 1. Synthesize / load TTS buffer in advance to know exact audio duration
    const buffer = await ttsService.generateSpeechBuffer(spokenText, 'AI');
    if (this.isAborted || !this.activeCall) return;
    const durationMs = buffer ? ttsService.getAudioDurationMs(buffer) : Math.max(2200, spokenText.length * 80);

    // 2. Emit transcript turn to frontend
    this.addTranscriptTurn('AI', spokenText);

    // 3. Sleep for full audio duration + 600ms cushion so AI sentence finishes 100% before next turn
    await this.sleep(durationMs + 600);
  }

  /**
   * Listens to the driver with Strict Listening: Driver speaks, followed by strict silence window
   */
  async listenToDriver(driverResponseText) {
    if (this.isAborted || !this.activeCall) return;

    // 1. Synthesize / load Driver TTS buffer in advance to know exact audio duration
    const buffer = await ttsService.generateSpeechBuffer(driverResponseText, 'Driver');
    if (this.isAborted || !this.activeCall) return;
    const speakingDurationMs = buffer ? ttsService.getAudioDurationMs(buffer) : Math.max(2500, driverResponseText.length * 80);

    // 2. Emit turn so the browser starts playing the driver audio immediately
    this.activeCall.isDriverSpeaking = true;
    this.notifyListeners('DRIVER_SPEAKING_START', { callId: this.activeCall.callId });
    console.log(`[Driver Speaking] 🚚 Spoken: "${driverResponseText}" (${speakingDurationMs}ms)`);
    this.addTranscriptTurn('Driver', driverResponseText);

    // 3. Sleep for full driver audio duration + 400ms pause so driver speech finishes 100%
    await this.sleep(speakingDurationMs + 400);
    if (this.isAborted || !this.activeCall) return;

    this.activeCall.isDriverSpeaking = false;

    // 4. NOW AND ONLY NOW enforce the strict intentional silence window (2.5s)
    const silenceWindowSeconds = this.config.voiceRules?.silenceWindowSeconds || 2.5;
    console.log(`[OpenPhoneCaller] ⏳ Driver finished speaking. Enforcing strict ${silenceWindowSeconds}s silence window...`);
    this.notifyListeners('SILENCE_WINDOW_START', {
      callId: this.activeCall.callId,
      silenceWindowSeconds
    });

    const stepMs = 250;
    const totalSteps = Math.round((silenceWindowSeconds * 1000) / stepMs);
    for (let step = 0; step < totalSteps; step++) {
      if (this.isAborted || !this.activeCall) break;
      const remaining = Math.max(0, (silenceWindowSeconds - (step * stepMs) / 1000)).toFixed(1);
      if (this.activeCall) {
        this.activeCall.silenceRemaining = parseFloat(remaining);
        this.notifyListeners('SILENCE_TICK', {
          callId: this.activeCall.callId,
          silenceRemaining: this.activeCall.silenceRemaining
        });
      }
      await this.sleep(stepMs);
    }

    if (!this.isAborted && this.activeCall) {
      this.notifyListeners('SILENCE_WINDOW_COMPLETE', { callId: this.activeCall.callId });
      console.log(`[OpenPhoneCaller] ✅ Silence window passed. Safe for AI to formulate response.`);
      // 350ms pause before next AI turn begins
      await this.sleep(350);
    }
  }

  isObjectiveFulfilled(collectedData, allQuestions = []) {
    const requiredQuestions = allQuestions.filter(q => q.required);
    if (!requiredQuestions.length) return true;
    for (const q of requiredQuestions) {
      if (!collectedData[q.field] || !String(collectedData[q.field]).trim()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sends an automated emergency SMS message to a stopped/unresponsive driver
   */
  async sendDirectSms(tourDetails, messageText) {
    console.log(`[OpenPhone SMS] 📱 Sending automated SMS to ${tourDetails.driverName} (${tourDetails.driverPhone}): "${messageText}"`);

    const smsTurn = {
      speaker: 'AI',
      text: `[SMS Outgoing]: ${messageText}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.notifyListeners('CHAT_STARTED', {
      chatId: `CHAT-${Date.now()}`,
      tourId: tourDetails.tourId,
      driverName: tourDetails.driverName,
      driverPhone: tourDetails.driverPhone,
      truckId: tourDetails.truckId
    });

    this.notifyListeners('CHAT_MESSAGE', { turn: smsTurn });

    if (!this.isMockMode && this.page) {
      try {
        await this.sendLiveOpenPhoneMessage(tourDetails.driverPhone, messageText);
      } catch (e) {
        console.warn('[OpenPhoneCaller] Live SMS send notice:', e.message);
      }
    }

    return true;
  }

  addTranscriptTurn(speaker, text) {
    if (!this.activeCall) return;
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&speaker=${encodeURIComponent(speaker)}`;
    const turn = {
      speaker,
      text,
      audioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.activeCall.transcript.push(turn);
    this.notifyListeners('TRANSCRIPT_UPDATE', { callId: this.activeCall.callId, turn, transcript: this.activeCall.transcript });

    // Pre-cache audio asynchronously
    ttsService.generateSpeechBuffer(text, speaker).catch(() => {});
  }

  /**
   * Instantly Force Terminates any Active Call or Chat
   */
  async forceTerminateCall(reason = 'OPERATOR_FORCE_HANGUP') {
    console.log(`[OpenPhoneCaller] 🛑 Operator issued IMMEDIATE FORCE TERMINATE (reason: ${reason})`);
    this.isAborted = true;

    // Wake up all pending sleep promises immediately
    while (this.sleepResolvers.length > 0) {
      const resolver = this.sleepResolvers.pop();
      try { resolver(); } catch (e) {}
    }

    if (!this.activeCall) {
      this.notifyListeners('CALL_ENDED', { status: 'ENDED', reason });
      return { success: true, message: 'No active call to terminate.' };
    }

    const finalized = await this.terminateCall(reason);
    return { success: true, finalized };
  }

  /**
   * Terminates active call, compiles transcript, and drafts Delay Report via Gemini 2.5 Flash
   */
  async terminateCall(reason = 'NORMAL_COMPLETION') {
    if (!this.activeCall) return null;

    const callToFinalize = { ...this.activeCall };
    this.activeCall.status = reason === 'SAFETY_TIMEOUT' ? 'TIMED_OUT' : 'ENDED';
    this.activeCall.durationSeconds = Math.round((Date.now() - new Date(callToFinalize.startTime).getTime()) / 1000);

    console.log(`[OpenPhoneCaller] Call ${callToFinalize.callId} Terminated (${reason}). Duration: ${this.activeCall.durationSeconds}s`);
    this.notifyListeners('CALL_ENDED', this.activeCall);

    // Click End Call in OpenPhone if live browser is attached
    if (!this.isMockMode && this.page) {
      try {
        const hangupBtn = this.page.locator('button[aria-label="End call"], [data-testid="hangup-button"], button:has-text("Hang up")').first();
        if (await hangupBtn.isVisible()) {
          await hangupBtn.click();
        }
      } catch (err) {}
    }

    let draftReport = null;
    if (callToFinalize.transcript && callToFinalize.transcript.length > 0) {
      console.log(`[OpenPhoneCaller] Passing transcript to Gemini 2.5 Flash for delay report drafting...`);
      draftReport = await geminiService.generateDelayReport(
        {
          tourId: callToFinalize.tourId,
          tripId: callToFinalize.tripId,
          driverName: callToFinalize.driverName,
          driverPhone: callToFinalize.driverPhone,
          truckId: callToFinalize.truckId,
          location: callToFinalize.location,
          stoppedDuration: `${callToFinalize.durationSeconds}s call recorded`
        },
        callToFinalize.transcript
      );

      this.callHistory.unshift({
        ...callToFinalize,
        status: 'ENDED',
        draftReport
      });

      this.notifyListeners('REPORT_DRAFTED', {
        callId: callToFinalize.callId,
        report: draftReport
      });
    }

    const finished = { ...callToFinalize, status: 'ENDED', draftReport };
    this.activeCall = null;
    return finished;
  }

  generateRealisticDriverResponses(tourDetails = {}, scenarioType = null) {
    const scenarios = {
      standard_breakdown: {
        driverName: "Marcus Vance",
        stopReason: "I got a flat drive tire on the right side of the trailer.",
        estimatedTimeToResume: "Roadside service estimated about 45 minutes.",
        assistanceNeeded: "Yes, already called carrier dispatch for mobile tire truck."
      },
      hispanic_esl: {
        driverName: "Carlos Mendoza",
        stopReason: "Hola dispatch, tire ponchada on my trailer right side, pulled over safely.",
        estimatedTimeToResume: "Roadside mechanic say about 40 minutos to arrive.",
        assistanceNeeded: "Si, carrier already call roadside service for the llanta."
      },
      slavic_esl: {
        driverName: "Dmitry Volkov",
        stopReason: "Hello dispatch. Engine coolant hot and white smoke, stopped shoulder.",
        estimatedTimeToResume: "Waiting mechanic to check, maybe 1 hour or 1 hour 30 min.",
        assistanceNeeded: "Yes, need roadside mechanic authorization please."
      },
      punjabi_esl: {
        driverName: "Gurpreet Singh",
        stopReason: "Major accident ahead on the freeway, all lanes totally blocked, road closed.",
        estimatedTimeToResume: "Police saying at least 45 minutes to 1 hour to clear.",
        assistanceNeeded: "No roadside needed, just waiting for traffic to move."
      },
      sleepy_driver: {
        driverName: "Bob Miller",
        stopReason: "Yeah... had to pull over... ELD 30-minute mandatory rest break triggered...",
        estimatedTimeToResume: "Resuming in about 18 minutes as soon as the clock clears...",
        assistanceNeeded: "No assistance needed, all good."
      },
      inaudible_clarification: {
        driverName: "Alex Rivera",
        stopReason: "Sorry didn't catch that at first. Got a low air pressure alarm on trailer brakes.",
        estimatedTimeToResume: "Checking the air lines now, about 25 to 30 minutes.",
        assistanceNeeded: "No roadside yet, checking air fittings myself."
      }
    };

    if (scenarioType && scenarios[scenarioType]) {
      return scenarios[scenarioType];
    }

    const scenarioList = Object.values(scenarios);
    const index = Math.abs(tourDetails.tourId ? tourDetails.tourId.charCodeAt(tourDetails.tourId.length - 1) : 0) % scenarioList.length;
    return scenarioList[index];
  }

  /**
   * 100% Automated AI SMS / Chat Inquiry with Driver (No manual typing needed)
   */
  async startAutomatedChat(tourDetails, options = {}) {
    this.isAborted = false;
    const chatId = `CHAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transcript = [];
    const simulatedAnswers = options.driverResponses || this.generateRealisticDriverResponses(tourDetails);

    console.log(`[OpenPhone AI Chat] ==========================================`);
    console.log(`[OpenPhone AI Chat] STARTING AUTOMATED SMS INQUIRY WITH: ${tourDetails.driverName} (${tourDetails.driverPhone})`);
    console.log(`[OpenPhone AI Chat] ==========================================`);

    const notifyChat = (speaker, text) => {
      const turn = { speaker, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      transcript.push(turn);
      this.notifyListeners('CHAT_MESSAGE', { chatId, tourId: tourDetails.tourId, driverName: tourDetails.driverName, turn, transcript });
    };

    this.notifyListeners('CHAT_STARTED', { chatId, tourId: tourDetails.tourId, driverName: tourDetails.driverName, driverPhone: tourDetails.driverPhone });

    // Step 1: Automated AI Opening SMS
    await this.sleep(600);
    if (this.isAborted) return;
    const openingMsg = "Relay Dispatch AI: Notice your truck is stopped on route. What's causing the delay?";
    notifyChat('AI', openingMsg);

    // Step 2: Driver automated text reply
    await this.sleep(1800);
    if (this.isAborted) return;
    const driverReason = simulatedAnswers.stopReason || "Got a flat tire on trailer. Pulled over safely.";
    notifyChat('Driver', driverReason);

    // Step 3: AI asks ETA
    await this.sleep(1200);
    if (this.isAborted) return;
    const etaMsg = "Got it. What's your estimated time to resume rolling?";
    notifyChat('AI', etaMsg);

    // Step 4: Driver provides ETA
    await this.sleep(1800);
    if (this.isAborted) return;
    const driverEta = simulatedAnswers.estimatedTimeToResume || "Roadside service estimated 45 mins.";
    notifyChat('Driver', driverEta);

    // Step 5: AI asks Roadside
    await this.sleep(1200);
    if (this.isAborted) return;
    const roadsideMsg = "Do you need dispatch to send emergency roadside or escort?";
    notifyChat('AI', roadsideMsg);

    // Step 6: Driver responds
    await this.sleep(1800);
    if (this.isAborted) return;
    const driverRoadside = simulatedAnswers.assistanceNeeded || "Carrier roadside is already dispatched.";
    notifyChat('Driver', driverRoadside);

    // Step 7: AI confirmation & concluding text
    await this.sleep(1000);
    if (this.isAborted) return;
    const closingMsg = "Logged with dispatch. Stay safe out there.";
    notifyChat('AI', closingMsg);

    // Draft Delay Report via Gemini 2.5 Flash
    console.log(`[OpenPhone AI Chat] Compiling chat transcript into official Amazon Delay Report...`);
    const draftReport = await geminiService.generateDelayReport(
      {
        tourId: tourDetails.tourId,
        tripId: tourDetails.tripId,
        driverName: tourDetails.driverName,
        driverPhone: tourDetails.driverPhone,
        truckId: tourDetails.truckId,
        location: tourDetails.location,
        stoppedDuration: `Automated SMS Chat inquiry completed`
      },
      transcript
    );

    this.notifyListeners('CHAT_ENDED', { chatId, tourId: tourDetails.tourId, transcript, draftReport });
    this.notifyListeners('REPORT_DRAFTED', { chatId, report: draftReport });

    return { chatId, transcript, draftReport };
  }

  getActiveCall() {
    return this.activeCall;
  }

  getCallHistory() {
    return this.callHistory;
  }

  sleep(ms) {
    if (this.isAborted) return Promise.resolve();
    return new Promise(resolve => {
      let timer = null;
      const onWake = () => {
        if (timer) clearTimeout(timer);
        resolve();
      };
      timer = setTimeout(() => {
        const idx = this.sleepResolvers.indexOf(onWake);
        if (idx !== -1) this.sleepResolvers.splice(idx, 1);
        resolve();
      }, ms);
      this.sleepResolvers.push(onWake);
    });
  }

  async close() {
    this.isAborted = true;
    while (this.sleepResolvers.length > 0) {
      const resolver = this.sleepResolvers.pop();
      try { resolver(); } catch (e) {}
    }
    if (this.browserContext) {
      await this.browserContext.close();
      this.browserContext = null;
      this.page = null;
    }
  }
}

module.exports = OpenPhoneCaller;

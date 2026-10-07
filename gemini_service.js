const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.client = null;
    this.modelName = 'gemini-2.5-flash';
    this.initClient();
  }

  initClient() {
    if (this.apiKey && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
        console.log(`[GeminiService] Initialized Google Gen AI SDK with model: ${this.modelName}`);
      } catch (err) {
        console.error(`[GeminiService] Failed to initialize Google Gen AI SDK:`, err.message);
        this.client = null;
      }
    } else {
      console.warn(`[GeminiService] No valid GEMINI_API_KEY found. AI analysis will use intelligent heuristic fallback.`);
      this.client = null;
    }
  }

  updateApiKey(newKey) {
    this.apiKey = newKey;
    process.env.GEMINI_API_KEY = newKey;
    this.initClient();
  }

  /**
   * Interactive Dispatch Copilot Chat Assistant (supports English and Arabic)
   */
  async chatWithCopilot(userMessage, history = []) {
    const systemInstruction = `You are the Amazon Relay Dispatch AI Copilot Assistant. You assist the human truck dispatcher with Amazon Relay operations, active tour monitoring, driver communication scripts, HOS/DOT regulations, and delay exception reporting. You communicate fluently in English and Arabic based on user language. Keep responses concise, helpful, and operationally accurate.`;

    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: `${systemInstruction}\n\nUser: ${userMessage}`
        });
        return response.text || 'Understood. How can I assist with your Amazon Relay fleet?';
      } catch (err) {
        console.error('[GeminiService] Chat error:', err.message);
      }
    }

    // Heuristic assistant response fallback
    const msg = userMessage.toLowerCase();
    if (msg.includes('مرحبا') || msg.includes('ازيك') || msg.includes('سلام') || msg.includes('hello') || msg.includes('hi')) {
      return `أهلاً بك! أنا مساعد Amazon Relay Dispatch AI Copilot. أستطيع مساعدتك في مراقبة الرحلات، الاتصال بالسائقين بالصوت، وتلخيص أسباب التأخير ورفع التقارير تلقائياً. كيف أستطيع مساعدتك اليوم؟`;
    }
    return `[AI Copilot]: أراقب حالياً رحلات Amazon Relay النشطة. يمكنك إجراء محادثات واختبار الصوت مع السائقين مباشرة عبر الميكروفون أو الشات، ومراجعة تقارير التأخير المعتمدة قبل إرسالها لـ Amazon Relay.`;
  }

  /**
   * Generates the next AI spoken turn during a live interactive call with the driver
   * Accurately reacts to driver questions, inaudibility, identity checks, and operational updates.
   */
  async generateInteractiveTurn({ tourDetails = {}, transcript = [], questions = [], scripts = {} }) {
    const driverName = tourDetails.driverName || 'Driver';
    const tourId = tourDetails.tourId || 'active tour';
    const truckId = tourDetails.truckId || 'your truck';
    const defaultClosing = scripts.formalClosing || `Got that logged with dispatch. Appreciate the update ${driverName}, drive safe.`;

    // Filter driver utterances
    const driverTurns = transcript.filter(t => t.speaker === 'Driver');
    if (driverTurns.length === 0) {
      return {
        nextSpeech: `Hello ${driverName}, this is Amazon Relay Dispatch. Notice your truck ${truckId} is stopped. Everything okay?`,
        isClosing: false
      };
    }

    const lastDriverTurn = driverTurns[driverTurns.length - 1];
    const lastSpeechRaw = (lastDriverTurn?.text || '').trim();
    const lastSpeech = lastSpeechRaw.toLowerCase();
    const allDriverText = driverTurns.map(t => t.text).join(' ').toLowerCase();
    const transcriptText = transcript.map(t => `[${t.speaker}]: ${t.text}`).join('\n');

    // ==============================================================
    // 1. ADVANCED GEMINI 2.5 FLASH PROMPT (When Online)
    // ==============================================================
    if (this.client) {
      try {
        const prompt = `
You are the Amazon Relay AI Dispatcher on an active operational phone call with commercial truck driver ${driverName}.
Tour ID: ${tourId}. Tractor: ${truckId}. Location: ${tourDetails.location || 'In Transit'}.

CONVERSATION TRANSCRIPT SO FAR:
${transcriptText}

LATEST DRIVER UTTERANCE:
"${lastSpeechRaw}"

DISPATCH OBJECTIVES:
1. Confirm driver identity & safety.
2. Identify root cause of stop (Breakdown, Traffic, DOT Rest, Gate delay, Weather).
3. Get estimated time to resume rolling (ETA).
4. Authorize roadside assistance if needed.

HUMAN-LIKE CONVERSATIONAL RULES:
- You are a natural human American truck dispatcher speaking directly to commercial driver ${driverName}.
- Keep EVERY spoken turn strictly UNDER 12 WORDS. Natural, conversational, and direct.
- Use natural trucker/dispatcher vernacular ("Copy that Marcus", "Got it, roadside is on the way", "All logged with Amazon, drive safe").
- Listen actively and respond directly to what the driver just said:
  * If driver says they can't hear ("what?", "can't hear", "مش سامع"): "No problem. Why is your tractor stopped right now?"
  * If driver asks who is calling ("who is this?", "انت مين"): "Relay Dispatch here for tour ${tourId}. Everything okay?"
  * If driver needs roadside/mechanic: "Roadside authorized. How long until you're rolling again?"
  * If driver already gave reason AND eta, do NOT re-ask! Go straight to closing: "${defaultClosing}" and set isClosing to true.
  * After 2-3 brief exchanges and key facts are known, close warmly: "${defaultClosing}" and set isClosing to true.

Return STRICT JSON:
{
  "nextSpeech": "<Exact concise sentence under 12 words>",
  "isClosing": <boolean true if conversation is completed, false otherwise>
}
`;
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: { responseMimeType: 'application/json', temperature: 0.15 }
        });

        const raw = response.text || '';
        const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
        return {
          nextSpeech: parsed.nextSpeech || defaultClosing,
          isClosing: Boolean(parsed.isClosing)
        };
      } catch (err) {
        console.warn('[GeminiService] Gemini turn error, switching to Intelligent NLP Engine:', err.message);
      }
    }

    // ==============================================================
    // 2. INTELLIGENT NATURAL CONVERSATIONAL NLP ENGINE (Offline/Fallback)
    // ==============================================================
    return this.evaluateConversationalState({
      tourDetails,
      transcript,
      driverTurns,
      lastSpeech,
      allDriverText,
      defaultClosing
    });
  }

  /**
   * Stateful, Context-Aware Conversational Engine (Deep Intent Understanding)
   */
  evaluateConversationalState({ tourDetails, transcript, driverTurns, lastSpeech, allDriverText, defaultClosing }) {
    const driverName = tourDetails.driverName || 'Driver';
    const tourId = tourDetails.tourId || 'active tour';
    const truckId = tourDetails.truckId || 'your tractor';

    // -------------------------------------------------------------
    // Intent 1: Inaudibility / Clarification Request
    // -------------------------------------------------------------
    const inaudibleTriggers = [
      'مش سامع', 'مش سامعك', 'صوتك واطي', 'صوتك بيقطع', 'مش واضح', 'عيد', 'عيد تاني', 'بتقول ايه', 'نعم', 'الو',
      'cant hear', "can't hear", 'cannot hear', 'what did you say', 'say again', 'repeat', 'repeat that',
      'pardon', 'come again', 'did not catch', "didn't catch", 'what?', 'huh?', 'excuse me', 'could not hear'
    ];
    if (inaudibleTriggers.some(t => lastSpeech.includes(t))) {
      if (!allDriverText.includes('tire') && !allDriverText.includes('traffic') && !allDriverText.includes('break') && !allDriverText.includes('problem') && !allDriverText.includes('عطل') && !allDriverText.includes('مشكلة') && !allDriverText.includes('زحمة')) {
        return {
          nextSpeech: `No problem ${driverName}. I was asking: what's the reason your truck is stopped right now?`,
          isClosing: false
        };
      } else if (!allDriverText.includes('minute') && !allDriverText.includes('hour') && !allDriverText.includes('ساعة') && !allDriverText.includes('دقيقة')) {
        return {
          nextSpeech: `I was asking: about how long until you're able to resume rolling?`,
          isClosing: false
        };
      } else {
        return {
          nextSpeech: `I was asking if you need dispatch to send emergency roadside assistance?`,
          isClosing: false
        };
      }
    }

    // -------------------------------------------------------------
    // Intent 2: Identity / Who is calling inquiry
    // -------------------------------------------------------------
    const identityTriggers = [
      'انت مين', 'مين معايا', 'مين بيكلمني', 'مين بيتكلم', 'مين ده', 'شحنة مين', 'شركة ايه', 'عاوز ايه', 'مين حضرتكم',
      'who are you', 'who is this', "who's this", "who's calling", 'who is calling', 'who is it', 'who are u', 'what company', 'what is this about', 'why calling', 'who calls'
    ];
    if (identityTriggers.some(t => lastSpeech.includes(t))) {
      return {
        nextSpeech: `This is Amazon Relay Dispatch for tour ${tourId}. We noticed your truck is stopped. Everything okay?`,
        isClosing: false
      };
    }

    // -------------------------------------------------------------
    // Intent 3: Tour / Load verification
    // -------------------------------------------------------------
    const loadTriggers = ['شحنة ايه', 'انهي شحنة', 'انهي تريلا', 'انهي عربية', 'which load', 'which tour', 'which truck', 'what load'];
    if (loadTriggers.some(t => lastSpeech.includes(t))) {
      return {
        nextSpeech: `Calling about tour ${tourId} on tractor ${truckId}. What's causing the unscheduled stop?`,
        isClosing: false
      };
    }

    // -------------------------------------------------------------
    // Intent 4: Direct Driver Question or Help Request
    // -------------------------------------------------------------
    if (lastSpeech.includes('ونش') || lastSpeech.includes('ميكانيكي') || lastSpeech.includes('tow') || lastSpeech.includes('mechanic') || lastSpeech.includes('help') || lastSpeech.includes('send') || lastSpeech.includes('roadside')) {
      if (!allDriverText.includes('minute') && !allDriverText.includes('hour') && !allDriverText.includes('ساعة')) {
        return {
          nextSpeech: `Yes, logging roadside assistance now. What's your estimated time to resume rolling?`,
          isClosing: false
        };
      }
    }

    // -------------------------------------------------------------
    // Intent 5: Extracting Operational Facts (Deep Multilingual & Dialect Comprehension)
    // -------------------------------------------------------------
    const hasReason = [
      // Standard English & Trucking Slang
      'problem', 'issue', 'trouble', 'stuck', 'tire', 'flat', 'blown', 'puncture', 'puncher', 'blowout', 'engine', 'coolant', 'oil', 'air leak', 'brakes', 'broke', 'broken', 'breakdown', 'mechanic', 'derate', 'regen', 'def light', 'check engine', 'battery', 'alternator', 'transmission', 'clutch', 'radiator', 'smoke', 'steaming',
      'traffic', 'accident', 'gridlock', 'jam', 'backed up', 'police', 'road closed', 'closed', 'highway stopped',
      'rest', 'break', 'eld', 'hos', 'sleeper', 'hours', '30 min', 'sleeping', 'nap', 'tired', 'mandatory', 'out of hours',
      'gate', 'dock', 'facility', 'yard', 'bol', 'waiting', 'shipper', 'receiver', 'detention', 'lumper', 'scale house', 'inspection',
      'snow', 'ice', 'blizzard', 'storm', 'weather', 'chain', 'black ice', 'wind',
      // Hispanic / Latino ESL & Spanish
      'ponchada', 'llanta', 'parado', 'mecanico', 'caliente', 'frenos', 'motor', 'aceite', 'policia', 'choque', 'accidente', 'trafico', 'dormir', 'descanso', 'horas', 'aduana', 'almacen', 'taller', 'no move', 'freeway parado',
      // Slavic / Eastern European ESL
      'tier', 'koleso', 'stoppet', 'probka', 'avariya', 'politsiya', 'remont', 'buksir', 'tormoza', 'dvigatel',
      // South Asian / Punjabi / Hindi ESL
      'puncher', 'tyre blast', 'gaddi', 'garam', 'engine heat', 'full jam', 'rasta band', 'mistri', 'crane',
      // Arabic
      'مشكلة', 'عطل', 'عطلان', 'عطلانة', 'كاوتش', 'عجلة', 'ماتور', 'فرامل', 'سخنت', 'زحمة', 'حادثة', 'استراحة', 'واقف', 'مستني', 'بوابة', 'ثلج', 'مطر'
    ].some(r => allDriverText.includes(r));

    const hasETA = [
      'minute', 'minutes', 'min', 'mins', 'hour', 'hours', 'hr', 'hrs', 'shortly', 'soon', 'almost',
      'minutos', 'minuto', 'horas', 'hora',
      'ساعة', 'نص ساعة', 'ساعتين', 'دقايق', 'دقيقة', 'ربع ساعة', 'قريب', 'كمان شوية'
    ].some(e => allDriverText.includes(e)) || /\d+\s*(m|h|min|mins|hour|hours|hr|hrs|minuto|minutos|hora|horas|دقيقة|ساعة)/.test(allDriverText);

    const hasRoadside = [
      'roadside', 'service', 'tow', 'mechanic', 'already called', 'no need', 'don\'t need', 'dont need', 'dispatched', 'coming', 'on the way', 'mobile tire', 'technician',
      'si', 'ya llame', 'servicio', 'mecanico en camino', 'no ocupo',
      'محتاج ونش', 'مش محتاج', 'طلبت خدمة', 'الصيانة جاية', 'لا تمام'
    ].some(a => allDriverText.includes(a));

    // Case A: Driver just said initial greeting ("Hello", "Yes", "Speaking", "Hola", "ايوه", "معاك")
    const isInitialGreetingOnly = ['hello', 'hi', 'yes', 'yeah', 'speaking', 'this is me', 'im here', 'i am here', 'hola', 'si', 'alo', 'ايوه', 'نعم', 'معاك', 'تمام', 'اهلا'].some(g => lastSpeech.includes(g)) && !hasReason;
    if (isInitialGreetingOnly && driverTurns.length <= 1) {
      return {
        nextSpeech: `Hello ${driverName}, notice your tractor ${truckId} is stopped on route. What's causing the unscheduled stop?`,
        isClosing: false
      };
    }

    // Case B: Reason is missing -> Ask for stop reason
    if (!hasReason) {
      return {
        nextSpeech: `Got it. Can you confirm the exact reason your truck is currently stopped?`,
        isClosing: false
      };
    }

    // Case C: Reason is known, but ETA is missing -> Ask for ETA
    if (hasReason && !hasETA) {
      return {
        nextSpeech: `Understood. About how long until you're estimated to resume rolling?`,
        isClosing: false
      };
    }

    // Case D: Reason & ETA known, but Roadside assistance status missing -> Ask roadside
    if (hasReason && hasETA && !hasRoadside) {
      return {
        nextSpeech: `Got that logged. Do you need dispatch to authorize emergency roadside service?`,
        isClosing: false
      };
    }

    // Case E: All 3 operational facts captured -> Warm, Professional Closing
    return {
      nextSpeech: defaultClosing,
      isClosing: true
    };
  }

  /**
   * Generates a formal Amazon Relay Delay Report from tour info and conversation transcript
   * @param {Object} tourDetails Tour/Trip metadata
   * @param {Array} transcript Array of { speaker: 'AI'|'Driver', text: string, timestamp: string }
   * @returns {Promise<Object>} Structured Amazon Delay Report
   */
  async generateDelayReport(tourDetails, transcript) {
    const transcriptText = transcript
      .map(entry => `[${entry.speaker}]: ${entry.text}`)
      .join('\n');

    const prompt = `
You are an expert Amazon Relay Dispatch Operations Analyst with deep mastery in understanding real-world commercial truck drivers across all backgrounds, dialects, and heavy non-native English accents.

LOAD & APPOINTMENT DETAILS:
- Tour ID: ${tourDetails.tourId || 'N/A'}
- Trip ID: ${tourDetails.tripId || 'N/A'}
- Driver Name: ${tourDetails.driverName || 'N/A'}
- Truck/Tractor ID: ${tourDetails.truckId || 'N/A'}
- Scheduled Arrival / Gate Time: ${tourDetails.scheduledArrival || '14:30 EST'}
- Current / Last Location: ${tourDetails.location || 'In Transit'}
- Stop Duration: ${tourDetails.stoppedDuration || 'Unscheduled'}

VOICE / SMS TRANSCRIPT:
${transcriptText || '(No verbal response received / Call dropped)'}

SPECIAL COMPREHENSION RULES FOR ACCENTS & NON-NATIVE ENGLISH:
- Accurately interpret non-native English accents, phonetic misspellings, and colloquialisms common in US logistics:
  * Spanish-accented / bilingual drivers (e.g., "tire ponchada", "llanta flat", "mechanico", "no move", "freeway parado").
  * Eastern European / Slavic accents (e.g., "tier broke", "stoppet road", "police block", "brakes smoke").
  * Middle Eastern / Arabic / South Asian accents (e.g., "wheel puncher", "traffic full jam", "service coming soon").
- Extract the core operational facts regardless of broken grammar or background road noise.

CATEGORIZE DELAY AS ONE OF THESE EXACT CATEGORIES:
1. "Mechanical Breakdown" (flat tire, DEF failure, check engine light, coolant leak, air leak, brakes, towing)
2. "Traffic Delay" (road closure, severe gridlock, accident ahead, police block)
3. "Mandatory Rest" (ELD HOS hours expired, required 30-min break, 10-hour sleeper berth)
4. "Facility/Gate Delay" (queue at Amazon FC gate, yard congestion, awaiting bill of lading)
5. "Weather" (snow storm, blizzard, ice, tornado warning, severe winds)
6. "Unresponsive" (driver did not answer, voicemail, silence)

APPOINTMENT IMPACT ANALYSIS:
Compare driver's ETA to the Scheduled Arrival (${tourDetails.scheduledArrival || '14:30 EST'}). If resuming after ETA will cause the truck to arrive past the scheduled gate time, estimate how many minutes late it will be and flag for appointment reschedule.

Return STRICTLY a valid JSON object:
{
  "category": "<One of the 6 categories above>",
  "estimatedTimeToResume": "<Precise ETA, e.g. '45 minutes', '1.5 hours', '15:15 EST'>",
  "rootCauseSummary": "<Concise 1-sentence explanation in formal English>",
  "appointmentImpact": "<e.g. '⚠️ LATE: Estimated ~35 mins past 14:30 EST Gate Window (Reschedule Advised)' OR '✅ ON BUFFER: Within acceptable delivery window'>",
  "driverNotes": "<Clean translation & summary of what the driver stated in clear English>",
  "dispatcherNotes": "<Official Amazon Relay Submission Memo for Relay Ops: includes Truck ID, Tour ID, exact cause, ETA, appointment impact, and roadside actions>",
  "requiresRoadsideAssistance": <boolean true or false>,
  "confidenceScore": <number between 0.0 and 1.0>
}
`;

    if (this.client) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedReport = JSON.parse(cleanJson);

        return {
          id: `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tourId: tourDetails.tourId,
          tripId: tourDetails.tripId,
          driverName: tourDetails.driverName,
          driverPhone: tourDetails.driverPhone,
          truckId: tourDetails.truckId,
          location: tourDetails.location,
          category: parsedReport.category || 'Mechanical Breakdown',
          estimatedTimeToResume: parsedReport.estimatedTimeToResume || '45 minutes',
          appointmentImpact: parsedReport.appointmentImpact || '⚠️ LATE: Estimated ~35 mins past Scheduled Gate Window',
          rootCauseSummary: parsedReport.rootCauseSummary || 'Unscheduled stop reported.',
          driverNotes: parsedReport.driverNotes || transcriptText,
          dispatcherNotes: parsedReport.dispatcherNotes || `Tour ${tourDetails.tourId}: Driver reported stop due to ${parsedReport.category}. ETA: ${parsedReport.estimatedTimeToResume}. Impact: ${parsedReport.appointmentImpact || 'Late Arrival Risk'}.`,
          requiresRoadsideAssistance: Boolean(parsedReport.requiresRoadsideAssistance),
          confidenceScore: parsedReport.confidenceScore || 0.95,
          transcript: transcript,
          status: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
          source: 'Gemini 2.5 Flash'
        };
      } catch (err) {
        console.error(`[GeminiService] Error calling Gemini API:`, err.message);
        console.log(`[GeminiService] Falling back to intelligent heuristic parser.`);
      }
    }

    // Heuristic Fallback Parser
    return this.fallbackHeuristicReport(tourDetails, transcript, transcriptText);
  }

  fallbackHeuristicReport(tourDetails, transcript, transcriptText) {
    const driverUtterances = transcript
      .filter(t => t.speaker === 'Driver')
      .map(t => t.text)
      .join(' ');
    const driverText = driverUtterances.toLowerCase();

    let category = 'Mechanical Breakdown';
    let eta = '45 minutes';
    let roadside = false;
    let rootCause = 'Unscheduled stop reported during active tour transit.';

    if (!driverText.trim() || driverText.includes('no answer') || driverText.includes('voicemail')) {
      category = 'Unresponsive';
      rootCause = 'Driver did not respond to automated dispatch inquiry.';
      eta = 'Unknown';
    } else if (driverText.includes('rest') || driverText.includes('break') || driverText.includes('hos') || driverText.includes('sleeper') || driverText.includes('eld') || driverText.includes('hours') || driverText.includes('استراحة') || driverText.includes('راحه')) {
      category = 'Mandatory Rest';
      rootCause = 'Driver taking mandatory DOT/ELD compliance rest break.';
    } else if (driverText.includes('traffic') || driverText.includes('accident') || driverText.includes('backed up') || driverText.includes('jam') || driverText.includes('gridlock') || driverText.includes('lanes') || driverText.includes('زحمة') || driverText.includes('حادث')) {
      category = 'Traffic Delay';
      rootCause = 'Heavy highway congestion / road blockage encountered.';
    } else if (driverText.includes('gate') || driverText.includes('facility') || driverText.includes('dock') || driverText.includes('yard') || driverText.includes('bol') || driverText.includes('shipper') || driverText.includes('receiver') || driverText.includes('بوابة') || driverText.includes('مخزن')) {
      category = 'Facility/Gate Delay';
      rootCause = 'Experiencing delay at shipper/receiver facility gate or dock.';
    } else if (driverText.includes('snow') || driverText.includes('ice') || driverText.includes('storm') || driverText.includes('rain') || driverText.includes('weather') || driverText.includes('wind') || driverText.includes('blizzard') || driverText.includes('مطر') || driverText.includes('ثلج') || driverText.includes('طقس')) {
      category = 'Weather';
      rootCause = 'Adverse weather conditions hindering safe vehicle operation.';
    } else if (driverText.includes('tire') || driverText.includes('flat') || driverText.includes('engine') || driverText.includes('breakdown') || driverText.includes('air leak') || driverText.includes('mechanic') || driverText.includes('tow') || driverText.includes('coolant') || driverText.includes('overheat') || driverText.includes('blowout') || driverText.includes('alternator') || driverText.includes('battery') || driverText.includes('brake') || driverText.includes('starter') || driverText.includes('def') || driverText.includes('transmission') || driverText.includes('عطل') || driverText.includes('كاوتش') || driverText.includes('ميكانيكي') || driverText.includes('بطارية')) {
      category = 'Mechanical Breakdown';
      roadside = driverText.includes('yes') || driverText.includes('service') || driverText.includes('mechanic') || driverText.includes('tow') || driverText.includes('roadside');
      rootCause = 'Mechanical issue reported with tractor/trailer.';
    }

    // Enhanced Multilingual (Arabic & English) ETA extractor
    if (driverText.includes('نصف ساعة') || driverText.includes('نص ساعة') || driverText.includes('30 min') || driverText.includes('half an hour')) {
      eta = '30 minutes';
    } else if (driverText.includes('ربع ساعة') || driverText.includes('15 min') || driverText.includes('15 mins')) {
      eta = '15 minutes';
    } else if (driverText.includes('ساعة ونص') || driverText.includes('1.5 hour') || driverText.includes('1.5 hours')) {
      eta = '1.5 hours';
    } else if (driverText.includes('ساعتين') || driverText.includes('2 hour') || driverText.includes('2 hours')) {
      eta = '2 hours';
    } else if (driverText.includes('ساعة') || driverText.includes('1 hour') || driverText.includes('an hour') || driverText.includes('one hour')) {
      eta = '1 hour';
    } else {
      const etaMatch = driverText.match(/(\d+)\s*(minutes|mins|hours|hrs|min|hour|دقيقة|ساعة)/i);
      if (etaMatch) {
        eta = `${etaMatch[1]} ${etaMatch[2]}`;
      }
    }

    const tour = tourDetails.tourDetails || tourDetails || {};
    const driverNotesSummary = driverUtterances || 'Driver stated stop in progress.';

    return {
      id: `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tourId: tour.tourId || 'TOU-984210',
      tripId: tour.tripId || 'TRP-44910',
      driverName: tour.driverName || 'Marcus Vance',
      driverPhone: tour.driverPhone || '+1 (555) 349-2041',
      truckId: tour.truckId || 'VOL-8821',
      location: tour.location || 'In Transit',
      category,
      estimatedTimeToResume: eta,
      appointmentImpact: '⚠️ LATE RISK: Stoppage will likely exceed scheduled Amazon gate arrival',
      rootCauseSummary: rootCause,
      driverNotes: driverNotesSummary,
      dispatcherNotes: `[OFFICIAL RELAY MEMO] Tour ID: ${tour.tourId || 'N/A'} | Tractor: ${tour.truckId || 'N/A'} | Driver: ${tour.driverName || 'Driver'}. Stop Category: ${category}. Driver reported: "${driverNotesSummary}". Estimated resume time: ${eta}.`,
      requiresRoadsideAssistance: roadside,
      confidenceScore: 0.88,
      transcript: transcript,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      source: 'Intelligent Conversational Engine'
    };
  }
}

module.exports = new GeminiService();

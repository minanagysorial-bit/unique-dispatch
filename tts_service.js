const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TTSService {
  constructor() {
    this.cacheDir = path.resolve(__dirname, 'public', 'audio_cache');
    this.defaultAIVoice = 'en-US-GuyNeural';
    this.defaultDriverVoice = 'en-US-ChristopherNeural';
    this.defaultOperatorVoice = 'en-US-EricNeural';

    // Ensure audio cache folder exists
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    // In-memory buffer cache for rapid repeated phrases (0ms latency)
    this.memoryCache = new Map();
  }

  getVoiceForSpeaker(speaker = 'AI', customVoice = null) {
    if (customVoice) return customVoice;
    const s = (speaker || 'AI').toUpperCase();
    if (s === 'AI') return this.defaultAIVoice;
    if (s === 'DRIVER') return this.defaultDriverVoice;
    if (s === 'OPERATOR') return this.defaultOperatorVoice;
    return this.defaultAIVoice;
  }

  getCacheKey(text, voice, rate = '0%', pitch = '0Hz') {
    const raw = `${text.trim()}_${voice}_${rate}_${pitch}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  /**
   * Generates MP3 audio buffer using Microsoft Edge Neural TTS
   * @param {string} text - The text to speak
   * @param {string} speaker - 'AI' | 'Driver' | 'Operator'
   * @param {string} customVoice - Optional specific voice name
   * @param {object} options - Optional rate, pitch
   * @returns {Promise<Buffer>} - MP3 Audio Buffer
   */
  async generateSpeechBuffer(text, speaker = 'AI', customVoice = null, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      return null;
    }

    const cleanedText = text.trim();
    const voice = this.getVoiceForSpeaker(speaker, customVoice);
    const rate = options.rate || '0%';
    const pitch = options.pitch || '0Hz';
    const cacheKey = this.getCacheKey(cleanedText, voice, rate, pitch);
    const cachedFilePath = path.join(this.cacheDir, `${cacheKey}.mp3`);

    // 1. Check in-memory cache
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // 2. Check disk cache
    if (fs.existsSync(cachedFilePath)) {
      try {
        const diskBuffer = fs.readFileSync(cachedFilePath);
        if (diskBuffer && diskBuffer.length > 0) {
          this.memoryCache.set(cacheKey, diskBuffer);
          return diskBuffer;
        }
      } catch (err) {
        console.warn('[TTSService] Disk cache read notice:', err.message);
      }
    }

    // 3. Generate from Microsoft Edge Neural TTS
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(cleanedText, {
        rate,
        pitch
      });

      const buffer = await Promise.race([
        new Promise((resolve, reject) => {
          const chunks = [];
          audioStream.on('data', chunk => chunks.push(chunk));
          audioStream.on('end', () => {
            const finalBuf = Buffer.concat(chunks);
            if (finalBuf.length > 0) resolve(finalBuf);
            else reject(new Error('Empty audio stream received from Edge TTS'));
          });
          audioStream.on('error', err => reject(err));
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TTS synthesis timeout (2500ms)')), 2500))
      ]);

      // Save to disk cache asynchronously
      fs.writeFile(cachedFilePath, buffer, (err) => {
        if (err) console.warn('[TTSService] Could not save audio cache file:', err.message);
      });

      // Save to in-memory cache (limit cache to 200 items to prevent heap inflation)
      if (this.memoryCache.size > 200) {
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }
      this.memoryCache.set(cacheKey, buffer);

      console.log(`[TTSService] 🎙️ Synthesized "${cleanedText.slice(0, 30)}..." [${voice}] -> ${buffer.length} bytes`);
      return buffer;
    } catch (err) {
      console.warn(`[TTSService] Neural TTS notice for "${cleanedText.slice(0, 30)}...":`, err.message);
      return null;
    }
  }

  /**
   * Calculates audio duration in milliseconds based on MP3 buffer size (48kbps / 24kHz)
   */
  getAudioDurationMs(buffer) {
    if (!buffer || buffer.length === 0) return 2000;
    // 48 kbps = 6,000 bytes per second -> (bytes / 6000) * 1000 = (bytes / 6) ms
    return Math.round((buffer.length / 6000) * 1000);
  }

  /**
   * Return available natural neural voices
   */
  getAvailableVoices() {
    return [
      { id: 'en-US-GuyNeural', name: 'Guy (Natural American Male Dispatcher)', gender: 'Male', role: 'Default AI Dispatcher' },
      { id: 'en-US-ChristopherNeural', name: 'Christopher (Natural American Male Driver)', gender: 'Male', role: 'Driver Simulation' },
      { id: 'en-US-EricNeural', name: 'Eric (Clear American Male Operator)', gender: 'Male', role: 'Operator Whisper' },
      { id: 'en-US-AriaNeural', name: 'Aria (Natural American Female)', gender: 'Female', role: 'Alternative Voice' },
      { id: 'en-US-JennyNeural', name: 'Jenny (Conversational American Female)', gender: 'Female', role: 'Alternative Voice' },
      { id: 'en-US-SteffanNeural', name: 'Steffan (Crisp American Male)', gender: 'Male', role: 'Alternative Voice' }
    ];
  }
}

module.exports = new TTSService();

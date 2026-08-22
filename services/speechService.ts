/**
 * Speech Recognition and Speech Synthesis Service with Bengali & Hinglish Support
 */
export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private continuous: boolean = true;
  private currentLanguage: string = 'bn-BD'; // Default Bengali + Hinglish
  private wakeWordRegex = /(hey\s+)?(zoya|জয়া|জোয়া)/i;

  public onTranscriptChange: ((transcript: string, isFinal: boolean) => void) | null = null;
  public onWakeWordDetected: (() => void) | null = null;
  public onSpeechStart: (() => void) | null = null;
  public onSpeechEnd: (() => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {
    this.initRecognition();
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  private initRecognition() {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onSpeechStart) this.onSpeechStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const activeText = (finalTranscript || interimTranscript).trim();

        // Check for wake word
        if (this.wakeWordRegex.test(activeText) && this.onWakeWordDetected) {
          this.onWakeWordDetected();
        }

        if (this.onTranscriptChange && activeText) {
          this.onTranscriptChange(activeText, !!finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return; // ignore silence timeout
        console.warn("Speech recognition error:", event.error);
        if (this.onError) this.onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onSpeechEnd) this.onSpeechEnd();
        // Auto-restart if continuous listening is enabled
        if (this.continuous) {
          try {
            setTimeout(() => {
              if (this.continuous && !this.isListening) {
                this.recognition?.start();
              }
            }, 300);
          } catch (e) {}
        }
      };
    } catch (err) {
      console.error("Failed to initialize speech recognition:", err);
    }
  }

  public isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public startListening(continuous: boolean = true): void {
    this.continuous = continuous;
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.lang = this.currentLanguage;
        this.recognition.start();
      } catch (err) {
        // already active
      }
    }
  }

  public stopListening(): void {
    this.continuous = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  public getBestFemaleVoice(preferredVoiceName?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return null;

    if (preferredVoiceName) {
      const match = voices.find((v) => v.name === preferredVoiceName);
      if (match) return match;
    }

    // Check Bengali voice if in bn language
    if (this.currentLanguage.startsWith('bn')) {
      const bnVoice = voices.find((v) => v.lang.startsWith('bn'));
      if (bnVoice) return bnVoice;
    }

    // Ranked priority for Indian English / Hindi / High quality Female voices
    const preferredNames = [
      'Google বাংলা',
      'Google हिन्दी',
      'Google UK English Female',
      'Google US English',
      'Samantha',
      'Victoria',
      'Karen',
      'Zira',
      'Veena',
      'Aditi',
      'Heera',
      'Microsoft Zira',
    ];

    for (const name of preferredNames) {
      const match = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) return match;
    }

    // Fallback to any en-IN or hi-IN voice
    const indVoice = voices.find((v) => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (indVoice) return indVoice;

    // Fallback to any female-tagged voice
    const femaleVoice = voices.find(
      (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')
    );
    if (femaleVoice) return femaleVoice;

    return voices[0];
  }

  public isVoiceConsentApproval(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('অনুমতি দিলাম') ||
      lower.includes('অনুমতি') ||
      lower.includes('হ্যাঁ') ||
      lower.includes('খোলো') ||
      lower.includes('পাঠাও') ||
      lower.includes('allow') ||
      lower.includes('yes') ||
      lower.includes('confirm') ||
      lower.includes('proceed') ||
      lower.includes('approved')
    );
  }

  public isVoiceConsentDenial(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('বাতিল') ||
      lower.includes('না') ||
      lower.includes('করো না') ||
      lower.includes('deny') ||
      lower.includes('cancel') ||
      lower.includes('no') ||
      lower.includes('stop')
    );
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      preferredVoice?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): SpeechSynthesisUtterance | null {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis is not supported in this browser.");
      if (options.onEnd) options.onEnd();
      return null;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const cleanSpeechText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanSpeechText) {
      if (options.onEnd) options.onEnd();
      return null;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    const voice = this.getBestFemaleVoice(options.preferredVoice);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || this.currentLanguage;
    }

    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 1.15;

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      if (options.onError) options.onError(e);
      if (options.onEnd) options.onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();

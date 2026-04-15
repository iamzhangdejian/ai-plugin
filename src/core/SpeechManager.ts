/**
 * SpeechManager - 语音识别与合成管理
 */

export interface SpeechOptions {
  /** 是否启用语音 */
  enabled?: boolean;
  /** 语言 */
  language?: string;
  /** 语速 (0.1 - 10) */
  rate?: number;
  /** 音调 (0 - 2) */
  pitch?: number;
  /** 音量 (0 - 1) */
  volume?: number;
  /** 唤醒词 */
  wakeWord?: string;
}

export interface ISpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

type SpeechCallback = (result: ISpeechRecognitionResult) => void;
type StateCallback = (isListening: boolean) => void;

/**
 * 语音管理类
 * 处理语音识别（STT）和语音合成（TTS）
 */
export class SpeechManager {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private options: Required<SpeechOptions>;
  private isListening = false;
  private isSpeaking = false;
  private recognitionCallbacks: Set<SpeechCallback> = new Set();
  private stateCallbacks: Set<StateCallback> = new Set();
  private wakeWordDetectionEnabled = false;

  constructor(options: SpeechOptions = {}) {
    this.synthesis = window.speechSynthesis;
    this.options = {
      enabled: true,
      language: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      wakeWord: '嗨小智',
      ...options,
    };

    this.initRecognition();
  }

  /**
   * 初始化语音识别
   */
  private initRecognition(): void {
    // 兼容不同浏览器的 SpeechRecognition API
    const SpeechRecognitionClass =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new (SpeechRecognitionClass as any)() as SpeechRecognition;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.language;

      this.recognition.onresult = this.handleRecognitionResult;
      this.recognition.onerror = this.handleRecognitionError;
      this.recognition.onend = this.handleRecognitionEnd;
    } else {
      console.warn('[SpeechManager] Speech Recognition API not supported');
    }
  }

  /**
   * 处理识别结果
   */
  private handleRecognitionResult = (event: unknown): void => {
    const e = event as { results: { length: number; [index: number]: { 0: { transcript: string; isFinal: boolean; confidence: number } } } };
    const results = e.results;
    const lastResult = results[results.length - 1];
    const transcript = lastResult[0].transcript;
    const isFinal = lastResult[0].isFinal;
    const confidence = lastResult[0].confidence;

    // 唤醒词检测
    if (this.wakeWordDetectionEnabled && !this.isListening) {
      if (transcript.includes(this.options.wakeWord)) {
        this.startListening();
        this.dispatchState(true);
        return;
      }
    }

    // 派发结果
    this.recognitionCallbacks.forEach(cb => {
      cb({
        transcript,
        isFinal,
        confidence,
      });
    });
  };

  /**
   * 处理识别错误
   */
  private handleRecognitionError = (event: unknown): void => {
    const error = (event as { error: string }).error;
    console.error('[SpeechManager] Recognition error:', error);

    if (error === 'not-allowed') {
      console.error('[SpeechManager] Microphone permission denied');
    }

    this.isListening = false;
    this.dispatchState(false);
  };

  /**
   * 处理识别结束
   */
  private handleRecognitionEnd = (): void => {
    // 如果是连续模式，重新启动
    if (this.isListening && this.recognition) {
      try {
        this.recognition.start();
      } catch {
        // 忽略重复启动错误
      }
    }
  };

  /**
   * 开始监听
   */
  startListening(): boolean {
    if (!this.options.enabled) {
      console.warn('[SpeechManager] Speech is disabled');
      return false;
    }

    if (!this.recognition) {
      console.warn('[SpeechManager] Speech Recognition not available');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.dispatchState(true);
      return true;
    } catch (error) {
      console.error('[SpeechManager] Failed to start recognition:', error);
      return false;
    }
  }

  /**
   * 停止监听
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    this.isListening = false;
    this.recognition.stop();
    this.dispatchState(false);
  }

  /**
   * 是否正在监听
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * 开始说话（语音合成）
   * @param text - 要说的文本
   * @param onEnd - 说完回调
   */
  speak(text: string, onEnd?: () => void): boolean {
    if (!this.options.enabled) {
      console.warn('[SpeechManager] Speech synthesis is disabled');
      return false;
    }

    // 取消之前的语音
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.options.language;
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    utterance.volume = this.options.volume;

    // 选择中文语音（如果有多个语音）
    const voices = this.synthesis.getVoices();
    const zhVoice = voices.find(voice =>
      voice.lang.includes('zh') || voice.lang.includes('CN')
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('[SpeechManager] Speech synthesis error:', event.error);
      this.isSpeaking = false;
    };

    this.synthesis.speak(utterance);
    return true;
  }

  /**
   * 停止说话
   */
  stopSpeaking(): void {
    if (!this.isSpeaking) return;

    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  /**
   * 是否正在说话
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * 启用唤醒词检测
   */
  enableWakeWordDetection(): void {
    this.wakeWordDetectionEnabled = true;
  }

  /**
   * 禁用唤醒词检测
   */
  disableWakeWordDetection(): void {
    this.wakeWordDetectionEnabled = false;
  }

  /**
   * 设置唤醒词
   */
  setWakeWord(wakeWord: string): void {
    this.options.wakeWord = wakeWord;
  }

  /**
   * 注册识别结果回调
   */
  onRecognition(callback: SpeechCallback): void {
    this.recognitionCallbacks.add(callback);
  }

  /**
   * 移除识别结果回调
   */
  offRecognition(callback: SpeechCallback): void {
    this.recognitionCallbacks.delete(callback);
  }

  /**
   * 注册状态变更回调
   */
  onStateChange(callback: StateCallback): void {
    this.stateCallbacks.add(callback);
  }

  /**
   * 移除状态变更回调
   */
  offStateChange(callback: StateCallback): void {
    this.stateCallbacks.delete(callback);
  }

  /**
   * 派发状态变更
   */
  private dispatchState(isListening: boolean): void {
    this.stateCallbacks.forEach(cb => cb(isListening));
  }

  /**
   * 更新配置
   */
  setOptions(options: Partial<SpeechOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.recognition && options.language) {
      this.recognition.lang = options.language;
    }
  }

  /**
   * 获取配置
   */
  getOptions(): Readonly<SpeechOptions> {
    return { ...this.options };
  }

  /**
   * 检查浏览器支持
   */
  static isSupported(): { recognition: boolean; synthesis: boolean } {
    const SpeechRecognitionClass =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    return {
      recognition: !!SpeechRecognitionClass,
      synthesis: !!window.speechSynthesis,
    };
  }

  /**
   * 请求麦克风权限
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.recognitionCallbacks.clear();
    this.stateCallbacks.clear();

    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
    }
  }
}

// 补充类型定义
declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
  }
}

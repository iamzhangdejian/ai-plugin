/**
 * i18n - 国际化模块
 */

export type Locale = 'zh' | 'en';

export interface TranslationMap {
  'robot.title': string;
  'robot.hint': string;
  'robot.dragHint': string;
  'chat.placeholder': string;
  'chat.emptyHint': string;
  'chat.voice.listening': string;
}

const translations: Record<Locale, TranslationMap> = {
  zh: {
    'robot.title': 'AI 助手',
    'robot.hint': '戳戳我开始聊天吧～',
    'robot.dragHint': '我可以自由拖动哦～',
    'chat.placeholder': '输入消息...',
    'chat.emptyHint': '开始和 AI 助手对话吧～',
    'chat.voice.listening': '🔴',
  },
  en: {
    'robot.title': 'AI Assistant',
    'robot.hint': 'Tap me to chat~',
    'robot.dragHint': 'I can be dragged freely~',
    'chat.placeholder': 'Type a message...',
    'chat.emptyHint': 'Start chatting with AI assistant~',
    'chat.voice.listening': '🔴',
  },
};

let currentLocale: Locale = 'zh';
let localeChangeListeners: Set<(locale: Locale) => void> = new Set();

/**
 * 设置当前语言
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  // 通知所有监听者
  localeChangeListeners.forEach(listener => listener(locale));
}

/**
 * 获取当前语言
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 从 localStorage 加载语言偏好
 */
export function loadLocaleFromStorage(): void {
  const saved = localStorage.getItem('ai-robot-lang') as Locale | null;
  if (saved && (saved === 'zh' || saved === 'en')) {
    setLocale(saved);
  }
}

/**
 * 注册语言变化监听器
 */
export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  localeChangeListeners.add(listener);
  // 返回清理函数
  return () => {
    localeChangeListeners.delete(listener);
  };
}

/**
 * 获取翻译
 */
export function t<K extends keyof TranslationMap>(key: K): TranslationMap[K] {
  return translations[currentLocale][key];
}

/**
 * 获取所有翻译
 */
export function getTranslations(): TranslationMap {
  return translations[currentLocale];
}

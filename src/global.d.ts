/**
 * AI Robot Assistant - Global Type Declarations
 */

import type { AIRobotConfig, AIRobotAPI } from './types/api';

declare global {
  interface Window {
    AIRobot: {
      /**
       * 创建新的 AI Robot 实例
       * @param container - 容器元素或选择器
       * @param config - 配置选项
       */
      create(container?: HTMLElement | string, config?: AIRobotConfig): AIRobotAPI;

      /**
       * 注册 Web Component
       */
      register(): void;

      /**
       * 获取已有的机器人实例
       */
      getInstance(selector?: string): HTMLElement | null;

      /**
       * 检查浏览器支持
       */
      checkSupport(): {
        webComponents: boolean;
        speechRecognition: boolean;
        speechSynthesis: boolean;
        webGL: boolean;
      };

      /**
       * 版本号
       */
      version: string;
    };
  }

  interface HTMLElementTagNameMap {
    'ai-robot': AIRobotElement & AIRobotAPI;
  }

  interface AIRobotElement extends HTMLElement {
    // 属性
    apiKey: string;
    apiEndpoint: string;
    wakeWord: string;
    theme: string;
    position: string;
    visible: boolean;

    // 方法
    send(message: string): Promise<string>;
    setConfig(config: Partial<AIRobotConfig>): void;
    getConfig(): Readonly<AIRobotConfig>;
    show(): void;
    hide(): void;
    toggle(): void;
    speak(text: string): void;
    stopSpeaking(): void;
    startListening(): void;
    stopListening(): void;
    addMessage(message: string, type: 'user' | 'assistant'): void;
    clearHistory(): void;
    getHistory(): import('./types').Message[];
    getState(): import('./types').RobotState;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    destroy(): void;

    // 生命周期
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
  }
}

// 导出空模块以确保 TypeScript 将其视为模块
export {};

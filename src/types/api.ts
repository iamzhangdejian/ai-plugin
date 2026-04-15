/**
 * AI Robot API Interface
 */

import type { AIRobotConfig, Message, RobotState } from './index';

/**
 * AI Robot 公共 API 接口
 */
export interface AIRobotAPI {
  /**
   * 发送消息并获取回复
   * @param message - 用户消息
   * @returns AI 回复内容
   */
  send(message: string): Promise<string>;

  /**
   * 更新配置
   * @param config - 配置选项
   */
  setConfig(config: Partial<AIRobotConfig>): void;

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<AIRobotConfig>;

  /**
   * 显示机器人
   */
  show(): void;

  /**
   * 隐藏机器人
   */
  hide(): void;

  /**
   * 切换可见性
   */
  toggle(): void;

  /**
   * 语音合成说话
   * @param text - 要说的文本
   */
  speak(text: string): void;

  /**
   * 停止说话
   */
  stopSpeaking(): void;

  /**
   * 开始监听语音
   */
  startListening(): void;

  /**
   * 停止监听语音
   */
  stopListening(): void;

  /**
   * 添加消息到历史
   * @param message - 消息内容
   * @param type - 消息类型
   */
  addMessage(message: string, type: 'user' | 'assistant'): void;

  /**
   * 清空对话历史
   */
  clearHistory(): void;

  /**
   * 获取对话历史
   */
  getHistory(): Message[];

  /**
   * 获取当前状态
   */
  getState(): RobotState;

  /**
   * 注册事件监听器
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  on(event: string, callback: (...args: unknown[]) => void): void;

  /**
   * 移除事件监听器
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  off(event: string, callback: (...args: unknown[]) => void): void;

  /**
   * 销毁实例
   */
  destroy(): void;
}

/**
 * 全局类型声明
 */
declare global {
  interface HTMLElementTagNameMap {
    'ai-robot': AIRobotElement;
  }

  interface AIRobotElement extends HTMLElement {
    // AIRobotAPI 方法
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
    getHistory(): import('./index').Message[];
    getState(): import('./index').RobotState;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    destroy(): void;

    // 生命周期
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
  }

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
       * 获取版本
       */
      version: string;
    };
  }
}

export {};

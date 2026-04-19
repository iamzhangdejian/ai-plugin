/**
 * AIRobotElement - Web Component 主入口
 */

import { Robot } from './Robot/Robot';
import { ChatPanel } from './Chat/ChatPanel';
import { AIAssistant } from '../core/AIAssistant';
import { SpeechManager } from '../core/SpeechManager';
import { StateMachine } from '../core/StateMachine';
import type { AIRobotConfig, Message, RobotState } from '../types';
import type { RobotTheme } from '../types';
import { createElement } from '../utils/dom';
import type { AIRobotAPI } from '../types/api';
import { loadLocaleFromStorage, onLocaleChange, t } from '../i18n';

export class AIRobotElement extends HTMLElement implements AIRobotAPI {
  private shadow!: ShadowRoot;
  private robot!: Robot;
  private chatPanel!: ChatPanel;
  private aiAssistant!: AIAssistant;
  private speechManager!: SpeechManager;
  private stateMachine!: StateMachine;

  private config: AIRobotConfig = {
    apiKey: '',
    apiEndpoint: '',
    wakeWord: '嗨小智',
    theme: 'blue',
    position: 'right',
    visible: true,
    voice: {
      enabled: true,
      language: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
    },
  };

  private eventCallbacks: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  private initialized = false;
  private chatPanelVisible = false;
  private positionUpdateFrame: number | null = null;
  private isDisconnected = false; // 跟踪是否是断开连接
  private readonly STORAGE_KEY = 'ai-robot-position'; // 存储位置的 key

  static get observedAttributes(): string[] {
    return ['api-key', 'api-endpoint', 'wake-word', 'theme', 'position', 'visible'];
  }

  constructor() {
    super();
    this.initConfig();
  }

  private initConfig(): void {
    const apiKey = this.getAttribute('api-key');
    const apiEndpoint = this.getAttribute('api-endpoint');
    const wakeWord = this.getAttribute('wake-word');
    const theme = this.getAttribute('theme') as RobotTheme;
    const position = this.getAttribute('position') as 'left' | 'right';
    const visible = this.getAttribute('visible') !== 'false';

    if (apiKey) this.config.apiKey = apiKey;
    if (apiEndpoint) this.config.apiEndpoint = apiEndpoint;
    if (wakeWord) this.config.wakeWord = wakeWord;
    if (theme) this.config.theme = theme;
    if (position) this.config.position = position;
    this.config.visible = visible;
  }

  connectedCallback(): void {
    // 如果是重新连接，恢复状态
    if (this.isDisconnected) {
      this.isDisconnected = false;
      return;
    }

    if (this.initialized) return;

    // 对于 embedded 模式，设置宿主元素为透明和零尺寸，避免白色区块闪烁
    const isEmbedded = this.hasAttribute('embedded');
    if (isEmbedded) {
      this.style.cssText = 'width: 0; height: 0; opacity: 0; visibility: hidden; border: none; background: transparent;';
    }

    this.createShadow();
    this.initComponents();
    this.bindEvents();
    this.initialized = true;

    this.dispatch('robot-ready');
    window.dispatchEvent(new CustomEvent('ai-robot-ready', { detail: { robot: this } }));
  }

  disconnectedCallback(): void {
    // 标记为已断开，但不立即销毁
    this.isDisconnected = true;
    // 暂时不销毁组件，等待可能的重新连接
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.initialized || oldValue === newValue) return;

    switch (name) {
      case 'api-key':
        this.config.apiKey = newValue || '';
        this.aiAssistant?.setConfig({ apiKey: this.config.apiKey });
        break;
      case 'api-endpoint':
        this.config.apiEndpoint = newValue || '';
        this.aiAssistant?.setConfig({ apiEndpoint: this.config.apiEndpoint, mockMode: !this.config.apiEndpoint });
        break;
      case 'wake-word':
        this.config.wakeWord = newValue || '';
        this.speechManager?.setWakeWord(newValue || '');
        break;
      case 'theme':
        this.setTheme(newValue as RobotTheme);
        break;
      case 'visible':
        if (newValue === 'false') {
          this.hide();
        } else {
          this.show();
        }
        break;
    }

    this.dispatch('config-change', { [name]: newValue });
  }

  private createShadow(): void {
    this.shadow = this.attachShadow({ mode: 'open' });

    const isEmbedded = this.hasAttribute('embedded');

    // 在 Shadow DOM 内部设置 :host 样式为透明
    const hostStyle = createElement('style');
    hostStyle.textContent = `
      :host {
        all: initial;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    this.shadow.appendChild(hostStyle);

    // 对话框容器
    const chatContainer = createElement('div', 'chat-container');
    // 对于 embedded 模式，对话框也需要添加到 document.body，使用 fixed 定位
    chatContainer.style.cssText = `
      all: initial;
      position: fixed;
      z-index: 1000000;
      pointer-events: none;
      left: 0;
      top: 0;
    `;

    // 对于 embedded 模式，将 chatContainer 添加到 document.body
    if (isEmbedded) {
      document.body.appendChild(chatContainer);
    } else {
      this.shadow.appendChild(chatContainer);
    }

    // 保存引用以便更新位置
    (this as unknown as Record<string, unknown>).chatContainer = chatContainer;
    // robotContainer 现在是 ShadowRoot，Robot 将在其中创建内容
    (this as unknown as Record<string, unknown>).robotContainer = this.shadow;
  }

  private initComponents(): void {
    this.stateMachine = new StateMachine();

    this.aiAssistant = new AIAssistant({
      apiKey: this.config.apiKey,
      apiEndpoint: this.config.apiEndpoint,
      mockMode: !this.config.apiEndpoint,
    });

    this.speechManager = new SpeechManager({
      enabled: this.config.voice?.enabled ?? true,
      language: this.config.voice?.language ?? 'zh-CN',
      rate: this.config.voice?.rate ?? 1.0,
      pitch: this.config.voice?.pitch ?? 1.0,
      wakeWord: this.config.wakeWord,
    });

    this.speechManager.onRecognition((result) => {
      if ((result as unknown as { isFinal: boolean }).isFinal) {
        this.handleVoiceInput((result as unknown as { transcript: string }).transcript);
      }
    });

    const robotContainer = (this as unknown as Record<string, unknown>).robotContainer as HTMLElement;
    const isEmbedded = this.hasAttribute('embedded');

    this.robot = new Robot(robotContainer, {
      theme: this.config.theme as 'blue' | 'green' | 'purple' | undefined,
      position: this.config.position,
      visible: this.config.visible,
      embedded: isEmbedded,
    });

    // 计算初始位置（白色卡片区域中心）- 在机器人初始化后设置
    if (isEmbedded) {
      // 检查是否是页面刷新
      const isPageRefresh = document.documentElement.getAttribute('data-ai-robot-reset') === 'true';

      // 页面刷新时清除保存的位置记录
      if (isPageRefresh) {
        sessionStorage.removeItem('ai-robot-saved');
        this.clearSavedPosition();
      }

      // 使用 sessionStorage 标记本次会话是否已保存过位置
      const hasSavedInSession = sessionStorage.getItem('ai-robot-saved');

      if (hasSavedInSession) {
        // 本次会话中有保存的位置，恢复它
        const savedPosition = this.loadSavedPosition();
        if (savedPosition) {
          console.log('[AIRobotElement] Restoring saved position:', savedPosition);
          requestAnimationFrame(() => {
            // 添加垂直偏移量，向下移动 20px 使机器人视觉上居中
            this.robot.setPosition(savedPosition.x, savedPosition.y, 20);
          });
        } else {
          // 如果 sessionStorage 有标记但 localStorage 没有位置，重新计算中心位置
          requestAnimationFrame(() => {
            const container = this.parentElement;
            if (container) {
              const rect = container.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              console.log('[AIRobotElement] Container rect:', rect, 'Center:', centerX, centerY);
              // 添加垂直偏移量，向下移动 20px 使机器人视觉上居中
              this.robot.setPosition(centerX, centerY, 20);
            }
          });
        }
      } else {
        // 第一次加载时，计算容器中心位置
        requestAnimationFrame(() => {
          const container = this.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            console.log('[AIRobotElement] Container rect:', rect, 'Center:', centerX, centerY);
            // 添加垂直偏移量，向下移动 20px 使机器人视觉上居中
            this.robot.setPosition(centerX, centerY, 20);
          }
        });
      }
    }

    // 加载语言偏好
    loadLocaleFromStorage();

    const chatContainer = (this as unknown as Record<string, unknown>).chatContainer as HTMLElement;
    this.chatPanel = new ChatPanel(chatContainer, {
      theme: this.config.theme as 'blue' | 'green' | 'purple' | undefined,
      title: t('robot.title'),
      bubbleMode: true,
    });

    // 监听语言变化（通过 i18n 模块）
    onLocaleChange((locale) => {
      // 更新 ChatPanel 翻译
      this.chatPanel.updateLocale(locale);
    });

    // 监听页面级别的语言切换事件
    window.addEventListener('ai-robot-locale-change', ((e: Event) => {
      const locale = (e as CustomEvent<{ locale: 'zh' | 'en' }>).detail.locale;
      this.chatPanel.updateLocale(locale);
    }) as EventListener);

    this.chatPanel.setCallbacks({
      onSend: (message) => this.sendMessage(message),
      onVoice: () => this.toggleListening(),
      onClose: () => this.hideChat(),
    });

    // 机器人点击事件
    this.robot.on('click', () => {
      this.toggleChat();
    });

    // 拖拽时实时更新对话框位置
    this.robot.on('dragStart', () => {
      this.stateMachine.setState('dragging');
      this.startPositionUpdate();
    });

    this.robot.on('dragEnd', () => {
      if (this.stateMachine.getState() === 'dragging') {
        this.stateMachine.setState('idle');
      }
      this.stopPositionUpdate();
      // 保存位置到 localStorage
      const pos = this.robot.getPosition();
      this.savePosition(pos.x, pos.y);
      // 标记本次会话已保存位置
      sessionStorage.setItem('ai-robot-saved', 'true');
    });

    this.stateMachine.on('*', (newState) => {
      this.robot.setState(newState);
    });

    this.stateMachine.setState('idle');
  }

  /**
   * 开始位置更新循环
   */
  private startPositionUpdate(): void {
    if (this.positionUpdateFrame !== null) return; // 防止重复启动

    const update = () => {
      this.updateChatPosition();
      this.positionUpdateFrame = requestAnimationFrame(update);
    };
    this.positionUpdateFrame = requestAnimationFrame(update);
  }

  /**
   * 停止位置更新循环
   */
  private stopPositionUpdate(): void {
    if (this.positionUpdateFrame !== null) {
      cancelAnimationFrame(this.positionUpdateFrame);
      this.positionUpdateFrame = null;
    }
  }

  /**
   * 更新对话框位置
   */
  private updateChatPosition(): void {
    const headPos = this.robot.getHeadPosition();
    const robotRect = this.robot.getBoundingRect();
    if (this.chatPanel) {
      // 使用自适应位置计算
      this.chatPanel.adjustPosition(headPos, robotRect);
    }
  }

  private bindEvents(): void {
    // 移除会导致无限循环的 state-change 监听器
    // 状态变化通过 stateMachine.on('*', ...) 直接处理
  }

  private toggleChat(): void {
    this.chatPanelVisible = !this.chatPanelVisible;
    if (this.chatPanelVisible) {
      this.chatPanel.show();
      this.updateChatPosition();
    } else {
      this.chatPanel.hide();
    }
  }

  private handleVoiceInput(transcript: string): void {
    if (transcript.trim()) {
      if (!this.chatPanelVisible) {
        this.toggleChat();
      }
      this.sendMessage(transcript);
    }
  }

  private toggleListening(): void {
    if (this.speechManager.getIsListening()) {
      this.speechManager.stopListening();
      this.chatPanel.setListeningState(false);
      this.stateMachine.setState('idle');
    } else {
      const started = this.speechManager.startListening();
      if (started) {
        this.chatPanel.setListeningState(true);
        this.stateMachine.setState('listening');
      }
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.chatPanelVisible) {
      this.toggleChat();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: Date.now(),
    };
    this.chatPanel.addMessage(userMessage);
    this.dispatch('message-sent', userMessage);

    this.stateMachine.setState('thinking');
    this.chatPanel.setTypingState(true);

    // 创建流式消息
    const streamMessage = this.chatPanel.createStreamingMessage();
    this.chatPanel.setTypingState(false);

    try {
      await this.aiAssistant.send(message, (chunk) => {
        streamMessage.append(chunk);
      }, (response) => {
        console.log('[AIRobotElement] onResponse received:', response);
        if (response && response.report) {
          console.log('[AIRobotElement] Rendering report in bubble:', response.report);
          try {
            // 在流式消息气泡内渲染报表
            (streamMessage as any).renderReportInBubble(response.report);
          } catch (e) {
            console.error('[AIRobotElement] renderReportInBubble failed:', e);
          }
        } else {
          console.log('[AIRobotElement] No report in response');
        }
      });
      // 完成，添加操作按钮
      streamMessage.end();
    } catch (error) {
      streamMessage.end();
      console.error('[AIRobotElement] Send message failed:', error);
    }

    this.stateMachine.setState('idle');
  }

  private hideChat(): void {
    this.chatPanelVisible = false;
    this.chatPanel.hide();
  }

  async send(message: string): Promise<string> {
    const reply = await this.aiAssistant.send(message);

    if (this.chatPanel) {
      this.chatPanel.addMessage({
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: Date.now(),
      });
      this.chatPanel.addMessage({
        id: Date.now().toString(),
        type: 'assistant',
        content: reply,
        timestamp: Date.now(),
      });
    }

    return reply;
  }

  setConfig(config: Partial<AIRobotConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.apiKey || config.apiEndpoint) {
      const newEndpoint = config.apiEndpoint ?? this.config.apiEndpoint;
      this.aiAssistant.setConfig({
        apiKey: config.apiKey ?? this.config.apiKey,
        apiEndpoint: newEndpoint,
        mockMode: !newEndpoint,
      });
    }

    if (config.wakeWord) {
      this.speechManager.setWakeWord(config.wakeWord);
    }

    if (config.theme) {
      this.setTheme(config.theme);
    }

    if (config.voice) {
      this.speechManager.setOptions(config.voice);
    }

    this.dispatch('config-change', config);
  }

  getConfig(): Readonly<AIRobotConfig> {
    return { ...this.config };
  }

  show(): void {
    this.robot.show();
    this.stateMachine.setState('idle');
  }

  hide(): void {
    this.robot.hide();
    this.chatPanel.hide();
    this.stateMachine.setState('hidden');
  }

  toggle(): void {
    const state = this.stateMachine.getState();
    if (state === 'hidden') {
      this.show();
    } else {
      this.hide();
    }
  }

  speak(text: string): void {
    this.speechManager.speak(text);
    this.stateMachine.setState('speaking');
  }

  stopSpeaking(): void {
    this.speechManager.stopSpeaking();
    this.stateMachine.setState('idle');
  }

  startListening(): void {
    this.speechManager.startListening();
    this.stateMachine.setState('listening');
  }

  stopListening(): void {
    this.speechManager.stopListening();
    this.stateMachine.setState('idle');
  }

  addMessage(message: string, type: 'user' | 'assistant'): void {
    this.aiAssistant.addMessagePublic(message, type);
    this.chatPanel.addMessage({
      id: Date.now().toString(),
      type,
      content: message,
      timestamp: Date.now(),
    });
  }

  clearHistory(): void {
    this.aiAssistant.clearHistory();
    this.chatPanel.clearMessages();
  }

  /**
   * 显示提示气泡并播放跳舞动画
   */
  showHintBubble(): void {
    this.robot.showHintBubble();
  }

  getHistory(): Message[] {
    return this.aiAssistant.getHistory();
  }

  getState(): RobotState {
    return this.stateMachine.getState();
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.eventCallbacks.get(event) || new Set();
    callbacks.add(callback);
    this.eventCallbacks.set(event, callbacks);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  setTheme(theme: 'blue' | 'green' | 'purple'): void {
    this.config.theme = theme;
    this.robot.setTheme(theme);
    this.chatPanel.setTheme(theme);
  }

  setSkin(skin: 'default' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'dark'): void {
    this.robot.setSkin(skin);
  }

  private dispatch(event: string, detail?: unknown): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(detail));
    }

    const domEvent = new CustomEvent(event, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(domEvent);
  }

  /**
   * 保存位置到 localStorage
   */
  private savePosition(x: number, y: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ x, y }));
    } catch (e) {
      console.warn('[AIRobotElement] Failed to save position:', e);
    }
  }

  /**
   * 从 localStorage 加载保存的位置
   */
  private loadSavedPosition(): { x: number; y: number } | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const position = JSON.parse(saved);
        // 如果位置在左上角（0, 0 附近），认为是无效位置，返回 null
        if (position.x < 50 && position.y < 50) {
          return null;
        }
        return position;
      }
    } catch (e) {
      console.warn('[AIRobotElement] Failed to load position:', e);
    }
    return null;
  }

  /**
   * 清除保存的位置
   */
  private clearSavedPosition(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('[AIRobotElement] Failed to clear position:', e);
    }
  }

  /**
   * 重置机器人到初始位置（白色卡片中心）
   */
  public resetToInitialPosition(): void {
    const isEmbedded = this.hasAttribute('embedded');
    if (isEmbedded) {
      // 清除保存的位置
      this.clearSavedPosition();
      sessionStorage.removeItem('ai-robot-saved');

      // 重新计算容器中心位置
      requestAnimationFrame(() => {
        const container = this.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          // 添加垂直偏移量，向下移动 20px 使机器人视觉上居中
          this.robot.setPosition(centerX, centerY, 20);
        }
      });
    }
  }

  destroy(): void {
    this.isDisconnected = false;
    this.stopPositionUpdate();
    this.speechManager.destroy();
    this.aiAssistant.destroy();
    this.chatPanel.destroy();
    this.robot.destroy();
    this.stateMachine.clearCallbacks();
    this.eventCallbacks.clear();

    // 清理 embedded 模式的 chatContainer
    const isEmbedded = this.hasAttribute('embedded');
    if (isEmbedded) {
      const chatContainer = (this as unknown as Record<string, unknown>).chatContainer as HTMLElement;
      if (chatContainer && chatContainer.parentNode === document.body) {
        chatContainer.remove();
      }
    }

    this.initialized = false;
  }
}

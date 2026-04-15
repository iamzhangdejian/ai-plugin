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

    this.createShadow();
    this.initComponents();
    this.bindEvents();
    this.initialized = true;

    // 检查是否是页面刷新，清除标记
    if (document.documentElement.getAttribute('data-ai-robot-reset') === 'true') {
      console.log('[AIRobotElement] Page refresh completed, position reset');
      document.documentElement.removeAttribute('data-ai-robot-reset');
    }

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
        this.aiAssistant?.setConfig({ apiEndpoint: this.config.apiEndpoint });
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

    // 机器人容器
    const robotContainer = createElement('div', 'robot-container');
    robotContainer.style.cssText = `
      all: initial;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    this.shadow.appendChild(robotContainer);

    // 对话框容器 - 与机器人同级，固定在 shadow DOM 中
    const chatContainer = createElement('div', 'chat-container');
    chatContainer.style.cssText = `
      all: initial;
      position: ${isEmbedded ? 'absolute' : 'fixed'};
      z-index: 1000000;
      pointer-events: none;
      left: 0;
      top: 0;
    `;
    this.shadow.appendChild(chatContainer);

    // 保存引用以便更新位置
    (this as unknown as Record<string, unknown>).chatContainer = chatContainer;
    // 保存 robotContainer 引用
    (this as unknown as Record<string, unknown>).robotContainer = robotContainer;
  }

  private initComponents(): void {
    this.stateMachine = new StateMachine();

    console.log('[AIRobotElement] Initializing with config:', {
      apiKey: this.config.apiKey ? '***' : '(empty)',
      apiEndpoint: this.config.apiEndpoint || '(empty)',
      mockMode: !this.config.apiEndpoint
    });

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
      // 检查是否是页面刷新，如果是则忽略保存的位置
      const isPageRefreshFlag = document.documentElement.getAttribute('data-ai-robot-reset') === 'true';
      console.log('[AIRobotElement] Checking refresh flag:', isPageRefreshFlag);

      let useInitialPosition = isPageRefreshFlag;

      // 非刷新页面，检查是否有保存的位置
      if (!isPageRefreshFlag) {
        const savedPosition = this.loadSavedPosition();
        if (savedPosition) {
          // 使用保存的位置
          this.robot.setPosition(savedPosition.x, savedPosition.y);
          console.log('[AIRobotElement] Restored saved position:', savedPosition);
          useInitialPosition = false;
        } else {
          useInitialPosition = true;
          console.log('[AIRobotElement] No saved position, using initial position');
        }
      } else {
        console.log('[AIRobotElement] Page refresh detected, using initial position');
      }

      // 设置初始位置
      if (useInitialPosition) {
        // 延迟等待容器渲染
        setTimeout(() => {
          const container = document.getElementById('hero-robot-container');
          if (container) {
            const rect = container.getBoundingClientRect();
            const robotWrapperSize = 270;
            const robotVisualOffset = 120;

            const centerX = rect.left + (rect.width - robotWrapperSize) / 2;
            const centerY = rect.top + (rect.height - robotWrapperSize) / 2 + robotVisualOffset;

            this.robot.setPosition(centerX, centerY);
            console.log('[AIRobotElement] Set initial position:', { x: centerX, y: centerY });
          }
        }, 200);
      }
    }

    const chatContainer = (this as unknown as Record<string, unknown>).chatContainer as HTMLElement;
    this.chatPanel = new ChatPanel(chatContainer, {
      theme: this.config.theme as 'blue' | 'green' | 'purple' | undefined,
      title: 'AI 助手',
      bubbleMode: true,
    });

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
    window.addEventListener('state-change', ((e: CustomEvent) => {
      const { from, to } = e.detail;
      this.dispatch('state-change', { from, to });
    }) as EventListener);
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

    const reply = await this.aiAssistant.send(message);

    this.stateMachine.setState('idle');
    this.chatPanel.setTypingState(false);

    const assistantMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: reply,
      timestamp: Date.now(),
    };
    this.chatPanel.addMessage(assistantMessage);
    this.dispatch('message-received', assistantMessage);

    if (this.config.voice?.enabled) {
      this.speechManager.speak(reply);
    }
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
      this.aiAssistant.setConfig({
        apiKey: config.apiKey ?? this.config.apiKey,
        apiEndpoint: config.apiEndpoint ?? this.config.apiEndpoint,
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
        return JSON.parse(saved);
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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = document.getElementById('hero-robot-container');
          if (container) {
            const rect = container.getBoundingClientRect();
            const robotWrapperSize = 270;
            const robotVisualOffset = 120;

            const centerX = rect.left + (rect.width - robotWrapperSize) / 2;
            const centerY = rect.top + (rect.height - robotWrapperSize) / 2 + robotVisualOffset;

            this.robot.setPosition(centerX, centerY);
            // 清除保存的位置
            this.clearSavedPosition();
            console.log('[AIRobotElement] Reset to initial position:', { x: centerX, y: centerY });
          }
        });
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
    this.initialized = false;
  }
}

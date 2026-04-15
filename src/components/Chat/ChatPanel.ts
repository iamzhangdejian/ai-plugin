/**
 * ChatPanel - 对话面板组件
 */

import { marked } from 'marked';
import { createElement, clearChildren } from '../../utils/dom';
import { t, loadLocaleFromStorage } from '../../i18n';
import type { Message } from '../../types';

export interface ChatPanelOptions {
  theme?: 'blue' | 'green' | 'purple';
  title?: string;
  bubbleMode?: boolean;
  minWidth?: number;
  minHeight?: number;
  initialWidth?: number;
  initialHeight?: number;
}

/**
 * 对话面板类
 * 管理消息列表、输入框、语音按钮
 */
export class ChatPanel {
  private shadow: ShadowRoot;
  private options: Required<ChatPanelOptions>;
  private messagesContainer: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private voiceButton: HTMLButtonElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private visible = false;
  private messages: Message[] = [];

  // 拖拽和拉伸相关
  private isResizing = false;
  private resizeDirection: string | null = null;
  private resizeStartPos = { x: 0, y: 0 };
  private resizeStartSize = { width: 0, height: 0 };

  // 回调
  private onSend?: (message: string) => void;
  private onVoice?: () => void;
  private onClose?: () => void;

  constructor(_container: HTMLElement, options: ChatPanelOptions = {}) {
    this.shadow = _container.attachShadow({ mode: 'open' });
    loadLocaleFromStorage();
    this.options = {
      theme: 'blue',
      title: t('robot.title'),
      bubbleMode: false,
      minWidth: 280,
      minHeight: 200,
      initialWidth: 380,
      initialHeight: 450,
      ...options,
    };

    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    this.createStyles();
    this.createStructure();
    this.bindEvents();
    this.initMarked();
  }

  /**
   * 创建样式
   */
  private createStyles(): void {
    const style = createElement('style');
    const themeColors = {
      blue: { primary: '#3B82F6', light: '#60A5FA', dark: '#2563EB', gradient: 'linear-gradient(135deg, #667eea 0%, #3B82F6 100%)' },
      green: { primary: '#10B981', light: '#34D399', dark: '#059669', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
      purple: { primary: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
    };
    const colors = themeColors[this.options.theme];

    style.textContent = `
      :host {
        --chat-primary: ${colors.primary};
        --chat-primary-light: ${colors.light};
        --chat-primary-dark: ${colors.dark};
        --chat-gradient: ${colors.gradient};
        --chat-bg: #FFFFFF;
        --chat-surface: #F8FAFC;
        --chat-text: #1E293B;
        --chat-text-light: #64748B;
        --chat-border: rgba(30, 41, 59, 0.1);
        --chat-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        --chat-shadow-hover: 0 20px 60px rgba(59, 130, 246, 0.25);

        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;

        * {
          box-sizing: border-box;
        }
      }

      .chat-panel {
        position: absolute;
        bottom: calc(160px + 16px);
        right: 0;
        width: 360px;
        max-height: 500px;
        background: var(--chat-bg);
        border-radius: 24px;
        box-shadow: var(--chat-shadow);
        border: 1px solid var(--chat-border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform-origin: bottom right;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
        transform: scale(0.9) translateY(20px);
        pointer-events: none;
      }

      /* 气泡模式 */
      .chat-panel.bubble-mode {
        position: fixed;
        bottom: auto;
        right: auto;
        min-width: 280px;
        min-height: 200px;
        border-radius: 16px;
        transform-origin: bottom center;
        overflow: visible !important;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
      }

      /* 气泡模式可见时启用 pointer-events */
      .chat-panel.bubble-mode.visible {
        pointer-events: auto;
      }

      /* 气泡模式下允许内容自适应 */
      .chat-panel.bubble-mode .chat-messages {
        min-height: 120px;
        max-height: none;
        flex: 1;
      }

      /* 气泡箭头 - 默认向下 */
      .chat-panel.bubble-mode::before {
        content: '';
        position: absolute;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 12px solid rgba(0, 0, 0, 0.1);
        display: block !important;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }

      .chat-panel.bubble-mode::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid var(--chat-bg);
        display: block !important;
      }

      /* 气泡箭头向上 */
      .chat-panel.bubble-mode.arrow-top::before {
        bottom: auto;
        top: -12px;
        border-top: none;
        border-bottom: 12px solid rgba(0, 0, 0, 0.1);
      }

      .chat-panel.bubble-mode.arrow-top::after {
        bottom: auto;
        top: -10px;
        border-top: none;
        border-bottom: 10px solid var(--chat-bg);
      }

      /* 气泡箭头向左 */
      .chat-panel.bubble-mode.arrow-left::before {
        bottom: auto;
        top: 20px;
        left: -10px;
        transform: none;
        border-left: none;
        border-right: 10px solid rgba(0, 0, 0, 0.1);
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
      }

      .chat-panel.bubble-mode.arrow-left::after {
        bottom: auto;
        top: 20px;
        left: -8px;
        transform: none;
        border-left: none;
        border-right: 8px solid var(--chat-bg);
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
      }

      /* 气泡箭头向右 */
      .chat-panel.bubble-mode.arrow-right::before {
        bottom: auto;
        top: 20px;
        right: -10px;
        left: auto;
        transform: none;
        border-right: none;
        border-left: 10px solid rgba(0, 0, 0, 0.1);
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
      }

      .chat-panel.bubble-mode.arrow-right::after {
        bottom: auto;
        top: 20px;
        right: -8px;
        left: auto;
        transform: none;
        border-right: none;
        border-left: 8px solid var(--chat-bg);
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
      }

      /* 气泡箭头向上（对话框在机器人下方） */
      .chat-panel.bubble-mode.arrow-top::before {
        bottom: auto;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-top: none;
        border-bottom: 12px solid rgba(0, 0, 0, 0.1);
      }

      .chat-panel.bubble-mode.arrow-top::after {
        bottom: auto;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-top: none;
        border-bottom: 10px solid var(--chat-bg);
      }

      /* 气泡箭头向下（对话框在机器人上方） */
      .chat-panel.bubble-mode.arrow-bottom::before {
        bottom: -12px;
        top: auto;
        left: 50%;
        transform: translateX(-50%);
        border-bottom: none;
        border-top: 12px solid rgba(0, 0, 0, 0.1);
      }

      .chat-panel.bubble-mode.arrow-bottom::after {
        bottom: -10px;
        top: auto;
        left: 50%;
        transform: translateX(-50%);
        border-bottom: none;
        border-top: 10px solid var(--chat-bg);
      }

      .chat-panel.bubble-mode.visible {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }

      .chat-panel.visible {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }

      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        background: var(--chat-gradient);
        color: white;
        position: relative;
        overflow: hidden;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
      }

      .chat-header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
        animation: headerShine 3s ease-in-out infinite;
      }

      @keyframes headerShine {
        0% { transform: translateX(-100%) rotate(45deg); }
        100% { transform: translateX(100%) rotate(45deg); }
      }

      .chat-title {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        z-index: 1;
      }

      .chat-title-icon {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        backdrop-filter: blur(5px);
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .chat-close {
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.3s ease;
        position: relative;
        z-index: 1;
        backdrop-filter: blur(5px);
      }

      .chat-close:hover {
        background: rgba(255, 255, 255, 0.35);
        transform: rotate(90deg) scale(1.1);
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: var(--chat-surface);
        min-height: 80px;
      }

      .chat-panel.bubble-mode .chat-messages {
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
      }

      .chat-messages:empty::before {
        content: '${t('chat.emptyHint').replace(/'/g, "\\'")}';
        color: var(--chat-text-light);
        text-align: center;
        padding: 40px 20px;
        font-size: 14px;
        animation: placeholderPulse 2s ease-in-out infinite;
      }

      @keyframes placeholderPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .chat-input-container {
        display: flex;
        gap: 10px;
        padding: 16px;
        background: var(--chat-bg);
        border-top: 1px solid var(--chat-border);
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
      }

      .chat-input {
        flex: 1;
        padding: 14px 18px;
        border: 2px solid var(--chat-border);
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: all 0.3s ease;
        font-family: inherit;
        background: var(--chat-surface);
      }

      .chat-input:focus {
        border-color: var(--chat-primary);
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        background: var(--chat-bg);
      }

      .chat-input::placeholder {
        color: var(--chat-text-light);
      }

      /* 按钮统一基础样式 */
      .chat-send,
      .chat-voice {
        width: 48px;
        height: 48px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 20px;
        flex-shrink: 0;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
      }

      .chat-send svg,
      .chat-voice svg {
        width: 22px;
        height: 22px;
      }

      .chat-send:hover,
      .chat-voice:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.35);
      }

      .chat-send:active,
      .chat-voice:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
      }

      .chat-send {
        background: var(--chat-gradient);
        color: white;
      }

      .chat-voice {
        background: var(--chat-surface);
        color: var(--chat-text);
        border: 2px solid var(--chat-border);
        box-shadow: none;
      }

      .chat-voice:hover {
        background: var(--chat-gradient);
        color: white;
        border-color: transparent;
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
      }

      .chat-voice.listening {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        border-color: transparent;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
        animation: voicePulse 1s ease-in-out infinite;
      }

      @keyframes voicePulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
      }

      /* 消息气泡 */
      .message {
        display: flex;
        flex-direction: column;
        max-width: 80%;
        animation: messageSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(15px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .message.user {
        align-self: flex-end;
        align-items: flex-end;
      }

      .message.assistant {
        align-self: flex-start;
        align-items: flex-start;
      }

      .message.error {
        align-self: center;
        align-items: center;
        max-width: 90%;
      }

      .message-bubble {
        padding: 14px 18px;
        border-radius: 20px;
        word-wrap: break-word;
        line-height: 1.6;
        position: relative;
        font-size: 14px;
      }

      .message.user .message-bubble {
        background: var(--chat-gradient);
        color: white;
        border-bottom-right-radius: 6px;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
      }

      .message.assistant .message-bubble {
        background: white;
        color: var(--chat-text);
        border: 1px solid var(--chat-border);
        border-bottom-left-radius: 6px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }

      .message.error .message-bubble {
        background: #FEF2F2;
        color: #DC2626;
        border: 1px solid #FCA5A5;
      }

      .message-time {
        font-size: 11px;
        color: var(--chat-text-light);
        margin-top: 6px;
        padding: 0 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .message.user .message-time {
        justify-content: flex-end;
      }

      /* Markdown 样式 */
      .message-bubble p {
        margin: 0;
      }

      .message-bubble p + p {
        margin-top: 10px;
      }

      .message-bubble code {
        background: rgba(0, 0, 0, 0.06);
        padding: 3px 8px;
        border-radius: 6px;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 13px;
      }

      .message-bubble pre {
        background: #1E293B;
        color: #E2E8F0;
        padding: 14px;
        border-radius: 12px;
        overflow-x: auto;
        margin: 10px 0;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
      }

      .message-bubble pre code {
        background: transparent;
        padding: 0;
        color: inherit;
      }

      .message-bubble ul,
      .message-bubble ol {
        margin: 10px 0;
        padding-left: 24px;
      }

      .message-bubble blockquote {
        border-left: 3px solid var(--chat-primary);
        padding-left: 14px;
        margin: 10px 0;
        color: var(--chat-text-light);
        background: rgba(59, 130, 246, 0.05);
        padding: 10px 14px;
        border-radius: 0 10px 10px 0;
      }

      /* 滚动条 */
      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, var(--chat-primary-light), var(--chat-primary-dark));
        border-radius: 3px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: var(--chat-primary);
      }

      /* 输入状态 */
      .chat-panel.typing .chat-input {
        border-color: var(--chat-primary);
        animation: inputPulse 1.5s ease-in-out infinite;
      }

      @keyframes inputPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.1); }
        50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
      }

      /* 响应式 */
      @media (max-width: 480px) {
        .chat-panel {
          width: 280px;
          max-height: 400px;
        }

        .chat-panel.bubble-mode {
          width: 280px;
        }
      }

      /* 拉伸手柄 - 细线边缘效果，解决角落断裂问题 */
      .resize-handle {
        position: absolute;
        z-index: 100 !important;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: auto !important;
      }

      .chat-panel:hover .resize-handle {
        opacity: 0.5;
      }

      .resize-handle:hover {
        opacity: 0.8 !important;
      }

      /* 右下角拉伸手柄 - 与边缘细线平滑连接 */
      .resize-handle-main {
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: nwse-resize;
        background: linear-gradient(135deg,
          rgba(102, 126, 234, 0.2) 0%,
          rgba(59, 130, 246, 0.3) 100%
        );
        border-radius: 0 0 24px 0;
      }

      /* 四边拉伸手柄 - 细线效果，延伸到角落确保连接 */
      .resize-handle-top {
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        cursor: ns-resize;
        background: linear-gradient(to bottom,
          rgba(102, 126, 234, 0.3) 0%,
          rgba(59, 130, 246, 0.15) 100%
        );
        border-radius: 24px 24px 0 0;
      }

      .resize-handle-bottom {
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        cursor: ns-resize;
        background: linear-gradient(to top,
          rgba(102, 126, 234, 0.3) 0%,
          rgba(59, 130, 246, 0.15) 100%
        );
        border-radius: 0 0 24px 24px;
      }

      .resize-handle-left {
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        cursor: ew-resize;
        background: linear-gradient(to right,
          rgba(102, 126, 234, 0.3) 0%,
          rgba(59, 130, 246, 0.15) 100%
        );
        border-radius: 24px 0 0 24px;
      }

      .resize-handle-right {
        right: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        cursor: ew-resize;
        background: linear-gradient(to left,
          rgba(102, 126, 234, 0.3) 0%,
          rgba(59, 130, 246, 0.15) 100%
        );
        border-radius: 0 24px 24px 0;
      }

      /* 拉伸中状态 */
      .chat-panel.resizing {
        transition: none;
      }

      .chat-panel.resizing .resize-handle {
        opacity: 1;
      }
    `;
    this.shadow.appendChild(style);
  }

  /**
   * 创建结构
   */
  private createStructure(): void {
    const panel = createElement('div', 'chat-panel');
    panel.style.width = `${this.options.initialWidth}px`;
    panel.style.height = `${this.options.initialHeight}px`;

    // 头部
    const header = createElement('div', 'chat-header');

    const title = createElement('div', 'chat-title');
    title.innerHTML = `
      <span class="chat-title-icon">🤖</span>
      <span>${this.options.title}</span>
    `;

    this.closeButton = createElement('button', 'chat-close');
    this.closeButton.textContent = '×';

    header.appendChild(title);
    header.appendChild(this.closeButton);
    panel.appendChild(header);

    // 消息区域
    this.messagesContainer = createElement('div', 'chat-messages');
    panel.appendChild(this.messagesContainer);

    // 输入区域
    const inputContainer = createElement('div', 'chat-input-container');

    this.inputElement = createElement('input', 'chat-input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = t('chat.placeholder');

    // 科技感话筒图标 SVG
    const microphoneIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;

    this.voiceButton = createElement('button', 'chat-voice');
    this.voiceButton.innerHTML = microphoneIcon;

    // 发送图标 SVG
    const sendIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;

    this.sendButton = createElement('button', 'chat-send');
    this.sendButton.innerHTML = sendIcon;

    inputContainer.appendChild(this.inputElement);
    inputContainer.appendChild(this.voiceButton);
    inputContainer.appendChild(this.sendButton);
    panel.appendChild(inputContainer);

    // 添加拉伸手柄
    this.createResizeHandles(panel);

    this.shadow.appendChild(panel);
  }

  /**
   * 创建拉伸手柄
   */
  private createResizeHandles(panel: HTMLElement): void {
    // 右下角拉伸手柄
    const resizeHandle = createElement('div', 'resize-handle resize-handle-main');
    resizeHandle.innerHTML = '↘';
    panel.appendChild(resizeHandle);

    // 四边拉伸手柄
    const edges = ['top', 'bottom', 'left', 'right'];
    edges.forEach(edge => {
      const handle = createElement('div', `resize-handle resize-handle-${edge}`);
      panel.appendChild(handle);
    });
  }

  /**
   * 初始化 marked
   */
  private initMarked(): void {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }

  /**
   * 绑定事件
   */
  private bindEvents(): void {
    const panel = this.shadow.querySelector('.chat-panel') as HTMLElement;

    // 发送按钮
    this.sendButton?.addEventListener('click', () => {
      this.sendMessage();
    });

    // 回车发送
    this.inputElement?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 语音按钮
    this.voiceButton?.addEventListener('click', () => {
      this.onVoice?.();
    });

    // 关闭按钮
    this.closeButton?.addEventListener('click', () => {
      this.onClose?.();
    });

    // 拉伸事件 - 右下角手柄
    const resizeHandle = this.shadow.querySelector('.resize-handle-main') as HTMLElement;
    if (resizeHandle) {
      resizeHandle.addEventListener('pointerdown', ((e: Event) => this.handleResizeStart(e as PointerEvent, panel, 'corner')) as EventListener);
    }

    // 四边拉伸事件
    this.shadow.querySelector('.resize-handle-top')?.addEventListener('pointerdown', ((e: Event) => this.handleResizeStart(e as PointerEvent, panel, 'top')) as EventListener);
    this.shadow.querySelector('.resize-handle-bottom')?.addEventListener('pointerdown', ((e: Event) => this.handleResizeStart(e as PointerEvent, panel, 'bottom')) as EventListener);
    this.shadow.querySelector('.resize-handle-left')?.addEventListener('pointerdown', ((e: Event) => this.handleResizeStart(e as PointerEvent, panel, 'left')) as EventListener);
    this.shadow.querySelector('.resize-handle-right')?.addEventListener('pointerdown', ((e: Event) => this.handleResizeStart(e as PointerEvent, panel, 'right')) as EventListener);
  }

  /**
   * 开始拉伸
   */
  private handleResizeStart(e: PointerEvent, panel: HTMLElement, direction: string): void {
    e.preventDefault();
    e.stopPropagation();

    this.isResizing = true;
    this.resizeDirection = direction;
    this.resizeStartPos = { x: e.clientX, y: e.clientY };

    const rect = panel.getBoundingClientRect();
    this.resizeStartSize = { width: rect.width, height: rect.height };

    panel.classList.add('resizing');
    panel.setPointerCapture(e.pointerId);

    // 添加全局事件监听
    const onPointerMove = (moveEvent: PointerEvent) => this.handleResizeMove(moveEvent, panel);
    const onPointerUp = (upEvent: PointerEvent) => {
      this.handleResizeEnd(upEvent, panel);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  /**
   * 拉伸中
   */
  private handleResizeMove(e: PointerEvent, panel: HTMLElement): void {
    if (!this.isResizing || !this.resizeDirection) return;

    const dx = e.clientX - this.resizeStartPos.x;
    const dy = e.clientY - this.resizeStartPos.y;

    let newWidth = this.resizeStartSize.width;
    let newHeight = this.resizeStartSize.height;

    switch (this.resizeDirection) {
      case 'corner':
        newWidth = Math.max(this.options.minWidth, this.resizeStartSize.width + dx);
        newHeight = Math.max(this.options.minHeight, this.resizeStartSize.height + dy);
        break;
      case 'left':
        newWidth = Math.max(this.options.minWidth, this.resizeStartSize.width - dx);
        break;
      case 'right':
        newWidth = Math.max(this.options.minWidth, this.resizeStartSize.width + dx);
        break;
      case 'top':
        newHeight = Math.max(this.options.minHeight, this.resizeStartSize.height - dy);
        break;
      case 'bottom':
        newHeight = Math.max(this.options.minHeight, this.resizeStartSize.height + dy);
        break;
    }

    panel.style.width = newWidth + 'px';
    panel.style.height = newHeight + 'px';

    // 触发重新计算以更新布局
    this.messagesContainer?.dispatchEvent(new CustomEvent('resize'));
  }

  /**
   * 结束拉伸
   */
  private handleResizeEnd(e: PointerEvent, panel: HTMLElement): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.resizeDirection = null;
    panel.classList.remove('resizing');
    panel.releasePointerCapture(e.pointerId);

    // 确保内容区域正确滚动
    this.scrollToBottom();
  }

  /**
   * 发送消息
   */
  private sendMessage(): void {
    const message = this.inputElement?.value.trim();
    if (!message) return;

    this.onSend?.(message);

    if (this.inputElement) {
      this.inputElement.value = '';
    }

    this.focusInput();
  }

  /**
   * 添加消息
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  /**
   * 渲染消息
   */
  private renderMessage(message: Message): void {
    if (!this.messagesContainer) return;

    const messageEl = createElement('div', `message ${message.type}`);

    // 气泡
    const bubble = createElement('div', 'message-bubble');

    // Markdown 渲染
    if (message.type === 'assistant' || message.type === 'system') {
      bubble.innerHTML = marked.parse(message.content) as string;
    } else {
      bubble.textContent = message.content;
    }

    messageEl.appendChild(bubble);

    // 时间
    const timeEl = createElement('div', 'message-time');
    timeEl.textContent = this.formatTime(message.timestamp);
    messageEl.appendChild(timeEl);

    this.messagesContainer.appendChild(messageEl);
  }

  /**
   * 格式化时间
   */
  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * 滚动到底部
   */
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  /**
   * 调整对话框位置（始终指向机器人）
   */
  adjustPosition(_headPos: { x: number; y: number }, robotRect: DOMRect): void {
    const panel = this.shadow.querySelector('.chat-panel') as HTMLElement;
    if (!panel) return;

    // 强制重新计算样式以获取实际尺寸
    const rect = panel.getBoundingClientRect();
    const panelWidth = rect.width || 320;
    const panelHeight = rect.height || 400;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 气泡偏移量（从机器人的距离）
    const gap = -60;

    // 机器人宽度和高度
    const robotWidth = robotRect.width;
    const robotHeight = robotRect.height;

    // 计算机器人中心
    const robotCenterX = robotRect.left + robotWidth / 2;
    const robotCenterY = robotRect.top + robotHeight / 2;

    // 移除所有箭头方向类
    panel.classList.remove('arrow-left', 'arrow-right', 'arrow-top', 'arrow-bottom');

    let targetX: number;
    let targetY: number;

    // 优先选择有足够空间的方向
    // 首先尝试水平方向（左侧或右侧）
    const spaceOnLeft = robotRect.left;
    const spaceOnRight = viewportWidth - robotRect.right;
    const spaceOnBottom = viewportHeight - robotRect.bottom;
    const spaceOnTop = robotRect.top;

    if (spaceOnRight >= panelWidth + gap) {
      // 右侧有足够空间 - 对话框在机器人右侧，箭头向左指向机器人
      targetX = robotRect.right + gap;
      targetY = robotCenterY - panelHeight / 2 + 20;
      panel.classList.add('arrow-left');
    } else if (spaceOnLeft >= panelWidth + gap) {
      // 左侧有足够空间 - 对话框在机器人左侧，箭头向右指向机器人
      targetX = robotRect.left - panelWidth - gap;
      targetY = robotCenterY - panelHeight / 2 + 20;
      panel.classList.add('arrow-right');
    } else if (spaceOnBottom >= panelHeight + gap) {
      // 下方有空间 - 对话框在机器人下方，箭头向上指向机器人
      targetX = robotCenterX - panelWidth / 2;
      targetY = robotRect.bottom + gap + 20;
      panel.classList.add('arrow-top');
    } else if (spaceOnTop >= panelHeight + gap) {
      // 上方有空间 - 对话框在机器人上方，箭头向下指向机器人
      targetX = robotCenterX - panelWidth / 2;
      targetY = robotRect.top - panelHeight - gap + 20;
      panel.classList.add('arrow-bottom');
    } else {
      // 默认：放在机器人右侧，箭头向左
      targetX = robotRect.right + gap;
      targetY = robotCenterY - panelHeight / 2 + 20;
      panel.classList.add('arrow-left');
    }

    // 边界检测和调整（确保对话框完全在屏幕内）
    // 左边界
    if (targetX < 10) {
      targetX = 10;
    }
    // 右边界
    if (targetX + panelWidth > viewportWidth - 10) {
      targetX = viewportWidth - panelWidth - 10;
    }
    // 上边界
    if (targetY < 10) {
      targetY = 10;
    }
    // 下边界
    if (targetY + panelHeight > viewportHeight - 10) {
      targetY = viewportHeight - panelHeight - 10;
    }

    panel.style.left = targetX + 'px';
    panel.style.top = targetY + 'px';
  }

  /**
   * 显示面板
   */
  show(): void {
    this.visible = true;
    const panel = this.shadow.querySelector('.chat-panel');
    panel?.classList.add('visible', 'bubble-mode');
    this.focusInput();
  }

  /**
   * 隐藏面板
   */
  hide(): void {
    this.visible = false;
    const panel = this.shadow.querySelector('.chat-panel');
    panel?.classList.remove('visible');
  }

  /**
   * 切换显示
   */
  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 是否可见
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * 聚焦输入框
   */
  focusInput(): void {
    setTimeout(() => {
      this.inputElement?.focus();
    }, 100);
  }

  /**
   * 设置语音监听状态
   */
  setListeningState(isListening: boolean): void {
    if (this.voiceButton) {
      this.voiceButton.classList.toggle('listening', isListening);
      this.voiceButton.innerHTML = isListening ? '🔴' : '🎤';
    }
  }

  /**
   * 设置输入状态
   */
  setTypingState(isTyping: boolean): void {
    const panel = this.shadow.querySelector('.chat-panel');
    panel?.classList.toggle('typing', isTyping);
  }

  /**
   * 清空消息
   */
  clearMessages(): void {
    this.messages = [];
    if (this.messagesContainer) {
      clearChildren(this.messagesContainer);
    }
  }

  /**
   * 获取消息
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * 设置回调
   */
  setCallbacks(callbacks: {
    onSend?: (message: string) => void;
    onVoice?: () => void;
    onClose?: () => void;
  }): void {
    this.onSend = callbacks.onSend;
    this.onVoice = callbacks.onVoice;
    this.onClose = callbacks.onClose;
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'blue' | 'green' | 'purple'): void {
    this.options.theme = theme;
    const oldStyle = this.shadow.querySelector('style');
    oldStyle?.remove();
    this.createStyles();
  }

  /**
   * 更新语言
   */
  updateLocale(locale: 'zh' | 'en'): void {
    // 更新标题（选择第二个 span，第一个是图标）
    const titleEl = this.shadow.querySelector('.chat-title span:last-child');
    if (titleEl) {
      titleEl.textContent = locale === 'zh' ? 'AI 助手' : 'AI Assistant';
    }

    // 更新输入框 placeholder
    if (this.inputElement) {
      this.inputElement.placeholder = locale === 'zh' ? '输入消息...' : 'Type a message...';
    }

    // 更新空状态提示（需要重新创建样式）
    const styleEl = this.shadow.querySelector('style');
    if (styleEl) {
      const emptyHint = locale === 'zh' ? '✨ 开始和 AI 助手对话吧～' : '✨ Start chatting with AI assistant~';
      // 查找并更新 CSS 中的 content
      const css = styleEl.textContent;
      if (css) {
        styleEl.textContent = css.replace(
          /content:\s*'[^']+'\s*;/g,
          `content: '${emptyHint.replace(/'/g, "\\'")}';`
        );
      }
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.messages = [];
    this.onSend = undefined;
    this.onVoice = undefined;
    this.onClose = undefined;
  }
}

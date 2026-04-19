/**
 * ChatPanel 样式定义
 * 包含对话面板的所有样式，支持响应式和主题切换
 */

export interface ChatPanelTheme {
  theme?: 'blue' | 'green' | 'purple';
}

export function getChatPanelStyles(options: ChatPanelTheme = {}): string {
  const themeColors = {
    blue: { primary: '#3B82F6', light: '#60A5FA', dark: '#2563EB', gradient: 'linear-gradient(135deg, #667eea 0%, #3B82F6 100%)' },
    green: { primary: '#10B981', light: '#34D399', dark: '#059669', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    purple: { primary: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
  };
  const colors = themeColors[options.theme || 'blue'];

  return `
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
      --robot-size: 120px;

      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      * { box-sizing: border-box; }
    }

    /* ==================== 主容器 ==================== */
    .chat-panel {
      position: absolute;
      bottom: calc(var(--robot-size) + 16px);
      right: 0;
      width: 360px;
      max-height: 900px;
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

    .chat-panel.visible {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
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

    .chat-panel.bubble-mode.visible {
      pointer-events: auto;
    }

    /* 气泡箭头 */
    .chat-panel.bubble-mode::before,
    .chat-panel.bubble-mode::after {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      display: block !important;
    }

    .chat-panel.bubble-mode::before {
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 12px solid rgba(0, 0, 0, 0.1);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .chat-panel.bubble-mode::after {
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 10px solid var(--chat-bg);
    }

    /* 默认箭头向下 */
    .chat-panel.bubble-mode::before { bottom: -12px; left: 50%; transform: translateX(-50%); }
    .chat-panel.bubble-mode::after { bottom: -10px; left: 50%; transform: translateX(-50%); }

    /* 箭头向上 */
    .chat-panel.bubble-mode.arrow-top::before {
      bottom: auto; top: -12px; border-top: none; border-bottom: 12px solid rgba(0, 0, 0, 0.1);
    }
    .chat-panel.bubble-mode.arrow-top::after {
      bottom: auto; top: -10px; border-top: none; border-bottom: 10px solid var(--chat-bg);
    }

    /* 箭头向左 */
    .chat-panel.bubble-mode.arrow-left::before {
      bottom: auto; top: 20px; left: -10px; transform: none;
      border-left: none; border-right: 10px solid rgba(0, 0, 0, 0.1);
      border-top: 10px solid transparent; border-bottom: 10px solid transparent;
    }
    .chat-panel.bubble-mode.arrow-left::after {
      bottom: auto; top: 20px; left: -8px; transform: none;
      border-left: none; border-right: 8px solid var(--chat-bg);
      border-top: 8px solid transparent; border-bottom: 8px solid transparent;
    }

    /* 箭头向右 */
    .chat-panel.bubble-mode.arrow-right::before {
      bottom: auto; top: 20px; right: -10px; left: auto; transform: none;
      border-right: none; border-left: 10px solid rgba(0, 0, 0, 0.1);
      border-top: 10px solid transparent; border-bottom: 10px solid transparent;
    }
    .chat-panel.bubble-mode.arrow-right::after {
      bottom: auto; top: 20px; right: -8px; left: auto; transform: none;
      border-right: none; border-left: 8px solid var(--chat-bg);
      border-top: 8px solid transparent; border-bottom: 8px solid transparent;
    }

    /* ==================== 头部 ==================== */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
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
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      animation: headerShine 3s ease-in-out infinite;
    }

    @keyframes headerShine {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(100%) rotate(45deg); }
    }

    .chat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 1;
    }

    .chat-close {
      width: 32px; height: 32px;
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
    }

    .chat-close:hover {
      background: rgba(255, 255, 255, 0.35);
      transform: rotate(90deg) scale(1.1);
    }

    /* ==================== 消息区域 ==================== */
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

    .message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      animation: messageSlideIn 0.3s ease-out;
    }

    @keyframes messageSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user { align-self: flex-end; align-items: flex-end; }
    .message.assistant { align-self: flex-start; align-items: flex-start; }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      line-height: 1.6;
      font-size: 14px;
    }

    .message.user .message-bubble {
      background: var(--chat-gradient);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .message-bubble {
      background: white;
      color: var(--chat-text);
      border: 1px solid var(--chat-border);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .message-time {
      font-size: 11px;
      color: var(--chat-text-light);
      margin-top: 4px;
    }

    /* ==================== 输入区域 ==================== */
    .chat-input-container {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: var(--chat-bg);
      border-top: 1px solid var(--chat-border);
    }

    .chat-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid var(--chat-border);
      border-radius: 20px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
    }

    .chat-input:focus {
      border-color: var(--chat-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .chat-send, .chat-voice {
      width: 44px; height: 44px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }

    .chat-send {
      background: var(--chat-primary);
      color: white;
    }

    .chat-send:hover {
      background: var(--chat-primary-dark);
      transform: scale(1.05);
    }

    .chat-voice {
      background: var(--chat-surface);
      color: var(--chat-text);
    }

    .chat-voice:hover {
      background: var(--chat-primary-light);
      color: white;
    }

    .chat-voice.listening {
      background: var(--chat-primary);
      color: white;
      animation: voicePulse 1s ease-in-out infinite;
    }

    @keyframes voicePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    /* ==================== 滚动条 ==================== */
    .chat-messages::-webkit-scrollbar { width: 6px; }
    .chat-messages::-webkit-scrollbar-track { background: transparent; }
    .chat-messages::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 3px; }
    .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }

    /* ==================== 响应式样式 ==================== */
    @media (max-width: 480px) {
      .chat-panel.bubble-mode {
        width: 90vw !important;
        max-width: none;
        left: 5vw !important;
        right: 5vw !important;
      }
      .message { max-width: 90%; }
      .chat-send, .chat-voice { min-width: 48px; min-height: 48px; }
    }

    @media (max-height: 500px) and (orientation: landscape) {
      .chat-panel { max-height: 80vh !important; }
      .chat-messages { max-height: 50vh !important; }
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --chat-bg: #1E293B;
        --chat-surface: #0F172A;
        --chat-text: #E2E8F0;
        --chat-text-light: #94A3B8;
        --chat-border: rgba(255, 255, 255, 0.1);
      }
      .message.assistant .message-bubble { background: #1E293B; border-color: rgba(255, 255, 255, 0.1); }
      .chat-input { background: #0F172A; color: #E2E8F0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .chat-panel, .message, .chat-close {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

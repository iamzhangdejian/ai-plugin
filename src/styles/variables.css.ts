/**
 * CSS Variables and Theme
 */

export const themes = {
  blue: {
    '--robot-primary': '#3B82F6',
    '--robot-primary-light': '#60A5FA',
    '--robot-primary-dark': '#2563EB',
    '--robot-accent': '#10B981',
    '--robot-background': '#FFFFFF',
    '--robot-surface': '#F8FAFC',
    '--robot-text': '#1E293B',
    '--robot-text-light': '#64748B',
    '--robot-shadow': 'rgba(59, 130, 246, 0.3)',
  },
  green: {
    '--robot-primary': '#10B981',
    '--robot-primary-light': '#34D399',
    '--robot-primary-dark': '#059669',
    '--robot-accent': '#3B82F6',
    '--robot-background': '#FFFFFF',
    '--robot-surface': '#F0FDF4',
    '--robot-text': '#1E293B',
    '--robot-text-light': '#64748B',
    '--robot-shadow': 'rgba(16, 185, 129, 0.3)',
  },
  purple: {
    '--robot-primary': '#8B5CF6',
    '--robot-primary-light': '#A78BFA',
    '--robot-primary-dark': '#7C3AED',
    '--robot-accent': '#F472B6',
    '--robot-background': '#FFFFFF',
    '--robot-surface': '#FAF5FF',
    '--robot-text': '#1E293B',
    '--robot-text-light': '#64748B',
    '--robot-shadow': 'rgba(139, 92, 246, 0.3)',
  },
};

export const baseStyles = `
:host {
  --robot-size: 80px;
  --robot-radius: 24px;
  --robot-border: 2px solid var(--robot-primary);
  --robot-shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.08);
  --robot-shadow-md: 0 10px 40px rgba(0, 0, 0, 0.1);
  --robot-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.15);
  --robot-glow: 0 0 20px var(--robot-shadow);
  --robot-glow-lg: 0 0 40px var(--robot-shadow);

  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--robot-text);

  * {
    box-sizing: border-box;
  }
}

.ai-robot-container {
  position: fixed;
  z-index: 999999;
  pointer-events: none;
}

.ai-robot-container * {
  pointer-events: auto;
}

.ai-robot-wrapper {
  position: relative;
  width: var(--robot-size);
  height: var(--robot-size);
  cursor: grab;
  transition: transform 0.2s ease;
}

.ai-robot-wrapper:active {
  cursor: grabbing;
}

.ai-robot-wrapper.dragging {
  transform: scale(1.1);
}

.ai-robot-body {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--robot-background);
  border: var(--robot-border);
  box-shadow: var(--robot-shadow-soft), var(--robot-glow);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-robot-wrapper:hover .ai-robot-body {
  box-shadow: var(--robot-shadow-md), var(--robot-glow-lg);
  transform: scale(1.05);
}

/* 眼睛容器 */
.ai-robot-eyes {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.ai-robot-eye {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--robot-text);
  position: relative;
  transition: all 0.3s ease;
}

.ai-robot-eye::after {
  content: '';
  position: absolute;
  top: 2px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: white;
}

/* 嘴巴 */
.ai-robot-mouth {
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 8px;
  border-radius: 0 0 20px 20px;
  background: var(--robot-text-light);
  transition: all 0.3s ease;
}

/* 腮红 */
.ai-robot-blush {
  position: absolute;
  top: 55%;
  width: 8px;
  height: 4px;
  border-radius: 50%;
  background: rgba(244, 114, 182, 0.6);
  transition: opacity 0.3s ease;
}

.ai-robot-blush.left {
  left: 22%;
}

.ai-robot-blush.right {
  right: 22%;
}

/* 状态动画 */
.ai-robot-wrapper.idle .ai-robot-body {
  animation: robotFloat 3s ease-in-out infinite;
}

@keyframes robotFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.ai-robot-wrapper.listening .ai-robot-eye {
  height: 18px;
  animation: eyePulse 1s ease-in-out infinite;
}

@keyframes eyePulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.3); }
}

.ai-robot-wrapper.listening .ai-robot-mouth {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.ai-robot-wrapper.thinking .ai-robot-eye {
  height: 4px;
  border-radius: 2px;
}

.ai-robot-wrapper.thinking .ai-robot-body {
  animation: robotGlow 1.5s ease-in-out infinite alternate;
}

@keyframes robotGlow {
  0% { box-shadow: var(--robot-shadow-soft), var(--robot-glow); }
  100% { box-shadow: var(--robot-shadow-md), var(--robot-glow-lg); }
}

.ai-robot-wrapper.speaking .ai-robot-mouth {
  height: 12px;
  animation: mouthMove 0.2s ease-in-out infinite alternate;
}

@keyframes mouthMove {
  0% { height: 8px; }
  100% { height: 14px; }
}

.ai-robot-wrapper.dragging .ai-robot-body {
  transform: scale(1.15);
  box-shadow: var(--robot-shadow-lg);
}

.ai-robot-wrapper.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

/* 3D Canvas 容器 */
.ai-robot-canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.ai-robot-canvas-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Chat Panel */
.ai-chat-panel {
  position: absolute;
  bottom: calc(var(--robot-size) + 16px);
  right: 0;
  width: 360px;
  max-height: 500px;
  background: var(--robot-background);
  border-radius: var(--robot-radius);
  box-shadow: var(--robot-shadow-lg);
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: scale(0.9) translateY(10px);
  pointer-events: none;
}

.ai-chat-panel.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--robot-primary) 0%, var(--robot-primary-dark) 100%);
  color: white;
}

.ai-chat-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-title-icon {
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-chat-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.ai-chat-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--robot-surface);
}

.ai-chat-input-container {
  display: flex;
  gap: 8px;
  padding: 16px;
  background: var(--robot-background);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.ai-chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ai-chat-input:focus {
  border-color: var(--robot-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ai-chat-send {
  width: 44px;
  height: 44px;
  border: none;
  background: var(--robot-primary);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ai-chat-send:hover {
  background: var(--robot-primary-dark);
  transform: scale(1.05);
}

.ai-chat-send:active {
  transform: scale(0.95);
}

/* 消息气泡 */
.ai-chat-message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  animation: messageSlide 0.3s ease-out;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-chat-message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.ai-chat-message.assistant {
  align-self: flex-start;
  align-items: flex-start;
}

.ai-chat-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
}

.ai-chat-message.user .ai-chat-bubble {
  background: linear-gradient(135deg, var(--robot-primary) 0%, var(--robot-primary-dark) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-chat-message.assistant .ai-chat-bubble {
  background: white;
  color: var(--robot-text);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ai-chat-time {
  font-size: 11px;
  color: var(--robot-text-light);
  margin-top: 4px;
  padding: 0 4px;
}

/* Markdown 样式 */
.ai-chat-bubble p {
  margin: 0;
  line-height: 1.6;
}

.ai-chat-bubble p + p {
  margin-top: 8px;
}

.ai-chat-bubble code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 13px;
}

.ai-chat-bubble pre {
  background: #1E293B;
  color: #E2E8F0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.ai-chat-bubble pre code {
  background: transparent;
  padding: 0;
}

.ai-chat-bubble ul, .ai-chat-bubble ol {
  margin: 8px 0;
  padding-left: 20px;
}

.ai-chat-bubble blockquote {
  border-left: 3px solid var(--robot-primary);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--robot-text-light);
}

/* 语音按钮 */
.ai-chat-voice {
  width: 44px;
  height: 44px;
  border: none;
  background: var(--robot-surface);
  color: var(--robot-text);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ai-chat-voice:hover {
  background: var(--robot-primary-light);
  color: white;
}

.ai-chat-voice.listening {
  background: var(--robot-accent);
  color: white;
  animation: voicePulse 1s ease-in-out infinite;
}

@keyframes voicePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Floating Ball */
.ai-floating-ball {
  position: absolute;
  width: 48px;
  height: 48px;
  background: var(--robot-background);
  border: 2px solid var(--robot-primary);
  border-radius: 50%;
  box-shadow: var(--robot-shadow-soft), var(--robot-glow);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
}

.ai-floating-ball:hover {
  transform: scale(1.1);
  box-shadow: var(--robot-shadow-md), var(--robot-glow-lg);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* 滚动条样式 */
.ai-chat-messages::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.ai-chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 响应式适配 */
@media (max-width: 480px) {
  :host {
    --robot-size: 64px;
  }

  .ai-chat-panel {
    width: 300px;
    max-height: 400px;
    right: -20px;
  }
}
`;

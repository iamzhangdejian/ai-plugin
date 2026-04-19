/**
 * 响应式设计和自适应布局
 * 支持桌面端和移动端自动适配
 */

// 断点定义
export const breakpoints = {
  xs: 320,    // 小型手机
  sm: 480,    // 手机
  md: 768,    // 平板
  lg: 1024,   // 小屏笔记本
  xl: 1280,   // 桌面
  xxl: 1536,  // 大屏
};

// 响应式配置
export const responsiveConfig = {
  // 机器人尺寸
  robotSize: {
    desktop: 120,
    tablet: 100,
    mobile: 80,
  },
  // ChatPanel 尺寸
  chatPanel: {
    desktop: { width: 400, height: 500 },
    tablet: { width: 340, height: 450 },
    mobile: { width: '85%', height: '60%' },
  },
  // 字体大小
  fontSizes: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '20px',
  },
  // 间距
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  // 圆角
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '50%',
  },
};

// 媒体查询辅助函数
export function createMediaQuery(minWidth?: number, maxWidth?: number): string {
  let query = '';
  if (minWidth !== undefined && maxWidth !== undefined) {
    query = `@media (min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
  } else if (minWidth !== undefined) {
    query = `@media (min-width: ${minWidth}px)`;
  } else if (maxWidth !== undefined) {
    query = `@media (max-width: ${maxWidth}px)`;
  }
  return query;
}

// 获取响应式样式
export function getResponsiveStyles(): string {
  return `
/* ==================== 响应式基础样式 ==================== */

/* 移动端优先的基础样式 */
.ai-robot-wrapper {
  --robot-size: ${responsiveConfig.robotSize.mobile}px;
  --chat-panel-width: ${responsiveConfig.chatPanel.mobile.width};
  --chat-panel-height: ${responsiveConfig.chatPanel.mobile.height};
  --chat-panel-max-width: 360px;
  --chat-panel-max-height: 500px;
  --font-size-xs: ${responsiveConfig.fontSizes.xs};
  --font-size-sm: ${responsiveConfig.fontSizes.sm};
  --font-size-base: ${responsiveConfig.fontSizes.base};
  --font-size-lg: ${responsiveConfig.fontSizes.lg};
  --spacing-xs: ${responsiveConfig.spacing.xs};
  --spacing-sm: ${responsiveConfig.spacing.sm};
  --spacing-md: ${responsiveConfig.spacing.md};
  --spacing-lg: ${responsiveConfig.spacing.lg};
  --radius-sm: ${responsiveConfig.radii.sm};
  --radius-md: ${responsiveConfig.radii.md};
  --radius-lg: ${responsiveConfig.radii.lg};
  --radius-xl: ${responsiveConfig.radii.xl};
}

/* 平板适配 (≥768px) */
${createMediaQuery(breakpoints.md)} {
  .ai-robot-wrapper {
    --robot-size: ${responsiveConfig.robotSize.tablet}px;
    --chat-panel-width: ${responsiveConfig.chatPanel.tablet.width}px;
    --chat-panel-height: ${responsiveConfig.chatPanel.tablet.height}px;
  }
}

/* 桌面适配 (≥1024px) */
${createMediaQuery(breakpoints.lg)} {
  .ai-robot-wrapper {
    --robot-size: ${responsiveConfig.robotSize.desktop}px;
    --chat-panel-width: ${responsiveConfig.chatPanel.desktop.width}px;
    --chat-panel-height: ${responsiveConfig.chatPanel.desktop.height}px;
  }
}

/* ==================== 移动端优化样式 ==================== */

/* 触摸友好的大按钮 */
@media (max-width: ${breakpoints.sm}px) {
  .ai-chat-voice,
  .ai-chat-send,
  .ai-chat-close {
    min-width: 48px;
    min-height: 48px;
  }

  .ai-chat-message {
    max-width: 90%;
  }

  .ai-chat-panel {
    border-radius: var(--radius-lg) !important;
  }
}

/* 横屏模式优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .ai-chat-panel {
    max-height: 80vh !important;
    width: 60vw !important;
  }

  .ai-chat-messages {
    max-height: 60vh !important;
  }
}

/* 安全区域适配（iPhone 刘海屏） */
@supports (padding: max(0px)) {
  .ai-robot-wrapper {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
  }

  .ai-chat-panel {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .ai-robot-wrapper {
    --robot-bg-alpha: rgba(30, 41, 59, 0.95);
    --robot-border-alpha: rgba(255, 255, 255, 0.1);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .ai-robot-wrapper,
  .ai-robot-wrapper *,
  .ai-chat-panel,
  .ai-chat-message {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 打印样式 */
@media print {
  .ai-robot-wrapper,
  .ai-chat-panel {
    display: none !important;
  }
}
`;
}

// 生成 ChatPanel 响应式样式
export function getChatPanelResponsiveStyles(): string {
  return `
/* ChatPanel 响应式样式 */

.ai-chat-panel {
  /* 默认移动样式 */
  width: var(--chat-panel-width, 85vw);
  height: var(--chat-panel-height, 60vh);
  max-width: var(--chat-panel-max-width, 360px);
  max-height: var(--chat-panel-max-height, 500px);
  min-width: 280px;
  min-height: 320px;
}

/* 平板样式 */
${createMediaQuery(breakpoints.md)} {
  .ai-chat-panel {
    width: var(--chat-panel-width, 340px);
    height: var(--chat-panel-height, 450px);
  }
}

/* 桌面样式 */
${createMediaQuery(breakpoints.lg)} {
  .ai-chat-panel {
    width: var(--chat-panel-width, 400px);
    height: var(--chat-panel-height, 500px);
  }
}

/* 移动端对话框位置优化 */
@media (max-width: ${breakpoints.sm}px) {
  .ai-chat-panel {
    right: 5vw !important;
    left: 5vw !important;
  }

  /* 当对话框打开时，机器人移动到顶部 */
  .ai-robot-wrapper.dialog-open {
    transform: translateY(-50%) scale(0.9) !important;
  }
}
`;
}

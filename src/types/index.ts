/**
 * AI Robot Assistant - Type Definitions
 */

// 机器人状态
export type RobotState =
  | 'idle'           // 待机状态
  | 'dragging'       // 拖拽中
  | 'listening'      // 语音监听中
  | 'thinking'       // 思考中
  | 'speaking'       // 说话中
  | 'hidden';        // 隐藏状态

// 主题配置
export type RobotTheme = 'blue' | 'green' | 'purple';

// 位置配置
export type RobotPosition = 'left' | 'right';

// 配置选项
export interface AIRobotConfig {
  /** API 密钥 */
  apiKey?: string;
  /** API 端点 */
  apiEndpoint?: string;
  /** 唤醒词 */
  wakeWord?: string;
  /** 主题 */
  theme?: RobotTheme;
  /** 初始位置 */
  position?: RobotPosition;
  /** 是否可见 */
  visible?: boolean;
  /** 自定义颜色 */
  customColors?: {
    primary?: string;
    accent?: string;
    background?: string;
  };
  /** 语音设置 */
  voice?: {
    enabled?: boolean;
    language?: string;
    rate?: number;
    pitch?: number;
  };
}

// 消息类型
export type MessageType = 'user' | 'assistant' | 'system' | 'error';

// 消息内容
export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: number;
  metadata?: {
    duration?: number;
    source?: string;
  };
}

// 对话历史
export interface ChatHistory {
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 事件类型
export interface RobotEvents {
  'robot-ready': CustomEvent<void>;
  'state-change': CustomEvent<{ from: RobotState; to: RobotState }>;
  'message-sent': CustomEvent<Message>;
  'message-received': CustomEvent<Message>;
  'visibility-change': CustomEvent<{ visible: boolean }>;
  'config-change': CustomEvent<Partial<AIRobotConfig>>;
}

// API 响应
export interface APIResponse {
  success: boolean;
  data?: {
    message: string;
    metadata?: Record<string, unknown>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// 语音识别结果
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// 拖拽配置
export interface DraggableConfig {
  enabled: boolean;
  boundary: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  snapToEdge: boolean;
  inertia: boolean;
}

// 3D 机器人配置
export interface Robot3DConfig {
  size: number;
  color: string;
  eyeColor: string;
  animationSpeed: number;
  quality: 'low' | 'medium' | 'high';
}

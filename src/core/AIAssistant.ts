/**
 * AIAssistant - AI 核心逻辑
 * 处理与 AI 后端的通信和对话管理
 */

import type { Message } from '../types';

export interface AIAssistantOptions {
  apiKey?: string;
  apiEndpoint?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 是否启用 mock 模式 */
  mockMode?: boolean;
}

/**
 * AI 助手类
 * 负责与 AI 后端通信、管理对话历史
 */
export class AIAssistant {
  private options: Required<AIAssistantOptions>;
  private messageHistory: Message[] = [];
  private pendingRequest: Promise<string> | null = null;

  constructor(options: AIAssistantOptions = {}) {
    const endpoint = options.apiEndpoint;
    // 只有当 endpoint 为空、包含 example.com、或者用户显式设置 mockMode 时才使用 mock 模式
    const isMockEndpoint = !endpoint || endpoint.includes('example.com');

    this.options = {
      apiKey: options.apiKey || '',
      apiEndpoint: endpoint || '',
      timeout: options.timeout || 30000,
      mockMode: options.mockMode !== undefined ? options.mockMode : isMockEndpoint,
    };

    console.log('[AIAssistant] Initialized:', {
      endpoint: this.options.apiEndpoint,
      mockMode: this.options.mockMode,
      hasApiKey: !!this.options.apiKey
    });
  }

  /**
   * 发送消息并获取回复
   * @param message - 用户消息
   */
  async send(message: string): Promise<string> {
    // 如果有 pending 请求，等待完成
    if (this.pendingRequest) {
      await this.pendingRequest;
    }

    // 添加用户消息到历史
    this.addMessage(message, 'user');

    try {
      if (this.options.mockMode) {
        console.log('[AIAssistant] Using mock mode');
        // Mock 模式 - 返回预设回复
        const mockResponse = await this.mockSend(message);
        this.addMessage(mockResponse, 'assistant');
        return mockResponse;
      }

      if (!this.options.apiEndpoint) {
        throw new Error('API endpoint not configured');
      }

      if (!this.options.apiKey) {
        throw new Error('API key not configured');
      }

      // 构建请求体 - 使用 query 参数格式
      const requestBody = {
        query: message,
      };

      console.log('[AIAssistant] Sending message to API:', this.options.apiEndpoint);
      console.log('[AIAssistant] Request body:', JSON.stringify(requestBody, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`,
          'X-API-Key': this.options.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('[AIAssistant] Raw response:', responseText);

      if (!response.ok) {
        console.error('[AIAssistant] API error:', response.status, responseText);
        throw new Error(`API 请求失败：${response.status} ${response.statusText}`);
      }

      // 尝试解析 JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[AIAssistant] Failed to parse JSON:', e);
        throw new Error('API 响应格式错误');
      }

      console.log('[AIAssistant] Parsed API response:', data);

      // 尝试多种可能的响应格式

      // OpenAI 兼容格式：{ choices: [{ message: { role, content } }], usage, id, object, created }
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        const reply = data.choices[0].message.content;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      // { output: { message: { content: ... } } }
      if (data.output && data.output.message && data.output.message.content) {
        const reply = data.output.message.content;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      // { response: "..." } 或 { data: "..." }
      if (typeof data.response === 'string') {
        const reply = data.response;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      if (typeof data.data === 'string') {
        const reply = data.data;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      // { answer: "..." } 或 { reply: "..." }
      if (typeof data.answer === 'string') {
        const reply = data.answer;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      if (typeof data.reply === 'string') {
        const reply = data.reply;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      // { result: "..." } 或 { content: "..." }
      if (typeof data.result === 'string') {
        const reply = data.result;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      if (typeof data.content === 'string') {
        const reply = data.content;
        this.addMessage(reply, 'assistant');
        return reply;
      }

      // 如果有任何错误信息，返回它
      if (data.error && data.error.message) {
        throw new Error(data.error.message);
      }

      if (data.message) {
        throw new Error(data.message);
      }

      if (data.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      console.error('[AIAssistant] Unknown response format:', data);
      throw new Error('无法解析 API 响应');
    } catch (error) {
      console.error('[AIAssistant] Send failed:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : '抱歉，发生了错误，请稍后再试';

      return errorMessage;
    }
  }

  /**
   * Mock 回复生成
   */
  private async mockSend(message: string): Promise<string> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // 简单的关键词匹配回复
    const lowerMessage = message.toLowerCase();

    const mockResponses: Record<string, string[]> = {
      greeting: [
        '你好呀！我是你的 AI 小助手，有什么可以帮你的吗？😊',
        '嗨！很高兴见到你，今天想聊什么呢？',
        '你好！我已经准备好帮助你啦～',
      ],
      who: [
        '我是一个可爱的 AI 机器人助手，可以陪你聊天、回答问题！',
        '我是你的智能小助手，住在这个网页里，随时为你服务～',
      ],
      help: [
        '我可以帮助你回答问题、提供建议，或者 just 聊聊天！你想做什么呢？',
        '有任何问题都可以问我哦，我会尽力帮助你的！',
      ],
      thanks: [
        '不客气！能帮到你我很开心～',
        '应该的！有事随时找我哦！',
        '哈哈，不用谢！我是你的专属 AI 助手嘛～',
      ],
      default: [
        '嗯...让我想想。' + this.generateMockResponse(message),
        '这个问题很有意思！我觉得...' + this.generateMockResponse(message),
        '好的，我明白了。' + this.generateMockResponse(message),
      ],
    };

    let category = 'default';
    if (/[你好，嗨，hello，hi，hey]/i.test(lowerMessage)) category = 'greeting';
    else if (/[谁，what are you]/i.test(lowerMessage)) category = 'who';
    else if (/[帮助，help，怎么，如何]/i.test(lowerMessage)) category = 'help';
    else if (/[谢谢，thanks，thank you]/i.test(lowerMessage)) category = 'thanks';

    const responses = mockResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 生成 mock 回复内容
   */
  private generateMockResponse(_message: string): string {
    const topics = [
      '今天天气不错，适合出去走走呢～',
      '保持好心情很重要哦！',
      '有什么问题都可以随时问我～',
      '我会一直在这里陪你的！',
      '生活很美好，要保持积极心态哦！',
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  /**
   * 添加消息到历史
   */
  private addMessage(content: string, type: Message['type']): void {
    const message: Message = {
      id: this.generateId(),
      type,
      content,
      timestamp: Date.now(),
    };
    this.messageHistory.push(message);
  }

  /**
   * 手动添加消息
   */
  addMessagePublic(content: string, type: 'user' | 'assistant'): void {
    this.addMessage(content, type);
  }

  /**
   * 获取对话历史
   */
  getHistory(): Message[] {
    return [...this.messageHistory];
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<AIAssistantOptions>): void {
    this.options = { ...this.options, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<AIAssistantOptions> {
    return { ...this.options };
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.messageHistory = [];
    this.pendingRequest = null;
  }
}

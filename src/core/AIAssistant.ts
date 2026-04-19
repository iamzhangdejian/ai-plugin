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
    const isMockEndpoint = !endpoint || endpoint.includes('example.com');

    this.options = {
      apiKey: options.apiKey || '',
      apiEndpoint: endpoint || '',
      timeout: options.timeout || 30000,
      mockMode: options.mockMode !== undefined ? options.mockMode : isMockEndpoint,
    };
  }

  /**
   * 发送消息并获取回复（支持流式输出）
   * @param message - 用户消息
   * @param onChunk - 接收到数据块时的回调
   * @param onResponse - 接收到完整响应时的回调（用于获取 report 等额外数据）
   */
  async send(message: string, onChunk?: (text: string) => void, onResponse?: (response: any) => void): Promise<string> {
    // 如果有 pending 请求，等待完成
    if (this.pendingRequest) {
      await this.pendingRequest;
    }

    // 添加用户消息到历史
    this.addMessage(message, 'user');

    try {
      if (this.options.mockMode) {
        const mockResponse = await this.mockSend(message);
        if (onChunk) {
          return await this.mockStreamResponse(mockResponse, onChunk);
        }
        this.addMessage(mockResponse, 'assistant');
        return mockResponse;
      }

      if (!this.options.apiEndpoint) {
        throw new Error('API endpoint not configured');
      }

      if (!this.options.apiKey) {
        throw new Error('API key not configured');
      }

      const requestBody = {
        query: message,
        stream: true,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const supportsStreaming = onChunk !== undefined;

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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败：${response.status} ${response.statusText} - ${errorText}`);
      }

      let lastResponse: any = null;
      let reportData: any = null;
      let apiData: any = null;

      if (supportsStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              let jsonStr = trimmedLine;
              if (trimmedLine.startsWith('data:')) {
                jsonStr = trimmedLine.slice(5).trim();
                if (jsonStr === '[DONE]') continue;
              }

              try {
                const data = JSON.parse(jsonStr);
                console.log('[AIAssistant] Parsed SSE data:', data);

                if (data.type === 'report' && data.data) {
                  console.log('[AIAssistant] Received report:', data);
                  // report 数据结构：data.data 包含 {type, data: {headers, rows, summary}}
                  reportData = data.data;
                } else if (data.type === 'api_data' && data.data) {
                  console.log('[AIAssistant] Received api_data:', data.data);
                  apiData = data.data;
                } else {
                  lastResponse = data;
                  const content = this.extractContentFromResponse(data);
                  if (content) {
                    if (fullContent.includes(content) && content.length < fullContent.length) {
                      continue;
                    }

                    if (content.includes(fullContent) && content.length > fullContent.length) {
                      const deltaContent = content.substring(fullContent.length);
                      fullContent = content;
                      onChunk?.(deltaContent);
                    } else if (!fullContent.includes(content)) {
                      fullContent += content;
                      onChunk?.(content);
                    }
                  }
                }
              } catch {
                fullContent += trimmedLine;
                onChunk?.(trimmedLine);
              }
            }
          }

          if (buffer.trim()) {
            let jsonStr = buffer.trim();
            if (jsonStr.startsWith('data:')) {
              jsonStr = jsonStr.slice(5).trim();
            }
            if (jsonStr !== '[DONE]') {
              try {
                const data = JSON.parse(jsonStr);
                if (data.type === 'report' && data.data) {
                  reportData = data.data;
                } else if (data.type === 'api_data' && data.data) {
                  apiData = data.data;
                } else {
                  lastResponse = data;
                  const content = this.extractContentFromResponse(data);
                  if (content && !fullContent.includes(content)) {
                    fullContent += content;
                    onChunk?.(content);
                  }
                }
              } catch {
                const trimmedBuffer = buffer.trim();
                if (!fullContent.includes(trimmedBuffer)) {
                  fullContent += trimmedBuffer;
                  onChunk?.(trimmedBuffer);
                }
              }
            }
          }

          if (onResponse) {
            const fullResponse: any = {};
            if (lastResponse) fullResponse.lastResponse = lastResponse;
            if (reportData) fullResponse.report = reportData;
            if (apiData) fullResponse.api_data = apiData;
            console.log('[AIAssistant] Calling onResponse with fullResponse:', fullResponse);
            onResponse(fullResponse);
          }

          this.addMessage(fullContent, 'assistant');
          return fullContent;
        } catch (streamError) {
          // 流式读取失败，回退到普通响应处理
        }
      }

      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        const content = this.extractContentFromResponse(data);
        if (content) {
          this.addMessage(content, 'assistant');
          return content;
        }
        throw new Error('无法解析 API 响应');
      } catch (e) {
        throw new Error('API 响应格式错误');
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : '抱歉，发生了错误，请稍后再试';

      return errorMessage;
    }
  }

  private extractContentFromResponse(data: any): string | null {
    if (data.type === 'chunk' && typeof data.content === 'string') {
      return data.content;
    }

    if (typeof data.answer === 'string') {
      return data.answer;
    }

    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    if (typeof data.response === 'string') {
      return data.response;
    }

    if (typeof data.data === 'string') {
      return data.data;
    }

    if (typeof data.reply === 'string') {
      return data.reply;
    }

    if (typeof data.result === 'string') {
      return data.result;
    }

    if (typeof data.content === 'string') {
      return data.content;
    }

    if (data.output?.message?.content) {
      return data.output.message.content;
    }

    return null;
  }

  private async mockSend(message: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const lowerMessage = message.toLowerCase();

    const mockResponses: Record<string, string[]> = {
      greeting: [
        '你好呀！我是你的 AI 小助手，有什么可以帮你的吗？',
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
        '嗯...让我想想。' + this.generateMockResponse(),
        '这个问题很有意思！我觉得...' + this.generateMockResponse(),
        '好的，我明白了。' + this.generateMockResponse(),
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

  private generateMockResponse(): string {
    const topics = [
      '今天天气不错，适合出去走走呢～',
      '保持好心情很重要哦！',
      '有什么问题都可以随时问我～',
      '我会一直在这里陪你的！',
      '生活很美好，要保持积极心态哦！',
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  private async mockStreamResponse(response: string, onChunk: (text: string) => void): Promise<string> {
    const chunks = response.split(/(?<=[。！？！？\n])/g);

    for (const chunk of chunks) {
      if (chunk.trim()) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        onChunk(chunk);
      }
    }

    return response;
  }

  private addMessage(content: string, type: Message['type']): void {
    const message: Message = {
      id: this.generateId(),
      type,
      content,
      timestamp: Date.now(),
    };
    this.messageHistory.push(message);
  }

  addMessagePublic(content: string, type: 'user' | 'assistant'): void {
    this.addMessage(content, type);
  }

  getHistory(): Message[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  setConfig(config: Partial<AIAssistantOptions>): void {
    this.options = { ...this.options, ...config };
  }

  getConfig(): Readonly<AIAssistantOptions> {
    return { ...this.options };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  destroy(): void {
    this.messageHistory = [];
    this.pendingRequest = null;
  }
}

/**
 * ChatPanel - 对话面板组件
 */

import { marked } from 'marked';
import { createElement, clearChildren } from '../../utils/dom';
import { t, loadLocaleFromStorage } from '../../i18n';
import type { Message } from '../../types';

/**
 * 流式消息类 - 用于处理流式输出的消息
 */
class StreamingMessage {
  private chatPanel: ChatPanel;
  private message: Message;
  private messageEl: HTMLElement | null = null;
  private bubbleEl: HTMLElement | null = null;
  private actionsEl: HTMLElement | null = null;
  private fullContent = '';

  constructor(chatPanel: ChatPanel) {
    this.chatPanel = chatPanel;
    this.message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    this.render();
  }

  private render(): void {
    const container = (this.chatPanel as any).messagesContainer as HTMLElement | null;
    if (!container) return;

    this.messageEl = createElement('div', 'message assistant');

    this.bubbleEl = createElement('div', 'message-bubble');
    this.bubbleEl.innerHTML = '<span class="typing-cursor">▋</span>';

    const metaEl = createElement('div', 'message-meta');
    const timeEl = createElement('div', 'message-time');
    timeEl.textContent = this.formatTime(this.message.timestamp);
    metaEl.appendChild(timeEl);

    // 预留操作按钮位置（结束时添加）
    this.actionsEl = createElement('div', 'message-actions');
    metaEl.appendChild(this.actionsEl);

    this.messageEl.appendChild(this.bubbleEl);
    this.messageEl.appendChild(metaEl);
    container.appendChild(this.messageEl);

    // 将消息添加到消息数组中，以便重试按钮可以找到
    (this.chatPanel as any).messages.push(this.message);

    this.chatPanel.scrollToBottom();
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  append(content: string): void {
    this.fullContent += content;
    this.message.content = this.fullContent;

    if (this.bubbleEl) {
      this.bubbleEl.innerHTML = marked.parse(this.fullContent) as string;
      this.bubbleEl.innerHTML += '<span class="typing-cursor">▋</span>';
    }

    this.chatPanel.scrollToBottom();
  }

  /**
   * 根据数据内容和语义自动判断图表类型
   * 基于太原市城市内涝系统 8 个业务接口场景设计
   *
   * 判断原则：根据数据的用途和关系选择图表
   *
   * 问题类型及对应图表：
   * 1. 单条记录查询（责权单位、泵管区、排水分区）→ 卡片
   * 2. 分类统计（各区域易涝点、各类型易涝点）→ 柱状图
   * 3. 占比分布（各类型占比）→ 饼图
   * 4. 趋势变化（时间序列）→ 折线图
   * 5. 能力统计（固定抽排、移动泵车）→ 卡片/表格
   * 6. 明细列表（摄像资源）→ 表格
   */
  private determineChartType(reportData: { headers?: string[]; rows?: any[][]; summary?: string }): 'table' | 'bar' | 'pie' | 'line' | 'card' {
    // 如果数据为空，直接返回表格
    if (!reportData.headers || !reportData.rows || reportData.rows.length === 0) {
      return 'table';
    }

    const rows = reportData.rows;
    const headers = reportData.headers;
    const rowCount = rows.length;
    const headerCount = headers.length;

    // 合并所有文本用于语义分析
    const allText = [...headers, ...rows.flat()].join(' ').toLowerCase();
    const headerText = headers.join(' ');

    // ==================== 卡片展示（单条记录） ====================
    // 单条记录的查询结果 → 卡片
    // 适用：责权单位、泵管区、排水分区、单个积水点信息等
    if (rowCount === 1) {
      return 'card';
    }

    // ==================== 分析数据列特征 ====================
    const numericColumns: number[] = [];
    const labelColumns: number[] = [];

    for (let col = 0; col < headerCount; col++) {
      const colValues = rows.map(row => row[col]);
      const isNumeric = colValues.every(cell => {
        if (cell === null || cell === undefined) return false;
        const cellStr = String(cell).replace(/[^0-9.-]/g, '');
        return !isNaN(Number(cellStr)) && cellStr.trim() !== '';
      });

      if (isNumeric) {
        numericColumns.push(col);
      } else {
        labelColumns.push(col);
      }
    }

    const hasLabel = labelColumns.length >= 1;
    const hasNumeric = numericColumns.length >= 1;

    // ==================== 表格：明细数据（多列） ====================
    // 列数超过 4 列 → 明细数据，用表格（如摄像资源 4 列以上）
    if (headerCount > 4) {
      return 'table';
    }

    // 表头包含明细类关键词 → 表格
    // 资源、单位、摄像、姓名、电话、职务、状态、地址等 → 明细列表
    const hasDetailKeyword = /资源 | 单位 | 摄像 | 姓名 | 电话 | 职务 | 状态 | 地址 | 型号 | 负责人 | 联系方式/.test(headerText);
    if (hasDetailKeyword && headerCount >= 3) {
      return 'table';
    }

    // ==================== 能力统计 → 卡片或表格（不是柱状图） ====================
    // 能力类统计（固定抽排能力、移动泵车数量）是指标值，不是分类对比
    // 特征：表头包含"能力"、"抽排"、"泵车"、"装机"、"m3"、"立方米"等
    // 或者第一列是"类型"，第二列是数值（能力统计的典型格式）
    const hasCapacityKeyword = /能力 | 抽排 | 泵车 | 装机 | 功率 | 台数 |m3| 立方米 | 公顷 | 亩/.test(headerText);
    const isCapacityFormat = headerCount === 2 && headers[0] === '类型'; // 能力统计典型格式：类型 + 数值
    console.log('[StreamingMessage] Capacity keyword check:', {
      headerText,
      hasCapacityKeyword,
      isCapacityFormat,
      rowCount
    });
    if (hasCapacityKeyword || isCapacityFormat) {
      // 能力统计直接用卡片或表格，不进入后续图表判断
      return rowCount <= 2 ? 'card' : 'table';
    }

    // ==================== 图表：需要有标签列和数值列 ====================
    if (!hasLabel || !hasNumeric) {
      return 'table';
    }

    // ==================== 饼图：占比类数据 ====================
    // 包含"占比"、"比例"、"百分比"、"份额"、"构成"等词
    const hasPercentKeyword = /占比 | 比例 | 百分比 | 份额 | 构成/.test(allText);
    if (hasPercentKeyword && headerCount === 2) {
      return 'pie';
    }

    // ==================== 折线图：时间趋势类数据 ====================
    // 包含"时间"、"日期"、"年份"、"月份"、"季度"、"趋势"等词
    const hasTimeKeyword = /时间 | 日期 | 年份 | 月份 | 季度 | 趋势 | 变化/.test(allText);
    if (hasTimeKeyword && headerCount === 2) {
      return 'line';
    }

    // ==================== 柱状图：分类统计数据 ====================
    // 2 列（类别 + 数量），且表头包含"数量"、"统计"、"合计"等词
    // 适用场景：各区域易涝点数量、各类型易涝点数量
    // 注意："能力"已经被前面排除，这里不会再误判
    if (headerCount === 2) {
      const hasStatKeyword = /数量 | 统计 | 合计/.test(headerText);
      if (hasStatKeyword) {
        return 'bar';
      }
      // 第二列是数值，第一列是分类标签（且不是能力统计），也适合柱状图
      if (numericColumns.length === 1 && labelColumns.length === 1) {
        return 'bar';
      }
    }

    // 默认表格
    return 'table';
  }

  /**
   * 提取图表数据
   */
  private extractChartData(reportData: { headers?: string[]; rows?: any[][] }): { labels: string[]; datasets: { label: string; data: number[]; backgroundColor: string[]; borderColor: string[] }[] } {
    const labels: string[] = [];
    const dataValues: number[] = [];
    const headers = reportData.headers || [];
    const rows = reportData.rows || [];

    rows.forEach(row => {
      // 第一列作为标签
      if (row.length > 0) {
        labels.push(String(row[0]));
      }
      // 第二列作为数值
      if (row.length > 1) {
        const cellStr = String(row[1]).replace(/[^0-9.-]/g, '');
        dataValues.push(parseFloat(cellStr) || 0);
      }
    });

    // 生成颜色
    const colors = this.generateChartColors(dataValues.length);

    return {
      labels,
      datasets: [{
        label: headers[1] || '数值',
        data: dataValues,
        backgroundColor: colors.background,
        borderColor: colors.border
      }]
    };
  }

  /**
   * 生成图表颜色
   */
  private generateChartColors(count: number): { background: string[]; border: string[] } {
    // 科技蓝渐变色系
    const baseColors = [
      { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
      { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgba(139, 92, 246, 1)' },
      { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgba(16, 185, 129, 1)' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)' },
      { bg: 'rgba(20, 184, 166, 0.8)', border: 'rgba(20, 184, 166, 1)' },
      { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgba(99, 102, 241, 1)' },
      { bg: 'rgba(248, 113, 113, 0.8)', border: 'rgba(248, 113, 113, 1)' },
      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
      { bg: 'rgba(234, 179, 8, 0.8)', border: 'rgba(234, 179, 8, 1)' },
    ];

    const background: string[] = [];
    const border: string[] = [];

    for (let i = 0; i < count; i++) {
      const color = baseColors[i % baseColors.length];
      background.push(color.bg);
      border.push(color.border);
    }

    return { background, border };
  }

  /**
   * 在气泡内渲染报表
   */
  renderReportInBubble(report: { type: string; data: { type?: string; headers?: string[]; rows?: any[][]; summary?: string; data?: { headers?: string[]; rows?: any[][]; summary?: string } } }): void {
    if (!this.bubbleEl) return;

    console.log('[StreamingMessage] renderReportInBubble called with:', JSON.stringify(report, null, 2));

    // 处理嵌套的 data 结构
    let reportData = report.data;
    if (report.data && report.data.data) {
      reportData = report.data.data;
    }

    if (!reportData || !reportData.headers || !reportData.rows) {
      console.log('[StreamingMessage] No valid report data to render');
      return;
    }

    const apiReportType = report.data?.type || 'table';

    // 自动判断图表类型（根据数据内容和语义分析）
    const chartType = this.determineChartType(reportData);

    // 详细日志，便于调试
    console.log('[StreamingMessage] Chart Type Determination:', {
      apiSuggestType: apiReportType,
      determinedType: chartType,
      dataInfo: {
        rowCount: reportData.rows.length,
        headerCount: reportData.headers.length,
        headers: reportData.headers,
        firstRow: reportData.rows[0]
      },
      ruleMatch: {
        isSingleRecord: reportData.rows.length === 1,
        isMultiColumn: reportData.headers.length > 4,
        hasDetailKeyword: /资源 | 单位 | 摄像 | 姓名 | 电话 | 职务 | 状态 | 地址 | 型号 | 负责人 | 联系方式/.test(
          reportData.headers.join(' ')
        ),
        hasCapacityKeyword: /能力 | 抽排 | 泵车 | 装机 | 功率 | 台数 |m3| 立方米 | 公顷 | 亩/.test(
          reportData.headers.join(' ')
        ),
        isCapacityFormat: reportData.headers.length === 2 && reportData.headers[0] === '类型',
        hasStatKeyword: /数量 | 统计 | 合计/.test(
          reportData.headers.join(' ')
        ),
        hasPercentKeyword: /占比 | 比例 | 百分比 | 份额 | 构成/.test(
          [...reportData.headers, ...reportData.rows.flat()].join(' ').toLowerCase()
        ),
        hasTimeKeyword: /时间 | 日期 | 年份 | 月份 | 季度 | 趋势 | 变化/.test(
          [...reportData.headers, ...reportData.rows.flat()].join(' ').toLowerCase()
        )
      }
    });

    // 创建报表容器
    const reportEl = document.createElement('div');
    reportEl.className = 'chat-report-container';
    reportEl.style.marginTop = '12px';

    if (chartType === 'bar' || chartType === 'pie' || chartType === 'line') {
      // 渲染图表
      const chartWrapper = document.createElement('div');
      chartWrapper.className = 'chat-chart-wrapper';
      chartWrapper.style.cssText = 'position: relative; height: 300px; width: 100%; margin-bottom: 12px;';

      const canvas = document.createElement('canvas');
      canvas.id = `chart-${this.message.id}`;
      chartWrapper.appendChild(canvas);
      reportEl.appendChild(chartWrapper);

      // 获取图表数据
      const chartData = this.extractChartData(reportData);

      // 延迟渲染图表，确保 DOM 已插入
      setTimeout(() => {
        const ctx = canvas.getContext('2d');
        if (ctx && (window as any).Chart) {
          const chartConfig = {
            type: chartType,
            data: chartData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: chartType === 'pie' ? 'bottom' : 'top',
                  labels: {
                    color: '#64748B',
                    font: { size: 12 }
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  titleColor: '#F8FAFC',
                  bodyColor: '#F8FAFC',
                  padding: 12,
                  cornerRadius: 8,
                  displayColors: true
                }
              },
              scales: chartType !== 'pie' ? {
                x: {
                  ticks: { color: '#64748B', font: { size: 11 } },
                  grid: { color: 'rgba(148, 163, 184, 0.2)' }
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: '#64748B', font: { size: 11 } },
                  grid: { color: 'rgba(148, 163, 184, 0.2)' }
                }
              } : {}
            }
          };

          try {
            new (window as any).Chart(ctx, chartConfig);
            console.log('[StreamingMessage] Chart created successfully');
          } catch (e) {
            console.error('[StreamingMessage] Failed to create chart:', e);
          }
        } else {
          console.warn('[StreamingMessage] Chart.js not available, falling back to table');
          // 如果 Chart.js 不可用，回退到表格
          this.renderTable(reportData, reportEl);
        }
      }, 100);

      // 汇总信息
      if (reportData.summary) {
        const summaryEl = document.createElement('div');
        summaryEl.className = 'chat-report-summary';
        summaryEl.innerHTML = reportData.summary;
        reportEl.appendChild(summaryEl);
      }
    } else if (chartType === 'card') {
      // 卡片式展示
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'chat-report-cards';
      reportData.rows.forEach((row: any[]) => {
        const card = document.createElement('div');
        card.className = 'chat-report-card';
        row.forEach((cell: any, index: number) => {
          const label = reportData.headers?.[index] || '';
          const cellDiv = document.createElement('div');
          cellDiv.className = 'chat-report-card-item';
          if (label) {
            const labelEl = document.createElement('span');
            labelEl.className = 'chat-report-card-label';
            labelEl.textContent = label;
            cellDiv.appendChild(labelEl);
          }
          const valueEl = document.createElement('span');
          valueEl.className = 'chat-report-card-value';
          valueEl.textContent = cell !== null && cell !== undefined ? String(cell) : '-';
          cellDiv.appendChild(valueEl);
          card.appendChild(cellDiv);
        });
        cardsContainer.appendChild(card);
      });
      reportEl.appendChild(cardsContainer);

      // 汇总信息
      if (reportData.summary) {
        const summaryEl = document.createElement('div');
        summaryEl.className = 'chat-report-summary';
        summaryEl.innerHTML = reportData.summary;
        reportEl.appendChild(summaryEl);
      }
    } else {
      // 默认表格展示
      this.renderTable(reportData, reportEl);
    }

    // 将报表插入到气泡内容后面
    this.bubbleEl.appendChild(reportEl);
    this.chatPanel.scrollToBottom();
  }

  /**
   * 渲染表格
   */
  private renderTable(reportData: { headers?: string[]; rows?: any[][]; summary?: string }, reportEl: HTMLElement): void {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'chat-report-table-wrapper';

    const table = document.createElement('table');
    table.className = 'chat-report-table';

    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    if (reportData.headers) {
      reportData.headers.forEach(header => {
        const th = document.createElement('th');
        th.innerHTML = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
    }

    // 表体
    const tbody = document.createElement('tbody');
    if (reportData.rows) {
      reportData.rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
          const td = document.createElement('td');
          if (cell !== null && cell !== undefined) {
            const cellStr = String(cell);
            if (!isNaN(Number(cellStr)) && cellStr.trim() !== '') {
              const numVal = Number(cellStr);
              if (Number.isInteger(numVal)) {
                td.textContent = numVal.toLocaleString('zh-CN');
              } else {
                td.textContent = numVal.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
              }
              td.className = 'chat-report-table-cell-number';
            } else {
              td.innerHTML = cellStr;
            }
          } else {
            td.textContent = '-';
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    reportEl.appendChild(tableWrapper);

    // 汇总信息
    if (reportData.summary) {
      const summaryEl = document.createElement('div');
      summaryEl.className = 'chat-report-summary';
      summaryEl.innerHTML = reportData.summary;
      reportEl.appendChild(summaryEl);
    }
  }

  end(): void {
    if (this.bubbleEl) {
      // 移除光标
      const cursor = this.bubbleEl.querySelector('.typing-cursor');
      cursor?.remove();
    }

    // 添加操作按钮
    if (this.actionsEl && this.messageEl) {
      console.log('[StreamingMessage] end() called, adding action buttons');
      const actionsContainer = (this.chatPanel as any).createMessageActions(this.message) as HTMLElement;
      console.log('[StreamingMessage] actionsContainer created:', actionsContainer);
      this.actionsEl.parentNode?.replaceChild(actionsContainer, this.actionsEl);
      console.log('[StreamingMessage] actionsEl replaced');
    }
  }
}

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
      initialWidth: 400,
      initialHeight: 480,
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
        padding: 0 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .message.user .message-time {
        justify-content: flex-end;
      }

      .message-meta {
        display: flex;
        align-items: center;
        margin-top: 6px;
        gap: 4px;
      }

      /* 消息操作按钮 */
      .message-actions {
        display: flex;
        gap: 4px;
        margin-left: 8px;
      }

      .message-action-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s ease;
        padding: 0;
        color: var(--chat-text-light);
      }

      .message-action-btn:hover {
        background: rgba(59, 130, 246, 0.1);
        color: var(--chat-primary);
      }

      .message-action-btn:active {
        transform: scale(0.9);
      }

      .message-action-btn svg {
        width: 16px;
        height: 16px;
      }

      .message-action-btn.playing {
        color: var(--chat-primary);
        animation: playingPulse 0.6s ease-in-out infinite;
      }

      @keyframes playingPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
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
          max-height: 600px;
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

      /* 流式输出光标 */
      .typing-cursor {
        display: inline-block;
        color: var(--chat-primary);
        animation: cursorBlink 1s step-start infinite;
        font-weight: bold;
        margin-left: 2px;
      }

      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      /* 报表容器样式 */
      .chat-report-container {
        margin: 16px 0;
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
        border: 1px solid var(--chat-border);
        animation: fadeIn 0.4s ease;
      }

      .chat-report-container + .chat-report-container {
        margin-top: 12px;
      }

      .chat-report-table-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        border-radius: 8px;
      }

      .chat-chart-wrapper {
        position: relative;
        height: 300px;
        width: 100%;
      }

      .chat-report-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        min-width: 400px;
      }

      .chat-report-table thead {
        background: linear-gradient(135deg, var(--chat-primary), var(--chat-primary-dark));
        color: white;
      }

      .chat-report-table th {
        padding: 14px 16px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        white-space: nowrap;
      }

      .chat-report-table tbody tr {
        transition: all 0.2s ease;
      }

      .chat-report-table tbody tr:nth-child(even) {
        background-color: rgba(248, 250, 252, 0.6);
      }

      .chat-report-table tbody tr:nth-child(odd) {
        background-color: rgba(255, 255, 255, 0.9);
      }

      .chat-report-table tbody tr:hover {
        background-color: rgba(59, 130, 246, 0.08);
        transform: scale(1.001);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .chat-report-table td {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(30, 41, 59, 0.08);
        color: var(--chat-text);
      }

      .chat-report-table-cell-number {
        text-align: right;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 13px;
        color: var(--chat-primary-dark);
        font-weight: 500;
      }

      .chat-report-table tbody tr:last-child td {
        border-bottom: 2px solid var(--chat-primary);
      }

      .chat-report-summary {
        margin-top: 16px;
        padding: 14px 16px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.12));
        border-radius: 10px;
        font-size: 14px;
        color: var(--chat-text);
        border-left: 4px solid var(--chat-primary);
        line-height: 1.6;
      }

      /* 卡片式报表 */
      .chat-report-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-top: 8px;
      }

      .chat-report-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
        border: 1px solid var(--chat-border);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
      }

      .chat-report-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
        border-color: var(--chat-primary-light);
      }

      .chat-report-card-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .chat-report-card-label {
        font-size: 12px;
        color: var(--chat-text-light);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .chat-report-card-value {
        font-size: 18px;
        color: var(--chat-text);
        font-weight: 600;
        font-family: 'SF Mono', Monaco, Consolas, monospace;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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
   * 从指定索引开始移除消息（用于重试功能）
   */
  removeMessagesFromIndex(index: number): void {
    // 从数据数组中移除
    const removedMessages = this.messages.splice(index);

    // 从 DOM 中移除对应的消息元素
    if (this.messagesContainer) {
      const messageElements = this.messagesContainer.querySelectorAll('.message');
      for (let i = index; i < messageElements.length; i++) {
        messageElements[i].remove();
      }
    }

    console.log('[ChatPanel] Removed messages from index:', index, removedMessages);
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

    // 元信息容器（时间和操作按钮）
    const metaEl = createElement('div', 'message-meta');

    // 时间
    const timeEl = createElement('div', 'message-time');
    timeEl.textContent = this.formatTime(message.timestamp);
    metaEl.appendChild(timeEl);

    // 为 assistant 消息添加操作按钮
    if (message.type === 'assistant' || message.type === 'system') {
      console.log('[ChatPanel] Adding action buttons for assistant message');
      const actionsEl = this.createMessageActions(message);
      metaEl.appendChild(actionsEl);
    } else {
      console.log('[ChatPanel] Skipping action buttons for message type:', message.type);
    }

    messageEl.appendChild(metaEl);
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
  scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  /**
   * 创建流式消息（用于流式输出）
   */
  createStreamingMessage(): StreamingMessage {
    return new StreamingMessage(this);
  }

  /**
   * 创建消息操作按钮（语音播放、复制、重试）
   */
  private createMessageActions(message: Message): HTMLElement {
    console.log('[ChatPanel] createMessageActions called for message:', message.type, message.id);
    const actionsEl = createElement('div', 'message-actions');
    const robot = document.getElementById('robot') as any;

    // 语音播放按钮
    const playBtn = createElement('button', 'message-action-btn') as HTMLButtonElement;
    const playIcon = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    const stopIcon = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
    `;
    playBtn.innerHTML = playIcon;
    playBtn.title = '语音播放';

    // 检查是否正在播放的定时器
    let playCheckTimer: ReturnType<typeof setInterval> | null = null;

    // 更新播放按钮状态
    const updatePlayButton = () => {
      const isSpeaking = robot?.speechManager?.getIsSpeaking?.();
      if (isSpeaking) {
        playBtn.innerHTML = stopIcon;
        playBtn.classList.add('playing');
        playBtn.title = '停止播放';
      } else {
        playBtn.innerHTML = playIcon;
        playBtn.classList.remove('playing');
        playBtn.title = '语音播放';
      }
    };

    // 启动状态检查定时器
    const startPlayCheck = () => {
      if (playCheckTimer) clearInterval(playCheckTimer);
      playCheckTimer = setInterval(() => {
        updatePlayButton();
        // 如果已经停止播放，清除定时器
        const isSpeaking = robot?.speechManager?.getIsSpeaking?.();
        if (!isSpeaking && playCheckTimer) {
          clearInterval(playCheckTimer);
          playCheckTimer = null;
        }
      }, 200);
    };

    playBtn.addEventListener('click', () => {
      const isSpeaking = robot?.speechManager?.getIsSpeaking?.();

      if (isSpeaking) {
        // 停止播放
        if (robot && typeof robot.stopSpeaking === 'function') {
          robot.stopSpeaking();
        }
        // 立即更新按钮
        playBtn.innerHTML = playIcon;
        playBtn.classList.remove('playing');
        playBtn.title = '语音播放';
        if (playCheckTimer) {
          clearInterval(playCheckTimer);
          playCheckTimer = null;
        }
      } else {
        // 开始播放
        if (robot && typeof robot.speak === 'function') {
          robot.speak(message.content);
        }
        // 启动状态检查
        startPlayCheck();
      }
    });
    actionsEl.appendChild(playBtn);

    // 复制按钮
    const copyBtn = createElement('button', 'message-action-btn') as HTMLButtonElement;
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.title = '复制内容';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message.content);
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    });
    actionsEl.appendChild(copyBtn);

    // 重试按钮
    const retryBtn = createElement('button', 'message-action-btn') as HTMLButtonElement;
    retryBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    `;
    retryBtn.title = '重新提交';
    retryBtn.addEventListener('click', () => {
      console.log('[ChatPanel] Retry button clicked, message id:', message.id);
      console.log('[ChatPanel] All messages:', this.messages);

      // 找到对应的助手消息索引
      const messageIndex = this.messages.findIndex(m => m.id === message.id);
      console.log('[ChatPanel] Assistant message index:', messageIndex);

      // 向前查找最近的用户消息
      let userMessageIndex = -1;
      let userMessage: Message | null = null;

      for (let i = messageIndex - 1; i >= 0; i--) {
        if (this.messages[i].type === 'user') {
          userMessageIndex = i;
          userMessage = this.messages[i];
          break;
        }
      }

      console.log('[ChatPanel] Found user message at index:', userMessageIndex, userMessage);

      if (userMessage && userMessageIndex >= 0) {
        // 清除从用户消息之后的所有消息（保留用户消息）
        this.removeMessagesFromIndex(userMessageIndex + 1);

        // 将用户消息重新填入输入框并发送
        const robot = document.getElementById('robot') as any;
        console.log('[ChatPanel] Robot element:', robot, 'sendMessage exists:', typeof robot?.sendMessage === 'function');

        if (robot && typeof robot.sendMessage === 'function') {
          robot.sendMessage(userMessage.content);
        } else {
          // 备用方案：通过输入框重新发送
          console.log('[ChatPanel] Robot sendMessage not available, using fallback');
          if (this.inputElement) {
            this.inputElement.value = userMessage.content;
            if (this.sendButton) {
              this.sendButton.click();
            }
          }
        }
      } else {
        console.warn('[ChatPanel] Could not find previous user message for retry');
      }
    });
    actionsEl.appendChild(retryBtn);

    return actionsEl;
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
    const gap = -40;

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
      targetY = robotCenterY - panelHeight / 2 + 150;
      panel.classList.add('arrow-left');
    } else if (spaceOnLeft >= panelWidth + gap) {
      // 左侧有足够空间 - 对话框在机器人左侧，箭头向右指向机器人
      targetX = robotRect.left - panelWidth - gap;
      targetY = robotCenterY - panelHeight / 2 + 150;
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
      targetY = robotCenterY - panelHeight / 2 + 150;
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
   * 渲染报表数据
   */
  renderReport(report: { type: string; data: { type?: string; headers?: string[]; rows?: any[][]; summary?: string; data?: { headers?: string[]; rows?: any[][]; summary?: string } } }): void {
    console.log('[ChatPanel] renderReport called with:', JSON.stringify(report, null, 2));

    // 处理嵌套的 data 结构：report.data.data
    let reportData = report.data;
    if (report.data && report.data.data) {
      reportData = report.data.data;
    }

    if (!reportData) {
      console.log('[ChatPanel] No report data to render');
      return;
    }

    console.log('[ChatPanel] Using reportData:', reportData);

    // 移除已存在的报表容器
    const existingReport = this.shadow.querySelector('.chat-report-container');
    if (existingReport) {
      existingReport.remove();
    }

    // 使用 this.messagesContainer 而不是 querySelector
    if (!this.messagesContainer) {
      console.log('[ChatPanel] messagesContainer is null');
      return;
    }

    // 创建报表容器
    const reportEl = createElement('div', 'chat-report-container');

    // 根据类型渲染不同的图表
    const reportType = report.data?.type || 'table';
    console.log('[ChatPanel] Report type:', reportType);

    if (reportType === 'table' || reportType === 'stat' || reportType === 'info') {
      if (reportData.headers && reportData.rows) {
        // 渲染表格
        const tableWrapper = createElement('div', 'chat-report-table-wrapper');

        const table = document.createElement('table');
        table.className = 'chat-report-table';

        // 表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        reportData.headers.forEach(header => {
          const th = document.createElement('th');
          th.innerHTML = header; // 支持 HTML
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 表体
        const tbody = document.createElement('tbody');
        reportData.rows.forEach(row => {
          const tr = document.createElement('tr');
          row.forEach(cell => {
            const td = document.createElement('td');
            if (cell !== null && cell !== undefined) {
              // 如果是数字且是数值列，添加格式化
              const cellStr = String(cell);
              if (!isNaN(Number(cellStr)) && cellStr.trim() !== '') {
                // 数字格式化
                const numVal = Number(cellStr);
                if (Number.isInteger(numVal)) {
                  td.textContent = numVal.toLocaleString('zh-CN');
                } else {
                  td.textContent = numVal.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
                }
                td.className = 'chat-report-table-cell-number';
              } else {
                td.innerHTML = cellStr; // 支持 HTML
              }
            } else {
              td.textContent = '-';
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        reportEl.appendChild(tableWrapper);
      }

      // 渲染汇总信息
      if (reportData.summary) {
        const summaryEl = createElement('div', 'chat-report-summary');
        summaryEl.innerHTML = reportData.summary; // 支持 HTML
        reportEl.appendChild(summaryEl);
      }
    } else if (reportType === 'card') {
      // 卡片式展示
      if (reportData.rows) {
        const cardsContainer = createElement('div', 'chat-report-cards');
        reportData.rows.forEach((row: any[]) => {
          const card = createElement('div', 'chat-report-card');
          row.forEach((cell: any, index: number) => {
            const label = reportData.headers?.[index] || '';
            const cellDiv = createElement('div', 'chat-report-card-item');
            if (label) {
              const labelEl = createElement('span', 'chat-report-card-label');
              labelEl.textContent = label;
              cellDiv.appendChild(labelEl);
            }
            const valueEl = createElement('span', 'chat-report-card-value');
            valueEl.textContent = cell !== null && cell !== undefined ? String(cell) : '-';
            cellDiv.appendChild(valueEl);
            card.appendChild(cellDiv);
          });
          cardsContainer.appendChild(card);
        });
        reportEl.appendChild(cardsContainer);
      }
    }

    // 插入到消息列表下方
    console.log('[ChatPanel] Appending report to messagesContainer');
    this.messagesContainer.appendChild(reportEl);
    this.scrollToBottom();
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

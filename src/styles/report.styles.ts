/**
 * 报表和图表样式
 * 包含表格、柱状图、饼图、折线图、卡片的样式定义
 */

export const reportStyles = `
/* ==================== 报表容器 ==================== */
.chat-report-container {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
}

/* ==================== 图表容器 ==================== */
.chat-chart-wrapper {
  position: relative;
  width: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
}

/* ==================== 卡片式展示 ==================== */
.chat-report-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.chat-report-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chat-report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.chat-report-card-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-report-card-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chat-report-card-value {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ==================== 汇总信息 ==================== */
.chat-report-summary {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  border-left: 3px solid #3B82F6;
  line-height: 1.6;
}

/* ==================== 表格样式 ==================== */
.chat-report-table-wrapper {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.chat-report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.chat-report-table thead {
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  color: white;
}

.chat-report-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chat-report-table tbody tr {
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  transition: background-color 0.2s ease;
}

.chat-report-table tbody tr:nth-child(even) {
  background-color: rgba(59, 130, 246, 0.03);
}

.chat-report-table tbody tr:hover {
  background-color: rgba(59, 130, 246, 0.08);
}

.chat-report-table td {
  padding: 12px 16px;
  color: #1E293B;
}

.chat-report-table-cell-number {
  font-weight: 600;
  color: #3B82F6;
  text-align: right;
}

/* 响应式表格 */
@media (max-width: 480px) {
  .chat-report-table {
    font-size: 12px;
  }

  .chat-report-table th,
  .chat-report-table td {
    padding: 8px 12px;
  }

  .chat-report-cards {
    grid-template-columns: 1fr;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .chat-report-card {
    background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .chat-report-card-value {
    background: linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .chat-report-table tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.03);
  }

  .chat-report-table tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .chat-report-table td {
    color: #E2E8F0;
  }

  .chat-report-table-cell-number {
    color: #60A5FA;
  }
}
`;

// 导出独立的样式模块供 ChatPanel 使用
export function getReportStyles(): string {
  return reportStyles;
}

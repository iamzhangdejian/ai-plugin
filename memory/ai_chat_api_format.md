---
name: AI Chat API Response Format
description: AI 对话接口标准化返回数据格式（包含 answer 文本、report 报表、api_data 原始数据）
type: reference
---

## AI 对话接口统一响应结构

```json
{
  "success": true,
  "answer": "完整文本文案（便于流式输出）",
  "api_id": "接口 ID",
  "report": {
    "type": "table|stat|info",
    "data": {
      "headers": ["列 1", "列 2"],
      "rows": [["值 1", "值 2"]],
      "summary": "汇总信息"
    }
  },
  "api_data": {
    "code": 0,
    "msg": "success",
    "data": {...}
  }
}
```

## 8 个接口的报表类型

| 接口名称 | api_id | report.type | 表头 |
|----------|--------|-------------|------|
| 易涝点分布 | `tyyl dfbqk` | table | 区域名称，易涝点数量 |
| 各类型易涝点 | `tyglx yldqk` | table | 类型名称，数量 |
| 责权单位 | `jsdqzdw` | table | 类型，单位/区域，职务，姓名，电话 |
| 摄像资源 | `jsdfjsxzy` | table | 摄像头名称，状态，距离 (米),类型 |
| 泵管区 | `jsdbq` | info | 积水点，所属泵管区，最近泵站，距离 (米) |
| 排水分区 | `jsdsspsfq` | table | 泵站名称，负责人，联系方式，抽排能力 |
| 固定抽排能力 | `cpnl` | stat | 类型，数量/能力 |
| 移动泵车 | `ydcpnl` | stat | 类型，数量/能力 |

## 前端使用方式

```javascript
// table/stat 类型直接渲染报表
renderTable(response.report.data.headers, response.report.data.rows);
showSummary(response.report.data.summary);

// 流式输出使用 answer
typeWriter(response.answer);
```

## 业务接口原始数据 (api_data)

业务接口返回标准格式：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "rowsData": [...],
    "columns": [...]
  }
}
```

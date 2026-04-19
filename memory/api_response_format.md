---
name: API Response Format Standard
description: 太原市城市内涝系统所有业务接口的统一返回格式标准
type: reference
---

## 接口统一返回结构

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "query": true,
    "time": 43,
    "totals": null,
    "success": true,
    "errMsg": null,
    "effectRows": null,
    "columns": ["字段 1", "字段 2", "字段 3"],
    "rowsData": [
      {"字段 1": "值 1", "字段 2": "值 2", "字段 3": "值 3"},
      {"字段 1": "值 1", "字段 2": "值 2", "字段 3": "值 3"}
    ]
  }
}
```

## 字段说明

| 层级 | 字段 | 类型 | 说明 |
|------|------|------|------|
| 顶级 | code | int | 状态码 (0=成功) |
| 顶级 | msg | string | 状态描述 (success=成功) |
| 顶层 | data | object | 业务数据主体 |
| data | query | boolean | 是否查询成功 |
| data | time | int | 查询耗时 (毫秒) |
| data | totals | number | 总记录条数 |
| data | success | boolean | 查询是否成功 |
| data | errMsg | nullable | 错误信息 (查询失败时为 null) |
| data | effectRows | number | 影响行数 |
| data | columns | array | 列名数组 |
| data | rowsData | array | 行数据数组 (**核心数据**) |

## 各业务接口 ID 及 rowData 字段

| 接口 ID | 接口名称 | rowData 字段 |
|---------|----------|-------------|
| `tyyjldyqjk` | 易涝点监控 | `region_id`, `region_name`, `cnt` |
| `jqzdqxh` | 责权单位查询 | `id`, `sbcode`, `yjlm`, `qclx`, `qclx_qzhm`, `zw_nm`, `lxfx` |
| `jqdljcx` | 摄像资源查询 | `id`, `sbcode`, `name`, `sstype`, `ip`, `xzzj`, `distance` |
| `jbkhq` | 泵管区查询 | `id`, `name`, `bzzj`, `distance` |
| `jqdrsqkq` | 排水分区查询 | `name`, `sum_zztjdl`, `frr`, `fzrjrxl`, `zjddjnjz`, 泵站总装机容量能力，泵站数量 |
| `cpcj` | 抽排能力查询 | 固定排涝能力 (m³/h), 泵站数量，移动排涝能力 (m³/h), 泵车数量 |

## 如何使用

前端在处理 API 响应时，应从 `response.data.rowsData` 中提取核心业务数据，`response.data.columns` 可用于表格列头渲染。

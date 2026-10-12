# 复现材料

## 运行方式

```bash
npm install
npx playwright install chromium
npm run reproduce
```

单场景：

```bash
node scripts/reproduce.mjs --scenario transport-timeout
```

带 Playwright trace（trace 会写入被忽略的 `evidence/generated/`）：

```bash
node scripts/reproduce.mjs --scenario http-rate-limit --trace
```

## 场景矩阵

| 场景 ID | 注入方式 | 预期分类 | 关键证据 |
| --- | --- | --- | --- |
| `happy-path` | API 200 + 两条结果 | `OK` | request、200、resultCount=2、UI 更新 |
| `ui-no-request` | 提交事件直接返回，不调用 API | `F01` | `networkRequestCount=0` |
| `transport-timeout` | API 延迟 700ms；页面 250ms 超时 | `F02` | request 有、response 无、`transportError=timeout` |
| `http-server-error` | API 返回 503 | `F03` | `httpStatus=503`，无策略标记 |
| `http-rate-limit` | API 返回 429 + `Retry-After: 3` | `F04` | 429、retry-after、无普通空结果 |
| `access-challenge` | API 200 + `challenge=true` | `F04` | challenge marker |
| `render-crash` | API 200 后页面运行时抛错并记录 console error | `F05` | console error、UI 未更新 |
| `semantic-empty` | API 200 + 合法空数组 + 语义不匹配标记 | `F06` | resultCount=0、semanticMismatch |
| `stale-state` | API 200 + 旧 requestId + stale marker | `F07` | staleState、旧结果保留 |

## 为什么不依赖真实搜索引擎

真实搜索引擎的网络、索引、登录、限流和页面版本持续变化；同一复现步骤无法证明同一根因。fixture 将故障注入点固定在本地，并把页面、API 和采集器放在同一个仓库，便于审查和回归。

## 证据文件

每次 `npm run reproduce` 都会生成 `evidence/latest-run.json`。该文件只包含本地 fixture 的结构化摘要，不包含 Cookie、Authorization、真实用户输入或外部站点数据。trace、截图等可能带页面内容的生成物只在显式传 `--trace` 时产生，并被 `.gitignore` 忽略。

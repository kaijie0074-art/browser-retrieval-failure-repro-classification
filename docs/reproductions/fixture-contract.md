# Fixture 契约

## 页面

`GET /?mode=<mode>&q=<query>` 返回一个同源检索页。页面会在 `window.__retrievalTelemetry` 暴露采集字段，供 Playwright 在点击后读取。

## API

`GET /api/search?mode=<mode>&q=<query>` 返回 JSON。页面只调用该 API；没有第三方请求。

| mode | HTTP | body / 页面行为 |
| --- | ---: | --- |
| `happy` | 200 | 两条结果、`requestId=fresh-request-001` |
| `ui-no-request` | 不调用 | 页面仅更新 `No request dispatched` |
| `transport-timeout` | 延迟后 200 | 700ms 后响应；页面 250ms 后中止 |
| `http-server-error` | 503 | 普通服务不可用，不带挑战标记 |
| `http-rate-limit` | 429 | `Retry-After: 3` |
| `access-challenge` | 200 | `challenge=true`、`x-search-challenge` |
| `render-crash` | 200 | 返回正常 JSON，页面随后抛出 `fixture render failure` |
| `semantic-empty` | 200 | `results=[]`、`semanticMismatch=true` |
| `stale-state` | 200 | `requestId=old-request-001`、`staleState=true` |

## 观测窗口

- 页面加载完成后点击 `Search`。
- 默认等待 120ms；超时场景等待 350ms，足以观察页面中止而不等待服务端晚到的响应。
- 每个场景使用新的 Chromium browser context，viewport 为 1280×720，locale 为 `en-US`，timezone 为 `UTC`。

## 清理

采集器在每个场景结束时关闭 context，在整个矩阵结束时关闭浏览器和本地 HTTP server；不会留下后台进程。

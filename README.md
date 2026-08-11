# 帮助与反馈 H5

独立移动端 H5：帮助中心 / 我要反馈 / 历史反馈 / 反馈详情。

## 技术栈

- Vite + Vue 3 + TypeScript
- Vue Router + Pinia
- 原生 CSS（Figma token）

## 开发

```bash
npm install
npm run dev
```

本地：`http://localhost:5173/`  
真机（同 Wi‑Fi）：终端里 `Network` 地址，例如 `http://10.x.x.x:5173/`

### 上传状态 Mock（仅开发环境）

页面底部有「上传 Mock」条，也可直接改 URL：

| 参数 | 效果 |
|------|------|
| （无）或 `?mockUpload=off` | 立即成功 |
| `?mockUpload=loading` | 一直转圈 |
| `?mockUpload=error` | 约 1.2s 后失败，点感叹号可重试 |
| `?mockUpload=slow` | 约 3s 后成功 |

示例：`http://localhost:5173/feedback?mockUpload=loading`

## 构建

```bash
npm run build
npm run preview
```

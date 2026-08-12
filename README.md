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

### 上传 / 提交 Mock（演示浮层）

页面左下角有可拖动的 **Mock** 面板（开发 / 生产预览 / GitHub Pages 演示都会显示）。  
也可直接改 URL（Hash 路由，参数写在 `#` 后面）：

| 参数 | 效果 |
|------|------|
| （无）或 `mockUpload=off` | 立即成功 |
| `mockUpload=loading` | 一直转圈 |
| `mockUpload=error` | 约 1.2s 后失败，点感叹号可重试 |
| `mockUpload=slow` | 约 3s 后成功 |
| `mockSubmit=fail` | 表单提交 / 对话发送失败 |

示例：`http://localhost:5173/#/feedback?mockUpload=loading`

## 构建

```bash
npm run build
npm run preview
```

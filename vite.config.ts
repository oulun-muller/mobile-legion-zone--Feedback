import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 让 dist/index.html 能在 file:// 下双击打开：
 * - 去掉 crossorigin（本地文件协议下会触发 CORS 拦截）
 * - 去掉 type="module"（Chrome 禁止 file:// 加载 ES Module）
 * - 要求产物是 IIFE 单文件（见下方 build.rollupOptions）
 */
function fileProtocolFriendlyHtml(): Plugin {
  return {
    name: 'file-protocol-friendly-html',
    // 仅用于生产构建产物；dev server 下 main.ts 是未打包的原生 ESM，
    // 去掉 type="module" 会导致 import 语句报语法错误、Vue 挂载失败。
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/\s+crossorigin(?:="[^"]*")?/g, '')
        .replace(/<script type="module"\s+/g, '<script defer ')
    },
  }
}

export default defineConfig({
  // 相对路径：双击 dist/index.html 时资源才能找对
  base: './',
  plugins: [vue(), fileProtocolFriendlyHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        // IIFE：普通 <script> 即可执行，不依赖 ES Module
        format: 'iife',
        name: 'LegionFeedbackApp',
        inlineDynamicImports: true,
        entryFileNames: 'assets/app.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})

/* =========================================================
   静的サイト書き出し用のビルド
   本体（vite.config.ts）は Cloudflare Worker 向けの SSR ビルド。
   こちらは Netlify など、ただのファイル置き場へ載せるための書き出し。
   鑑定の処理はすべて端末側で動くので、静的でも機能は変わらない。
   ========================================================= */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(import.meta.dirname, "static"),
  publicDir: resolve(import.meta.dirname, "public"),
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: {
      // 静的ビルドにルーターは要らないので、素の <a> に置き換える
      "next/link": resolve(import.meta.dirname, "static/link.tsx"),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist-static"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home:     resolve(import.meta.dirname, "static/index.html"),
        faq:      resolve(import.meta.dirname, "static/faq/index.html"),
        commerce: resolve(import.meta.dirname, "static/legal/commerce/index.html"),
        privacy:  resolve(import.meta.dirname, "static/legal/privacy/index.html"),
        terms:    resolve(import.meta.dirname, "static/legal/terms/index.html"),
      },
    },
  },
});

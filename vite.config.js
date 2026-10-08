import { defineConfig } from 'vite';

// Pré-carrega as duas fontes da primeira dobra (Doto e JetBrains Mono, subconjunto latino):
// o nome em partículas espera a Doto, e trocar a fonte depois desloca o layout.
const CRITICAL_FONTS = [/doto-latin-full-normal-[\w-]+\.woff2$/, /jetbrains-mono-latin-wght-normal-[\w-]+\.woff2$/];

function preloadFonts() {
  return {
    name: 'preload-critical-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = Object.keys(ctx.bundle).filter((name) => CRITICAL_FONTS.some((re) => re.test(name)));
        return {
          html,
          tags: files.map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', href: `./${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head-prepend',
          })),
        };
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [preloadFonts()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600,
  },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});

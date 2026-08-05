import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: true,
  }),
  site: 'https://your-blog.pages.dev',
  // Cloudflare Pages 不支持 Sharp 图片服务，使用 noop 兼容模式
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop',
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    envPrefix: ['PUBLIC_', 'VITE_', 'HACKER_'],
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        external: [
          '/pagefind/pagefind.js',
          '/pagefind/pagefind.js?*',
        ],
      },
    },
    ssr: {
      noExternal: ['@astrojs/cloudflare'],
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
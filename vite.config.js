import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.jsx',
      userscript: {
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=hifini.com',
        name: 'hifini音乐播放管理',
        namespace: 'http://tampermonkey.net/',
        description: '在HiFiNi网站自动播放歌曲，可以自定义播放列表',
        match: ['https://www.hifini.com/*', 'https://hifini.com/*'],
        author: 'zs',
        version: '1.0.3',
        require: [
          'https://cdn.jsdelivr.net/npm/dayjs@1.11.11/dayjs.min.js'
        ],
        grant: ['unsafeWindow'],
      },
      build: {
        externalGlobals: {
          react: cdn.jsdelivr('React', 'umd/react.production.min.js'),
          'react-dom': cdn.jsdelivr(
            'ReactDOM',
            'umd/react-dom.production.min.js',
          ),
          antd: cdn.jsdelivr('antd', 'dist/antd.min.js'),
        },
        autoGrant: false,
      },
    }),
  ],
});

import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import svgLoader from 'vite-svg-loader';
import configArcoStyleImportPlugin from './plugin/arcoStyleImport';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    svgLoader({ svgoConfig: {} }),
    configArcoStyleImportPlugin(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, '../src') },
      { find: 'assets', replacement: resolve(__dirname, '../src/assets') },
      // 消除 vue-i18n 的运行时警告
      { find: 'vue-i18n', replacement: 'vue-i18n/dist/vue-i18n.cjs.js' },
      // 保留模板编译能力（菜单使用 TSX）
      { find: 'vue', replacement: 'vue/dist/vue.esm-bundler.js' },
    ],
    extensions: ['.ts', '.js'],
  },
  define: {
    'process.env': {},
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          hack: `true; @import (reference) "${resolve(
            'src/assets/style/breakpoint.less'
          )}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
});

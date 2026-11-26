import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import globalComponents from '@/components';
import router from './router';
import store from './store';
import i18n from './locale';
import directive from './directive';
import App from './App.vue';
// 样式通过 arco-plugin 按需导入，详见 config/plugin/arcoStyleImport.ts
import '@/assets/style/global.less';
import '@/api/interceptor';
import { restoreTheme } from './config/themes';
import { appConfig } from './config/app-config';

// 恢复持久化主题（默认经典蓝亮色）
restoreTheme();
// 品牌标题统一由 appConfig 提供（index.html 的 title 仅作首屏兜底）
document.title = appConfig.title;

const app = createApp(App);

app.use(ArcoVue, {});
app.use(ArcoVueIcon);

app.use(router);
app.use(store);
app.use(i18n);
app.use(globalComponents);
app.use(directive);

app.mount('#app');

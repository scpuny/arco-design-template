import { defineStore } from 'pinia';

/**
 * 全局页面加载态。
 * - 默认开启（true）：覆盖首屏渲染，直到首个路由 afterEach 才关闭；
 * - 路由切换时由 router guard 在 beforeEach 置 true、afterEach 置 false。
 *
 * 为避免「进入即离开」的同步导航被 Vue 的响应式批处理合并掉（导致遮罩根本不渲染），
 * 关闭时保证遮罩至少展示 MIN_MS 毫秒，使每次路由切换都可见 loading。
 */
const MIN_VISIBLE_MS = 220;

const useLoadingStore = defineStore('loading', {
  state: () => ({
    pageLoading: true,
    _shownAt: 0,
  }),
  actions: {
    showPageLoading() {
      this._shownAt = Date.now();
      this.pageLoading = true;
    },
    hidePageLoading() {
      const elapsed = Date.now() - this._shownAt;
      if (elapsed >= MIN_VISIBLE_MS) {
        this.pageLoading = false;
      } else {
        window.setTimeout(() => {
          this.pageLoading = false;
        }, MIN_VISIBLE_MS - elapsed);
      }
    },
  },
});

export { useLoadingStore };

import type { Router } from 'vue-router';
import { setRouteEmitter } from '@/utils/route-listener';
import { useLoadingStore } from '@/store/modules/loading';
import setupUserLoginInfoGuard from './userLoginInfo';
import setupPermissionGuard from './permission';

function setupPageGuard(router: Router) {
  router.beforeEach(async (to) => {
    // emit route change
    setRouteEmitter(to);
  });
}

export default function createRouteGuard(router: Router) {
  // 路由切换：进入时开启全局加载，离开（导航确认）时关闭。
  // 注意：必须在回调内调用 useLoadingStore()，此时 pinia 已随 app 挂载激活
  // （在 createRouteGuard 顶层调用会因 pinia 尚未激活而报错）。
  router.beforeEach(() => {
    useLoadingStore().showPageLoading();
  });
  router.afterEach(() => {
    useLoadingStore().hidePageLoading();
  });
  setupPageGuard(router);
  setupUserLoginInfoGuard(router);
  setupPermissionGuard(router);
}

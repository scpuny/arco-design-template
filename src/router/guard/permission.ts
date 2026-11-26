import type {
  Router,
  RouteRecordNormalized,
  RouteRecordRaw,
} from 'vue-router';
import NProgress from 'nprogress'; // progress bar

import usePermission from '@/hooks/permission';
import { useUserStore, useAppStore } from '@/store';
import useMenuTree from '@/components/menu/use-menu-tree';
import { resolveDefaultHome } from '@/components/menu/use-app-nav';
import { appRoutes } from '../routes';
import { WHITE_LIST, NOT_FOUND } from '../constants';

export default function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const appStore = useAppStore();
    const userStore = useUserStore();
    const Permission = usePermission();
    const permissionsAllow = Permission.accessRouter(to);

    // 已登录仍访问登录页（含根路径 `/` 的 redirect、登录成功后的落地）→ 进入默认首页：
    // 「第一个有可见菜单的应用」的第一页（见 config/apps.ts、components/menu/use-app-nav.ts）。
    // 注意：登录页现由 SPA 渲染，会话可能仍然有效（userLoginInfo 守卫对 login 路由跳过了 info()），
    // 故这里主动嗅探一次会话；失败即视为未登录，停留登录页。
    if (to.name === 'login') {
      if (!userStore.role) {
        try {
          await userStore.info();
        } catch {
          /* 未登录：保持在登录页 */
        }
      }
      if (userStore.role) {
        const { menuTree } = useMenuTree();
        const home = resolveDefaultHome(menuTree.value as RouteRecordRaw[]);
        NProgress.done();
        next(home ?? NOT_FOUND);
        return;
      }
    }

    if (appStore.menuFromServer) {
      // 针对来自服务端的菜单配置进行处理
      // Handle routing configuration from the server

      // 根据需要自行完善来源于服务端的菜单配置的permission逻辑
      // Refine the permission logic from the server's menu configuration as needed
      if (
        !appStore.appAsyncMenus.length &&
        !WHITE_LIST.find((el) => el.name === to.name)
      ) {
        await appStore.fetchServerMenuConfig();
      }
      const serverMenuConfig = [...appStore.appAsyncMenus, ...WHITE_LIST];

      let exist = false;
      while (serverMenuConfig.length && !exist) {
        const element = serverMenuConfig.shift();
        if (element?.name === to.name) exist = true;

        if (element?.children) {
          serverMenuConfig.push(
            ...(element.children as unknown as RouteRecordNormalized[])
          );
        }
      }
      if (exist && permissionsAllow) {
        next();
      } else next(NOT_FOUND);
    } else {
      // eslint-disable-next-line no-lonely-if
      if (permissionsAllow) next();
      else {
        const destination =
          Permission.findFirstPermissionRoute(appRoutes, userStore.role) ||
          NOT_FOUND;
        next(destination);
      }
    }
    NProgress.done();
  });
}

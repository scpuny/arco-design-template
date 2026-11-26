<template>
  <a-layout
    class="layout"
    :class="{ mobile: appStore.hideMenu, 'layout--mix': isMix }"
  >
    <div v-if="navbar" class="layout-navbar" :style="navBarStyle">
      <NavBar />
    </div>
    <a-layout>
      <a-layout>
        <a-layout-sider
          v-if="renderMenu"
          v-show="!hideMenu"
          class="layout-sider"
          breakpoint="xl"
          :collapsed="collapsed"
          :collapsible="true"
          :width="menuWidth"
          :hide-trigger="true"
          @collapse="setCollapsed"
        >
          <!-- Logo 区：宽度与侧边栏一致，右侧+下侧竖线分隔（混合菜单下 Logo 在顶栏，此处省略） -->
          <div
            v-if="!isMix"
            class="layout-sider-logo"
            :class="{ collapsed: collapsed }"
          >
            <img src="@/assets/logo.svg?url" class="sider-logo-img" alt="logo" />
            <span v-show="!collapsed" class="layout-sider-logo-text">{{
              appConfig.shortTitle
            }}</span>
          </div>
          <div class="menu-wrapper">
            <Menu :routes="menuRoutes" />
          </div>
        </a-layout-sider>
        <a-drawer
          v-if="hideMenu"
          :visible="drawerVisible"
          placement="left"
          :footer="false"
          mask-closable
          :closable="false"
          @cancel="drawerCancel"
        >
          <Menu />
        </a-drawer>
        <a-layout class="layout-content" :style="paddingStyle">
          <TabBar v-if="appStore.tabBar" />
          <div class="layout-body">
            <div ref="contentRef" class="layout-content-region">
              <a-layout-content>
                <!-- 混合菜单：面包屑置于内容区顶部（顶栏只承载应用导航，避免两者互相挤压） -->
                <div v-if="isMix && !appStore.tabBar" class="layout-crumb">
                  <Breadcrumb :items="crumbItems" />
                </div>
                <PageLayout />
              </a-layout-content>
            </div>
            <Footer v-if="footer" />
          </div>
        </a-layout>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
  import {
    ref,
    computed,
    watch,
    provide,
    onMounted,
    onUnmounted,
    shallowRef,
  } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAppStore, useUserStore } from '@/store';
  import NavBar from '@/components/navbar/index.vue';
  import Menu from '@/components/menu/index.vue';
  import Footer from '@/components/footer/index.vue';
  import TabBar from '@/components/tab-bar/index.vue';
  import usePermission from '@/hooks/permission';
  import useResponsive from '@/hooks/responsive';
  import PageLayout from './page-layout.vue';
  import Breadcrumb from '@/components/breadcrumb/index.vue';
  import useAppNav from '@/components/menu/use-app-nav';
  import { appConfig } from '@/config/app-config';

  const isInit = ref(false);
  // 内容区元素：供 TabBar 的「全屏」按钮做元素级 requestFullscreen
  // （全屏当前激活 tab 的内容区，而非整张文档；浏览器会自动让该元素铺满视口、
  // 隐藏侧栏/顶栏/tab 条，无需额外 CSS）
  const contentRef = shallowRef<HTMLElement | null>(null);
  provide('layoutContentRef', contentRef);

  const appStore = useAppStore();
  const userStore = useUserStore();
  const router = useRouter();
  const route = useRoute();
  const permission = usePermission();
  useResponsive(true);
  const navbar = computed(() => appStore.navbar);
  // 纯顶部模式：菜单全部横向在顶栏，不再渲染左侧
  const isTopMenu = computed(() => appStore.menuMode === 'top');
  // 混合菜单：顶栏应用导航 + 左侧当前应用菜单（窄屏自动退化为左侧单栏）
  const isMix = computed(
    () => appStore.menuMode === 'mix' && appStore.device === 'desktop'
  );
  const renderMenu = computed(() => appStore.menu && !isTopMenu.value);
  // 左侧菜单数据源：混合菜单下只渲染「当前应用」的菜单；其他模式用全量
  const { leftMenuTree, activeApp } = useAppNav();
  const menuRoutes = computed(() =>
    isMix.value ? leftMenuTree.value : undefined
  );
  // 混合菜单的面包屑（放在内容区顶部）：应用名 / 当前页
  const crumbItems = computed(() => {
    const items: string[] = [];
    if (activeApp.value?.locale) items.push(activeApp.value.locale);
    const loc = (route.meta as { locale?: string }).locale;
    if (loc) items.push(loc);
    return items;
  });
  const hideMenu = computed(() => appStore.hideMenu);
  const footer = computed(() => appStore.footer);
  const menuWidth = computed(() => {
    return appStore.menuCollapse ? 48 : appStore.menuWidth;
  });
  // 顶栏从 Logo 区（=侧边栏宽）右侧开始，避免盖住侧边栏 Logo；移动端全宽
  const navBarStyle = computed(() => {
    // 混合菜单：顶栏全宽（品牌区在顶栏内侧）；其他模式让出左侧 Logo 列
    if (isMix.value || hideMenu.value || !renderMenu.value) return {};
    return {
      left: `${menuWidth.value}px`,
      width: `calc(100% - ${menuWidth.value}px)`,
    };
  });
  const collapsed = computed(() => {
    return appStore.menuCollapse;
  });
  const paddingStyle = computed(() => {
    // 外层 .layout-content 只保留「让位固定元素」的内边距：左侧让出固定侧栏宽、
    // 顶部让出固定导航高。页面 20px 内容边距由内层 .layout-body 承担——
    // 这样 TabBar（外层直接子元素，位于导航下方）贴齐上下左右，页面内容间距不变。
    const paddingLeft =
      renderMenu.value && !hideMenu.value
        ? { paddingLeft: `${menuWidth.value}px` }
        : {};
    const paddingTop = navbar.value ? { paddingTop: '60px' } : {};
    return { ...paddingLeft, ...paddingTop };
  });
  const setCollapsed = (val: boolean) => {
    if (!isInit.value) return; // for page initialization menu state problem
    appStore.updateSettings({ menuCollapse: val });
  };
  watch(
    () => userStore.role,
    (roleValue) => {
      if (roleValue && !permission.accessRouter(route))
        router.push({ name: 'notFound' });
    }
  );
  const drawerVisible = ref(false);
  const drawerCancel = () => {
    drawerVisible.value = false;
  };
  provide('toggleDrawerMenu', () => {
    drawerVisible.value = !drawerVisible.value;
  });
  onMounted(() => {
    isInit.value = true;
  });
</script>

<style scoped lang="less">
  @nav-size-height: 60px;
  @layout-max-width: 1100px;

  .layout {
    width: 100%;
    height: 100%;
  }

  .layout-navbar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 100;
    width: 100%;
    height: @nav-size-height;
    border-bottom: 1px solid var(--color-border-2);
  }

  .layout-sider {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99;
    height: 100%;
    // 主题渐变背景（themes.ts 注入 --adt-sider-bg）
    background: var(--adt-sider-bg, var(--color-menu-light-bg));
    background-size: cover;
    transition: all 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
    // 右边界线与顶栏 Logo 区（.navbar-logo / .layout-sider-logo）的 border-right 对齐：
    // Logo 区 box-sizing:border-box，其边框落在 width 内的最后一列；这里不能直接
    // right:-1px 再画一条，否则会在交界处出现 1px 台阶（用户反馈的「没对齐」）。
    &::after {
      position: absolute;
      top: 0;
      right: 0;
      display: block;
      width: 1px;
      height: 100%;
      background-color: var(--color-border-2, var(--color-border));
      content: '';
    }

    > :deep(.arco-layout-sider-children) {
      overflow-y: hidden;
    }
  }

  // 混合菜单：顶栏全宽，左侧菜单下移到顶栏下方（品牌区在顶栏内，故菜单占满整列）
  .layout--mix {
    .layout-sider {
      top: @nav-size-height;
      height: calc(100% - @nav-size-height);
    }

    .menu-wrapper {
      height: 100%;
    }
  }

  // 内容区顶部的面包屑（仅混合菜单）：压掉组件自带外边距，作为页面标题上方的一行
  .layout-crumb {
    margin: -6px 0 12px;

    :deep(.container-breadcrumb) {
      margin: 0;
    }
  }

  // 侧边栏顶部 Logo 区：透明融入渐变背景，右侧+下侧竖线分隔
  .layout-sider-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: @nav-size-height;
    padding: 0 12px;
    background: transparent;
    border-right: 1px solid var(--color-border-2);
    border-bottom: 1px solid var(--color-border-2);

    &.collapsed {
      justify-content: center;
      padding: 0;
    }

    &-text {
      color: var(--color-text-1);
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
    }

    .sider-logo-img {
      width: 30px;
      height: 30px;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  .menu-wrapper {
    height: calc(100% - @nav-size-height);
    overflow: auto;
    overflow-x: hidden;
    :deep(.arco-menu) {
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      ::-webkit-scrollbar-thumb {
        border: 0 solid transparent;
        background-clip: padding-box;
        border-radius: 4px;
        background-color: color-mix(in srgb, var(--color-text-4) 35%, transparent);
      }

      ::-webkit-scrollbar-thumb:hover {
        background-color: color-mix(in srgb, var(--color-text-3) 50%, transparent);
      }
    }
  }

  .layout-content {
    // 外层不再滚动：flex 纵列布局，TabBar 钉在顶部（不随内容滚、不占滚动条）；
    // 滚动容器下沉到 .layout-body，使滚动条只覆盖页面内容区、不贯穿 tab 条。
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    // 主题内容区渐变（themes.ts 注入 --adt-content-bg）
    background: var(--adt-content-bg, var(--color-fill-2));
    background-size: cover;
    transition: padding 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
    // 本层不再承担 20px 内容边距（避免 TabBar 被内缩）；仅让位固定侧栏/导航，
    // 由内联 paddingStyle 提供；页面 20px 内边距下沉到 .layout-body。
    padding: 0;

    .layout-body {
      // 滚动容器：占据 tab 条下方的全部空间（flex:1 + min-height:0 才能真正收缩滚动）
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      // 页面内容的统一 20px 内边距（左右 + 上/下），与 tab 条解耦
      padding: 20px;
    }

    // 内容区（当前激活 tab 内容）：外层全屏目标是该元素（TabBar「全屏」按钮做元素级
    // requestFullscreen，铺满视口并隐藏侧栏/顶栏/tab 条）。背景沿用外层内容区渐变，
    // 全屏时不至于落到纯黑；overflow-y 让全屏下超长内容可内部滚动（正常态为 auto 高度，不产生滚动）。
    .layout-content-region {
      background: var(--adt-content-bg, var(--color-fill-2));
      overflow-y: auto;
    }
  }
</style>

<template>
  <div class="navbar">
    <div class="left-side" :class="{ 'left-side--mix': isMixMenu }">
      <!-- 混合菜单：Logo 移到顶栏最左，宽度与左侧菜单一致，形成 L 形边界 -->
      <div
        v-if="isMixMenu"
        class="navbar-logo"
        :style="{ width: `${appStore.menuWidth}px` }"
      >
        <img src="@/assets/logo.svg?url" class="navbar-logo-img" alt="logo" />
        <span class="navbar-logo-text">{{ brandText }}</span>
      </div>
      <!-- 面包屑：混合菜单下已移入内容区顶部（顶栏让位给应用导航），此处仅其它模式显示 -->
      <a-breadcrumb v-if="!isMixMenu" class="navbar-breadcrumb">
        <a-breadcrumb-item>
          <icon-apps />
        </a-breadcrumb-item>
        <a-breadcrumb-item>{{ appConfig.shortTitle }}</a-breadcrumb-item>
        <a-breadcrumb-item>{{ currentTitle }}</a-breadcrumb-item>
      </a-breadcrumb>
      <icon-menu-fold
        v-if="!isTopMenu && appStore.menu && appStore.device === 'mobile'"
        style="font-size: 22px; cursor: pointer; margin-left: 8px"
        @click="toggleDrawerMenu"
      />
    </div>
    <div class="center-side">
      <!-- 混合菜单：顶部承载「应用」导航；纯顶部模式：顶部承载全量菜单 -->
      <AppNav v-if="isMixMenu" />
      <Menu v-else-if="isTopMenu" />
    </div>
    <ul class="right-side">
      <li>
        <a-tooltip :content="$t('settings.search')">
          <a-button class="nav-btn" type="outline" :shape="'circle'">
            <template #icon>
              <icon-search />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip :content="$t('settings.language')">
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="setDropDownVisible"
          >
            <template #icon>
              <icon-language />
            </template>
          </a-button>
        </a-tooltip>
        <a-dropdown trigger="click" @select="changeLocale as any">
          <div ref="triggerBtn" class="trigger-btn"></div>
          <template #content>
            <a-doption
              v-for="item in locales"
              :key="item.value"
              :value="item.value"
            >
              <template #icon>
                <icon-check v-show="item.value === currentLocale" />
              </template>
              {{ item.label }}
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-dropdown trigger="click" @select="onSelectMode">
          <a-tooltip content="明暗模式">
            <a-button class="nav-btn" type="outline" :shape="'circle'">
              <template #icon>
                <icon-moon-fill v-if="themeState.pref === 'dark'" />
                <icon-sun-fill v-else-if="themeState.pref === 'light'" />
                <icon-computer v-else />
              </template>
            </a-button>
          </a-tooltip>
          <template #content>
            <a-doption value="system">
              <a-space>
                <icon-computer />
                <span>跟随系统</span>
                <icon-check v-show="themeState.pref === 'system'" />
              </a-space>
            </a-doption>
            <a-doption value="light">
              <a-space>
                <icon-sun-fill />
                <span>浅色</span>
                <icon-check v-show="themeState.pref === 'light'" />
              </a-space>
            </a-doption>
            <a-doption value="dark">
              <a-space>
                <icon-moon-fill />
                <span>深色</span>
                <icon-check v-show="themeState.pref === 'dark'" />
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-dropdown trigger="click" @select="onSelectTheme">
          <a-tooltip content="主题配色">
            <a-button class="nav-btn" type="outline" :shape="'circle'">
              <template #icon>
                <span class="theme-dot" :style="{ background: currentColor() }"></span>
              </template>
            </a-button>
          </a-tooltip>
          <template #content>
            <a-doption v-for="t in THEMES" :key="t.key" :value="t.key">
              <a-space>
                <span
                  class="theme-dot"
                  :style="{ background: t[themeState.mode].tokens.accent }"
                ></span>
                <span class="theme-opt-name">{{ t.en }} {{ t.name }}</span>
                <span class="theme-opt-note">{{ t.note }}</span>
                <icon-check v-show="themeState.themeKey === t.key" />
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-tooltip :content="$t('settings.navbar.alerts')">
          <div class="message-box-trigger">
            <a-badge :count="unread" :max="99">
              <a-button
                class="nav-btn"
                type="outline"
                :shape="'circle'"
                @click="setPopoverVisible"
              >
                <icon-notification />
              </a-button>
            </a-badge>
          </div>
        </a-tooltip>
        <a-popover
          v-model:popup-visible="msgPopoverVisible"
          trigger="click"
          position="bottom"
          :arrow-style="{ display: 'none' }"
          :content-style="{ padding: 0, minWidth: '400px' }"
          content-class="message-popover"
        >
          <div class="ref-btn"></div>
          <template #content>
            <message-box @navigate="msgPopoverVisible = false" />
          </template>
        </a-popover>
      </li>
      <li>
        <a-tooltip
          :content="
            isFullscreen
              ? $t('settings.navbar.screen.toExit')
              : $t('settings.navbar.screen.toFull')
          "
        >
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="toggleFullScreen"
          >
            <template #icon>
              <icon-fullscreen-exit v-if="isFullscreen" />
              <icon-fullscreen v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-tooltip :content="$t('settings.title')">
          <a-button
            class="nav-btn"
            type="outline"
            :shape="'circle'"
            @click="setVisible"
          >
            <template #icon>
              <icon-settings />
            </template>
          </a-button>
        </a-tooltip>
      </li>
      <li>
        <a-dropdown trigger="click">
          <a-avatar :size="32" :style="{ marginRight: '8px', cursor: 'pointer' }">
            <img v-if="avatar" alt="avatar" :src="avatar" />
            <icon-user v-else />
          </a-avatar>
          <template #content>
            <div class="uc-dd-head">
              <a-avatar :size="38">
                <img v-if="avatar" alt="avatar" :src="avatar" />
                <icon-user v-else />
              </a-avatar>
              <div class="uc-dd-meta">
                <div class="uc-dd-name">{{ userStore.name || '—' }}</div>
                <div class="uc-dd-sub">{{ userStore.role === "admin" ? "管理员" : "用户" }}</div>
              </div>
            </div>
            <a-divider style="margin: 8px 0" />
            <a-doption @click="$router.push('/user')">
              <a-space>
                <icon-user />
                <span>个人中心</span>
              </a-space>
            </a-doption>
            <a-doption @click="handleLogout">
              <a-space>
                <icon-export />
                <span>退出登录</span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, inject, watch, onMounted, onBeforeUnmount } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { Message } from '@arco-design/web-vue';
  import { useFullscreen } from '@vueuse/core';
  import { useAppStore, useUserStore } from '@/store';
  import { LOCALE_OPTIONS } from '@/locale';
  import useLocale from '@/hooks/locale';
  import useUser from '@/hooks/user';
  import {
    THEMES,
    themeState,
    setMode,
    selectTheme,
    currentColor,
    watchSystemMode,
  } from '@/config/themes';
  import type { ModePref } from '@/config/themes';
  import Menu from '@/components/menu/index.vue';
  import AppNav from './app-nav.vue';
  import MessageBox from '../message-box/index.vue';
  import { useMessageUnread } from '@/hooks/useMessageUnread';
  import { appConfig } from '@/config/app-config';

  const route = useRoute();
  const { t } = useI18n();
  const appStore = useAppStore();
  const userStore = useUserStore();
  const { logout } = useUser();
  const { changeLocale, currentLocale } = useLocale();
  const { isFullscreen, toggle: toggleFullScreen } = useFullscreen();
  const { unread, refresh: refreshUnread } = useMessageUnread();
  const locales = [...LOCALE_OPTIONS];
  // 品牌区：统一读取 config/app-config.ts，新系统改一处即可
  const brandText = appConfig.shortTitle;
  // 当前页面标题：取路由 meta.locale（菜单名），无则显示路由名
  const currentTitle = computed(() => {
    const meta = route.meta as { locale?: string };
    if (meta.locale) return t(meta.locale);
    return route.name ? String(route.name) : '';
  });
  const avatar = computed(() => {
    return userStore.avatar;
  });
  // 菜单模式：mix（顶部应用导航 + 左侧当前应用菜单）/ top（纯顶部）/ side（左侧单栏）
  const isMixMenu = computed(
    () =>
      appStore.menu &&
      appStore.menuMode === 'mix' &&
      appStore.device === 'desktop'
  );
  const isTopMenu = computed(
    () => appStore.menu && appStore.menuMode === 'top'
  );

  // 明暗模式选项组：跟随系统 / 浅色 / 深色
  const onSelectMode = (value: unknown) => {
    setMode(String(value) as ModePref);
  };
  // 主题配色（颜色族）选择：明暗共用该族原色
  const onSelectTheme = (value: unknown) => {
    selectTheme(String(value));
  };

  // 同步 appStore.theme 供图表等基于 useThemes().isDark 的组件使用
  watch(
    () => themeState.mode,
    (m) => appStore.updateSettings({ theme: m }),
    { immediate: true }
  );

  // 监听系统配色变化（偏好为 system 时回应用）
  let stopSystemWatch: (() => void) | undefined;
  onMounted(() => {
    stopSystemWatch = watchSystemMode((_mode) => {
      setMode('system'); // 重新解析并应用对应模式的已存主题
    });
    // 已登录会话补拉头像（旧会话 store 无 avatar，需刷新一次才显示）
    if (!userStore.avatar) userStore.info();
    // 拉取站内信未读数，驱动顶栏角标
    refreshUnread('IN_APP');
  });
  onBeforeUnmount(() => stopSystemWatch?.());
  const setVisible = () => {
    appStore.updateSettings({ globalSettings: true });
  };
  const triggerBtn = ref();
  /** 受控显隐：消息点「去处理」后由 message-box 的 navigate 事件收起弹层。 */
  const msgPopoverVisible = ref(false);
  const setPopoverVisible = () => {
    msgPopoverVisible.value = !msgPopoverVisible.value;
  };
  const handleLogout = () => {
    logout();
  };
  const setDropDownVisible = () => {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    triggerBtn.value.dispatchEvent(event);
  };
  const switchRoles = async () => {
    const res = await userStore.switchRoles();
    Message.success(res as string);
  };
  const toggleDrawerMenu = inject('toggleDrawerMenu') as () => void;
</script>

<style scoped lang="less">
  .navbar {
    display: flex;
    justify-content: space-between;
    height: 100%;
    // 顶栏主题背景（themes.ts 注入 --adt-navbar-bg，纯色）
    background: var(--adt-navbar-bg, var(--color-bg-2));
    // 下边框由外层 .layout-navbar 统一提供，这里不再重复画线
  }

  .left-side {
    display: flex;
    align-items: center;
    padding-left: 20px;
    gap: 8px;

    .navbar-breadcrumb {
      :deep(.arco-breadcrumb-item) {
        color: var(--color-text-2);
        &:last-child {
          color: var(--color-text-1);
          font-weight: 500;
        }
      }
    }
  }

  // 混合菜单：品牌区自带内边距并贴左，形成与下方菜单一致的 L 形边界
  .left-side--mix {
    padding-left: 0;
  }

  .navbar-logo {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    height: 100%;
    padding: 0 12px;
    border-right: 1px solid var(--color-border);

    &-text {
      overflow: hidden;
      color: var(--color-text-1);
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
    }

    &-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 4px;
      flex: none;
    }
  }

  .center-side {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
    padding-left: 12px;
  }

  .right-side {
    display: flex;
    padding-right: 20px;
    list-style: none;
    :deep(.locale-select) {
      border-radius: 20px;
    }
    li {
      display: flex;
      align-items: center;
      padding: 0 10px;
    }

    a {
      color: var(--color-text-1);
      text-decoration: none;
    }
    .nav-btn {
      border-color: rgb(var(--gray-2));
      color: rgb(var(--gray-8));
      font-size: 16px;
    }
    .theme-dot {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid var(--adt-t-ring);
    }
    .theme-opt-name {
      font-size: 13px;
      color: var(--color-text-1);
    }
    .theme-opt-note {
      font-size: 12px;
      color: var(--color-text-3);
    }
    .trigger-btn,
    .ref-btn {
      position: absolute;
      bottom: 14px;
    }
    .trigger-btn {
      margin-left: 14px;
    }
    /* 消息浮层向下弹：锚点贴住顶栏底边，配合 popover 内置 10px 偏移留出间距，
       否则面板会从锚点上方展开、越过顶栏上沿被裁切。 */
    .ref-btn {
      bottom: 0;
    }
  }

  // 头像下拉头部（teleport 到 body，需顶层 scoped 选择器）
  .uc-dd-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px 2px;
    .uc-dd-meta {
      display: flex;
      flex-direction: column;
    }
    .uc-dd-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
      line-height: 1.3;
    }
    .uc-dd-sub {
      font-size: 12px;
      color: var(--color-text-3);
    }
  }
</style>

<style lang="less">
  /* content-class 挂在 Arco 的内容容器本身，圆角/阴影要在这一层收口 */
  .message-popover {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14);

    .arco-popover-content {
      margin-top: 0;
    }
  }
</style>

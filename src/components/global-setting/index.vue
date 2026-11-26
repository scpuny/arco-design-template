<template>
  <div v-if="!appStore.navbar" class="fixed-settings" @click="setVisible">
    <a-button type="primary">
      <template #icon>
        <icon-settings />
      </template>
    </a-button>
  </div>
  <a-drawer
    :width="300"
    unmount-on-close
    :visible="visible"
    :cancel-text="$t('settings.close')"
    :ok-text="$t('settings.copySettings')"
    @ok="copySettings"
    @cancel="cancel"
  >
    <template #title> {{ $t('settings.title') }} </template>
    <!-- 外观模式：跟随系统 / 浅色 / 深色 -->
    <div class="theme-preset-block">
      <div class="theme-preset-title">外观模式</div>
      <a-radio-group
        class="theme-mode-group"
        type="button"
        :model-value="themeState.pref"
        @change="onModeChange"
      >
        <a-radio value="system">跟随系统</a-radio>
        <a-radio value="light">浅色</a-radio>
        <a-radio value="dark">深色</a-radio>
      </a-radio-group>
    </div>
    <!-- 主题配色选择（Reasonix 基础视觉方向，明暗共用；明暗偏好在上方切换） -->
    <div class="theme-preset-block">
      <div class="theme-preset-title">主题配色（明暗共用）</div>
      <div class="theme-preset-list">
        <div
          v-for="t in THEMES"
          :key="t.key"
          class="theme-preset-item"
          :class="{ active: themeState.themeKey === t.key }"
          @click="onSelectTheme(t.key)"
        >
          <!-- 主题样式示例（左侧三色 swatch） -->
          <div class="theme-preset-swatches">
            <span
              class="theme-preset-swatch"
              :style="{ background: t[themeState.mode].tokens.bg }"
            ></span>
            <span
              class="theme-preset-swatch"
              :style="{ background: t[themeState.mode].tokens.bgElev }"
            ></span>
            <span
              class="theme-preset-swatch"
              :style="{ background: themeAccentGradient(t[themeState.mode].tokens) }"
            ></span>
            <span v-if="themeState.themeKey === t.key" class="theme-preset-check">
              <icon-check style="color: var(--color-white)" />
            </span>
          </div>
          <!-- 右侧信息 -->
          <div class="theme-preset-info">
            <div class="theme-preset-name">
              <span class="theme-preset-en">{{ t.en }}</span>
              <span class="theme-preset-zh">{{ t.name }}</span>
              <span class="theme-preset-note">{{ t.note }}</span>
            </div>
            <div class="theme-preset-desc">{{ t.description }}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 菜单模式：混合（顶部应用导航 + 左侧应用菜单）/ 左侧单栏 / 纯顶部 -->
    <div class="theme-preset-block">
      <div class="theme-preset-title">{{ $t('settings.menuMode') }}</div>
      <a-radio-group
        class="theme-mode-group menu-mode-group"
        direction="vertical"
        :model-value="appStore.menuMode"
        @change="onMenuModeChange"
      >
        <a-radio value="mix">{{ $t('settings.menuMode.mix') }}</a-radio>
        <a-radio value="side">{{ $t('settings.menuMode.side') }}</a-radio>
        <a-radio value="top">{{ $t('settings.menuMode.top') }}</a-radio>
      </a-radio-group>
    </div>
    <!-- 页面动画：切换动画 开关 + 动画类型 下拉 -->
    <div class="block page-animation-block">
      <h5 class="title">{{ $t('settings.pageAnimation') }}</h5>
      <div class="switch-wrapper">
        <span>{{ $t('settings.routeAnimation.enabled') }}</span>
        <a-switch
          :model-value="routeAnimationState.enabled"
          size="small"
          @change="onAnimationEnabledChange"
        />
      </div>
      <div class="switch-wrapper">
        <span>{{ $t('settings.routeAnimation.type') }}</span>
        <a-select
          :model-value="routeAnimationState.type"
          size="small"
          style="width: 130px"
          @change="onRouteAnimationTypeChange"
        >
          <a-option
            v-for="opt in ROUTE_ANIMATIONS"
            :key="opt.value"
            :value="opt.value"
          >
            {{ $t(opt.labelKey) }}
          </a-option>
        </a-select>
      </div>
    </div>
    <Block :options="contentOpts" :title="$t('settings.content')" />
    <Block :options="othersOpts" :title="$t('settings.otherSettings')" />
    <a-alert>{{ $t('settings.alertContent') }}</a-alert>
  </a-drawer>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { useClipboard } from '@vueuse/core';
  import { useAppStore } from '@/store';
  import Block from './block.vue';
  import {
    THEMES,
    themeState,
    selectTheme,
    setMode,
    themeAccentGradient,
  } from '@/config/themes';
  import {
    ROUTE_ANIMATIONS,
    routeAnimationState,
    setRouteAnimationEnabled,
    setRouteAnimationType,
    type RouteAnimation,
  } from '@/config/route-transition';

  const emit = defineEmits(['cancel']);

  const appStore = useAppStore();
  const { t } = useI18n();
  const { copy } = useClipboard();
  const visible = computed(() => appStore.globalSettings);

  const onSelectTheme = (key: string) => {
    selectTheme(key);
    // 同步 appStore.theme 供图表等基于 useThemes().isDark 的组件使用
    appStore.updateSettings({ theme: themeState.mode });
  };

  /** 外观模式切换（跟随系统 / 浅色 / 深色），与顶栏下拉共享 themeState */
  const onModeChange = (value: string | number | boolean) => {
    setMode(value as 'system' | 'light' | 'dark');
    appStore.updateSettings({ theme: themeState.mode });
  };

  /** 菜单模式切换：混合（顶部应用 + 左侧菜单）/ 左侧单栏 / 纯顶部 */
  const onMenuModeChange = (value: string | number | boolean) => {
    appStore.updateSettings({ menuMode: value as 'side' | 'mix' | 'top' });
  };

  /** 「切换动画」开关：立即生效并持久化 */
  const onAnimationEnabledChange = (value: unknown) => {
    setRouteAnimationEnabled(Boolean(value));
  };

  /** 「动画类型」下拉：立即生效并持久化 */
  const onRouteAnimationTypeChange = (value: unknown) => {
    setRouteAnimationType(value as RouteAnimation);
  };

  const contentOpts = computed(() => [
    { name: 'settings.navbar', key: 'navbar', defaultVal: appStore.navbar },
    { name: 'settings.menu', key: 'menu', defaultVal: appStore.menu },
    { name: 'settings.footer', key: 'footer', defaultVal: appStore.footer },
    { name: 'settings.tabBar', key: 'tabBar', defaultVal: appStore.tabBar },
    {
      name: 'settings.menuFromServer',
      key: 'menuFromServer',
      defaultVal: appStore.menuFromServer,
    },
    {
      name: 'settings.menuWidth',
      key: 'menuWidth',
      defaultVal: appStore.menuWidth,
      type: 'number',
    },
  ]);
  const othersOpts = computed(() => [
    {
      name: 'settings.colorWeak',
      key: 'colorWeak',
      defaultVal: appStore.colorWeak,
    },
  ]);

  const cancel = () => {
    appStore.updateSettings({ globalSettings: false });
    emit('cancel');
  };
  const copySettings = async () => {
    const text = JSON.stringify(appStore.$state, null, 2);
    await copy(text);
    Message.success(t('settings.copySettings.message'));
  };
  const setVisible = () => {
    appStore.updateSettings({ globalSettings: true });
  };
</script>

<style scoped lang="less">
  .fixed-settings {
    position: fixed;
    top: 280px;
    right: 0;

    svg {
      font-size: 18px;
      vertical-align: -4px;
    }
  }

  .page-animation-block {
    margin-bottom: 24px;

    .title {
      margin: 10px 0;
      padding: 0;
      color: var(--color-text-1);
      font-size: 14px;
    }

    .switch-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 32px;
      color: var(--color-text-2);
      font-size: 13px;
    }
  }

  .theme-preset-block {
    margin-bottom: 16px;

    .theme-mode-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;

      :deep(.arco-radio-button) {
        text-align: center;
      }
    }

    .theme-preset-title {
      color: var(--color-text-1);
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .theme-preset-hint {
      margin-top: 8px;
      color: var(--color-text-3);
      font-size: 12px;
      line-height: 1.5;
    }

    .theme-preset-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .theme-preset-item {
      display: flex;
      align-items: stretch;
      gap: 12px;
      padding: 8px;
      border: 1px solid var(--color-border-2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: rgb(var(--primary-6));
      }

      &.active {
        border-color: rgb(var(--primary-6));
        background: var(--color-fill-1);
      }
    }

    /* 画廊三色 swatch（左侧示例）：bg / surface / accent 渐变，竖排贴合纹理 */
    .theme-preset-swatches {
      position: relative;
      flex: 0 0 34px;
      display: flex;
      flex-direction: column;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--color-border-2);

      .theme-preset-swatch {
        flex: 1;
      }

      .theme-preset-check {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgb(var(--primary-6));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      }
    }

    .theme-preset-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .theme-preset-name {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-size: 12px;

      .theme-preset-en {
        font-weight: 600;
        color: var(--color-text-1);
      }

      .theme-preset-zh {
        color: var(--color-text-1);
      }

      .theme-preset-note {
        margin-left: auto;
        font-size: 11px;
        color: var(--color-text-3);
        background: var(--color-fill-2);
        padding: 0 6px;
        border-radius: 4px;
        white-space: nowrap;
      }
    }

    .theme-preset-desc {
      font-size: 11px;
      line-height: 1.4;
      color: var(--color-text-3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
</style>

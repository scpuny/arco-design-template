<template>
  <nav class="app-nav">
    <button
      v-for="app in appGroups"
      :key="app.key"
      type="button"
      class="app-nav__item"
      :class="{ 'is-active': app.key === activeAppKey }"
      @click="onAppClick(app.key)"
    >
      <component :is="app.icon" />
      <span>{{ app.label || $t(app.locale) }}</span>
    </button>
  </nav>
</template>

<script lang="ts" setup>
  import { useRouter } from 'vue-router';
  import useAppNav, { firstPageOfApp } from '@/components/menu/use-app-nav';

  const router = useRouter();
  const { appGroups, activeAppKey } = useAppNav();

  /**
   * 切换应用：进入该应用第一页。
   * 用「第一个可访问叶子路由」而非 redirect —— 一级路由本身不是页面，且部分模块没配 redirect。
   */
  const onAppClick = (key: string) => {
    const app = appGroups.value.find((g) => g.key === key);
    if (!app) return;
    const target = firstPageOfApp(app);
    if (target) router.push(target);
  };
</script>

<style scoped lang="less">
  /**
   * 顶部应用导航：自绘一排按钮（不用 a-menu）
   * 原因：Arco 横向菜单在宽度不足时会自动折叠项到 "..." 溢出菜单，且默认带白底与顶栏渐变不协调；
   * 应用数量少而稳定，自绘可完全控制选中态、背景与垂直居中。
   */
  .app-nav {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 100%;
    min-width: 0;
    overflow: hidden;

    &__item {
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      color: var(--color-text-2);
      font-weight: 400;
      font-size: 13px;
      white-space: nowrap;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s, color 0.2s;

      .arco-icon {
        font-size: 16px;
      }

      &:hover {
        color: var(--color-text-1);
        background: color-mix(in srgb, rgb(var(--primary-6)) 8%, transparent);
      }

      &.is-active {
        color: rgb(var(--primary-6));
        font-weight: 500;
        background: color-mix(in srgb, rgb(var(--primary-6)) 10%, transparent);
      }
    }
  }
</style>

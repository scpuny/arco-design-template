<template>
  <a-config-provider :locale="locale">
    <router-view />
    <global-setting />
    <!-- 全局页面加载遮罩：首屏渲染与路由切换时显示 -->
    <transition name="gl-fade">
      <GlobalLoading v-if="loadingStore.pageLoading" tip="页面加载中…" />
    </transition>
  </a-config-provider>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import enUS from '@arco-design/web-vue/es/locale/lang/en-us';
  import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn';
  import GlobalSetting from '@/components/global-setting/index.vue';
  import GlobalLoading from '@/components/global-loading/index.vue';
  import useLocale from '@/hooks/locale';
  import { useLoadingStore } from '@/store/modules/loading';

  const { currentLocale } = useLocale();
  const locale = computed(() => {
    switch (currentLocale.value) {
      case 'zh-CN':
        return zhCN;
      case 'en-US':
        return enUS;
      default:
        return enUS;
    }
  });
  const loadingStore = useLoadingStore();
</script>

<style scoped lang="less">
  // 全局加载遮罩的淡出（进入动画由组件自身 gl-fade-in 负责）
  .gl-fade-leave-active {
    transition: opacity 180ms ease-in;
    pointer-events: none;
  }

  .gl-fade-leave-to {
    opacity: 0;
  }
</style>

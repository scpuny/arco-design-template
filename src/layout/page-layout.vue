<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="transitionName" mode="out-in" appear>
      <component
        :is="Component"
        v-if="route.meta.ignoreCache"
        :key="route.fullPath"
      />
      <keep-alive v-else :include="cacheList">
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useTabBarStore } from '@/store';
  import { routeAnimationState } from '@/config/route-transition';

  const tabBarStore = useTabBarStore();

  const cacheList = computed(() => tabBarStore.getCacheList);
  // 设置抽屉「页面动画」切换后立即生效；关闭开关用空串关闭过渡
  const transitionName = computed(() =>
    routeAnimationState.enabled ? `route-${routeAnimationState.type}` : ''
  );
</script>

<style scoped lang="less"></style>

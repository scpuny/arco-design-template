<template>
  <div class="tab-bar-container">
    <a-affix ref="affixRef" :offset-top="offsetTop">
      <div class="tab-bar-box">
        <!-- 主控台：固定在最左，不参与翻页 -->
        <div class="tab-fixed">
          <tab-item
            v-if="fixedTag"
            :item-data="fixedTag"
            :index="0"
            :is-fullscreen="isFullscreen"
            @toggle-fullscreen="toggleFullscreen"
          />
        </div>

        <!-- 可翻页区：不压缩、隐藏横向滚动条（可滚轮滚） -->
        <div class="tab-bar-viewport">
          <div ref="scrollerRef" class="tab-viewport-scroll" @scroll="onScroll">
            <div class="tab-viewport-inner">
              <tab-item
                v-for="(tag, i) in scrollTags"
                :key="tag.fullPath"
                :index="i + 1"
                :item-data="tag"
                :is-fullscreen="isFullscreen"
                @toggle-fullscreen="toggleFullscreen"
              />
            </div>
          </div>

          <!-- 工具区：固定在视口右端（flow 内，不覆盖标签）；刷新 + 全屏 + 「更多」 -->
          <div class="tab-tools">
            <a-tooltip position="bottom" :popup-props="{ offset: [0, 4] }">
              <template #content>刷新当前页</template>
              <div
                class="tab-tool"
                :class="{ 'is-disabled': !currentTag }"
                @click="refreshCurrent"
              >
                <icon-refresh />
              </div>
            </a-tooltip>

            <a-tooltip position="bottom" :popup-props="{ offset: [0, 4] }">
              <template #content>{{
                isFullscreen ? '退出全屏' : '进入全屏'
              }}</template>
              <div class="tab-tool" @click="toggleFullscreen">
                <icon-fullscreen-exit v-if="isFullscreen" />
                <icon-fullscreen v-else />
              </div>
            </a-tooltip>

            <!-- 「更多」：仅当有标签滚出可视区时出现，列出被隐藏的标签，点击直接跳转 -->
            <a-dropdown
              v-if="moreHidden.length"
              position="br"
              :popup-props="{ offset: [0, 4] }"
              trigger="click"
              @select="onMoreSelect"
            >
              <div class="tab-tool">
                <icon-more />
              </div>
              <template #content>
                <a-doption
                  v-for="h in moreHidden"
                  :key="h.fullPath"
                  :value="h.fullPath"
                >
                  <component :is="h.icon" v-if="h.icon" class="more-item__icon" />
                  <span>{{ $t(h.title) }}</span>
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
    </a-affix>
  </div>
</template>

<script lang="ts" setup>
  import {
    ref,
    computed,
    watch,
    onMounted,
    onUnmounted,
    nextTick,
    inject,
    type ShallowRef,
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import type { RouteLocationNormalized } from 'vue-router';
  import {
    listenerRouteChange,
    removeRouteListener,
  } from '@/utils/route-listener';
  import { useAppStore, useTabBarStore } from '@/store';
  import type { TagProps } from '@/store/modules/tab-bar/types';
  import { REDIRECT_ROUTE_NAME } from '@/router/constants';
  import tabItem from './tab-item.vue';

  const appStore = useAppStore();
  const tabBarStore = useTabBarStore();
  const route = useRoute();
  const router = useRouter();

  const affixRef = ref();
  const tagList = computed(() => {
    return tabBarStore.getTabList;
  });
  const offsetTop = computed(() => {
    return appStore.navbar ? 60 : 0;
  });

  // 主控台（第一个）固定；其余进视口可翻页
  const fixedTag = computed<TagProps | undefined>(() => tagList.value[0]);
  const scrollTags = computed<TagProps[]>(() => tagList.value.slice(1));

  // 当前路由对应的标签（刷新用）
  const currentTag = computed<TagProps | undefined>(() =>
    tagList.value.find((t) => t.fullPath === route.fullPath)
  );

  // 「更多」下拉：当前滚出可视区的隐藏标签
  const moreHidden = ref<TagProps[]>([]);

  // ---- 视口滚动 + 隐藏项几何（.tab-viewport-scroll）----
  const scrollerRef = ref<HTMLElement>();

  function computeHidden() {
    const s = scrollerRef.value;
    if (!s) {
      moreHidden.value = [];
      return;
    }
    const sr = s.getBoundingClientRect();
    const els = s.querySelectorAll('.tab-viewport-inner .arco-tag');
    const out: TagProps[] = [];
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      // 完全滚出右/左侧（与可视窗口不相交）即视为「隐藏」
      const offRight = r.left >= sr.right - 2;
      const offLeft = r.right <= sr.left + 2;
      if (offRight || offLeft) out.push(scrollTags.value[i]);
    });
    moreHidden.value = out;
  }

  function onScroll() {
    computeHidden();
  }

  // 激活的 tab 滚入视野（居中）
  async function revealActive() {
    const v = scrollerRef.value;
    if (!v) return;
    const active = v.querySelector('.link-activated');
    if (active) {
      const vr = v.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      const rel = ar.left - vr.left;
      if (rel < 0 || rel + ar.width > v.clientWidth) {
        v.scrollBy({ left: rel - v.clientWidth / 2, behavior: 'smooth' });
      }
    }
    await nextTick();
    computeHidden();
  }

  // 刷新当前页（同 tab-item 的重新加载：清缓存 → 走 Redirect → 补缓存）
  async function refreshCurrent() {
    if (!currentTag.value) return;
    const tag = currentTag.value;
    tabBarStore.deleteCache(tag);
    await router.push({
      name: REDIRECT_ROUTE_NAME,
      params: { path: route.fullPath },
    } as never);
    tabBarStore.addCache(tag.name);
    await revealActive();
  }

  // 全屏切换：全屏「当前激活 tab 的内容区」（元素级），而非整张文档
  const layoutContentRef = inject<ShallowRef<HTMLElement | null>>(
    'layoutContentRef'
  );
  const isFullscreen = ref(false);
  function syncFullscreen() {
    // 图标态跟随「是否处于（内容区）全屏」
    isFullscreen.value = !!document.fullscreenElement;
  }
  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    // 取布局提供的内容区元素，做元素级全屏；浏览器会自动铺满视口并隐藏
    // 侧栏/顶栏/tab 条。拿不到（异常布局）则回退为整页全屏。
    const el = layoutContentRef?.value as HTMLElement | undefined;
    try {
      if (el) await el.requestFullscreen?.();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* 某些环境不支持全屏则忽略 */
    }
    syncFullscreen();
  }

  // 「更多」下拉：点某个被隐藏的标签 → 跳转 + 让它滚回视野
  async function onMoreSelect(
    value: string | number | Record<string, any> | undefined
  ) {
    const fullPath = typeof value === 'string' ? value : undefined;
    const tag = scrollTags.value.find((t) => t.fullPath === fullPath);
    if (!tag) return;
    await router.push({ name: tag.name, fullPath: tag.fullPath } as never);
    await revealActive();
  }

  let onResize = () => computeHidden();
  onMounted(() => {
    computeHidden();
    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    window.addEventListener('resize', onResize);
  });

  watch(scrollTags, async () => {
    await nextTick();
    computeHidden();
  });

  watch(
    () => route.fullPath,
    async () => {
      await nextTick();
      revealActive();
    }
  );

  watch(
    () => appStore.navbar,
    () => {
      affixRef.value.updatePosition();
    }
  );
  listenerRouteChange((r: RouteLocationNormalized) => {
    if (
      !r.meta.noAffix &&
      !tagList.value.some((tag) => tag.fullPath === r.fullPath)
    ) {
      tabBarStore.updateTabList(r);
    }
  }, true);

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', syncFullscreen);
    window.removeEventListener('resize', onResize);
    removeRouteListener();
  });
</script>

<style scoped lang="less">
  .tab-bar-container {
    position: relative;
    background-color: var(--color-bg-1);
    .tab-bar-box {
      display: flex;
      align-items: stretch;
      height: 40px;
      background-color: var(--color-bg-3);
      border-bottom: 1px solid var(--color-border-2);

      // 主控台固定区：不缩、不随滚动移动
      .tab-fixed {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        padding: 0 4px 0 16px;

        // 主控台不可关，隐藏其关闭按钮
        :deep(.arco-tag-close-btn) {
          display: none;
        }
      }

      // 可翻页视口：标签可滚（隐藏滚动条），右侧工具区固定不覆盖
      .tab-bar-viewport {
        display: flex;
        align-items: stretch;
        flex: 1;
        min-width: 0;
        height: 40px;

        // 真正横向滚动的层：隐藏横向滚动条（可滚轮滚），溢出交给「更多」
        .tab-viewport-scroll {
          flex: 1;
          min-width: 0;
          height: 40px;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            display: none;
          }
          .tab-viewport-inner {
            display: inline-flex;
            align-items: center;
            height: 40px;
            white-space: nowrap;
          }
        }

        // 工具区：固定宽度、左边界线分隔，按钮 hover 有底色反馈
        .tab-tools {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          gap: 2px;
          padding: 0 8px;
          height: 40px;
          border-left: 1px solid var(--color-border-2);

          .tab-tool {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            color: var(--color-text-2);
            font-size: 15px;
            cursor: pointer;
            transition:
              background 0.15s ease,
              color 0.15s ease;

            &:hover {
              background: var(--color-fill-2);
              color: rgb(var(--primary-6));
            }

            &.is-disabled {
              color: var(--color-text-4);
              cursor: not-allowed;
              &:hover {
                background: transparent;
                color: var(--color-text-4);
              }
            }
          }
        }
      }

      // 统一页签样式（主控台 + 视口内共用）：不压缩、浏览器标签页风格
      :deep(.arco-tag) {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
        height: 34px;
        margin: 0 2px;
        padding: 0 12px;
        cursor: pointer;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--color-text-2);
        font-size: 13px;

        // 激活页签：蓝色文字 + 图标 + 底部 2px 强调线
        &.link-activated {
          background: rgb(var(--primary-1));
          border-color: rgb(var(--primary-2));
          color: rgb(var(--primary-6));
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            left: 8px;
            right: 8px;
            bottom: -7px;
            height: 2px;
            border-radius: 2px;
            background: rgb(var(--primary-6));
          }

          .tag-link {
            color: rgb(var(--primary-6));
          }

          .arco-tag-close-btn {
            color: rgb(var(--primary-6));
          }
        }

        &:hover:not(.link-activated) {
          background: var(--color-fill-2);
        }
      }
    }
  }

  // 「更多」下拉里每项的图标与文字对齐
  :deep(.arco-dropdown-menu .arco-dropdown-option-content) {
    display: flex;
    align-items: center;
    gap: 8px;

    > span:last-child {
      margin-left: 0;
    }
  }
</style>

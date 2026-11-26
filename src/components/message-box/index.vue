<template>
  <div class="msg-box">
    <!-- 头部：标题 + 未读数 + 全部已读 -->
    <div class="mb-head">
      <div class="mb-head__title">
        消息通知
        <span v-if="unread" class="mb-head__count">{{ unread > 99 ? '99+' : unread }}</span>
      </div>
      <a-button
        class="mb-head__readall"
        type="text"
        size="mini"
        :disabled="!unread"
        @click="readAll"
      >
        <template #icon><icon-check-circle /></template>
        全部已读
      </a-button>
    </div>

    <!-- 分类页签：由后端聚合结果动态生成，不写死分类清单 -->
    <div class="mb-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="mb-tab"
        :class="{ 'is-active': activeCategory === t.key }"
        @click="switchCategory(t.key)"
      >
        <span class="mb-tab__label">{{ t.label }}</span>
        <span v-if="t.count" class="mb-tab__count">{{ t.count }}</span>
      </button>
    </div>

    <a-spin :loading="loading" class="mb-list">
      <div v-if="!list.length" class="mb-empty">
        <icon-notification class="mb-empty__icon" />
        <div class="mb-empty__text">暂无未读消息</div>
        <div class="mb-empty__hint">
          {{
            activeCategory === 'all'
              ? '有新的审批与提醒时会出现在这里；已读消息请到消息中心查看'
              : '该分类下暂无未读消息'
          }}
        </div>
      </div>

      <div
        v-for="m in list"
        :key="m.id"
        class="mb-item"
        :class="{ 'is-unread': !m.read }"
        :title="m.link ? '点击前往处理' : m.read ? '' : '点击标记为已读'"
        @click="openMessage(m)"
      >
        <div
          class="mb-item__icon"
          :style="{ color: catMeta(m.category).color, background: catMeta(m.category).bg }"
        >
          <component :is="catMeta(m.category).icon" />
          <i v-if="!m.read" class="mb-item__dot" />
        </div>

        <div class="mb-item__body">
          <div class="mb-item__top">
            <span class="mb-item__title">{{ m.title }}</span>
            <span class="mb-item__time">{{ relTime(m.createdAt) }}</span>
          </div>
          <div class="mb-item__content">{{ m.content }}</div>
          <div class="mb-item__foot">
            <span class="mb-item__cat">{{ catMeta(m.category).label }}</span>
            <span
              v-if="m.priority === 'HIGH' || m.priority === 'URGENT'"
              class="mb-item__urgent"
            >
              紧急
            </span>
            <span v-if="m.link" class="mb-item__go">去处理</span>
          </div>
        </div>
      </div>
    </a-spin>

    <div class="mb-footer">
      <a class="mb-footer__link" @click="openCenter">查看全部消息（含已读）</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import { IconCheckCircle, IconNotification } from '@arco-design/web-vue/es/icon';
  import {
    queryMessagePage,
    markRead,
    markReadAll,
    getMessageCategories,
    MessageItem,
  } from '@/api/message';
  import { useMessageUnread } from '@/hooks/useMessageUnread';
  import { catMeta, relTime } from './meta';

  const router = useRouter();
  const emit = defineEmits<{ (e: 'navigate'): void }>();
  const { unread, refresh } = useMessageUnread();
  const activeCategory = ref('all');
  const list = ref<MessageItem[]>([]);
  const loading = ref(false);
  /** 分类聚合：[{ category, total, unread }]，后端只返回有消息的分类 */
  const stats = ref<{ category: string; total: number; unread: number }[]>([]);

  /**
   * 页签：全部 + 后端返回的真实分类。
   *
   * <p>以前这里写死 four 个分类（all/检定到期/审批/系统），业务域自定义的
   * 固定的分类码在一个系统里未必存在，所以改成数据反推。
   */
  /**
   * 顶栏消息盒只做「待办提醒」，默认只展示未读；已读归档统一到消息中心看。
   * 因此页签上的数字也必须是未读数，不能再用 total，否则点了「审批 12」只出来 1 条。
   */
  const tabs = computed(() => {
    const unreadTotal = stats.value.reduce((s, x) => s + x.unread, 0);
    return [
      { key: 'all', label: '全部', count: unreadTotal },
      ...stats.value.map((x) => ({
        key: x.category,
        label: catMeta(x.category).label,
        count: x.unread,
      })),
    ];
  });

  async function load() {
    loading.value = true;
    try {
      const { data } = await queryMessagePage({
        channel: 'IN_APP',
        category: activeCategory.value,
        read: false,
        page: 0,
        size: 50,
      });
      list.value = data.content || [];
    } catch {
      list.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function loadStats() {
    try {
      const { data } = await getMessageCategories('IN_APP');
      stats.value = data || [];
    } catch {
      stats.value = [];
    }
  }

  async function loadUnread() {
    await refresh('IN_APP');
  }

  function switchCategory(key: string) {
    if (activeCategory.value === key) return;
    activeCategory.value = key;
    load();
  }

  /** 消息要么能去处理，要么只是标记已读；link 由后端下发，只接受站内路径。 */
  function openMessage(m: MessageItem) {
    void readOne(m);
    const to = m.link;
    if (!to || !to.startsWith('/')) return;
    emit('navigate');
    router.push(to);
  }

  async function readOne(m: MessageItem) {
    if (m.read) return;
    try {
      const { data } = await markRead([m.id]);
      // 列表只放未读：读过就立刻从浮层移除，而不是留在原地变灰
      list.value = list.value.filter((x) => x.id !== m.id);
      if (data?.count) {
        unread.value = Math.max(0, unread.value - data.count);
      }
      // 页签上的未读数同步掉，否则「已读完页签还挂着数字」
      loadStats();
    } catch {
      /* 忽略 */
    }
  }

  async function readAll() {
    try {
      const { data } = await markReadAll('IN_APP');
      Message.success(`已读 ${data?.count ?? 0} 条`);
      list.value = [];
      loadUnread();
      loadStats();
    } catch {
      /* 忽略 */
    }
  }

  function openCenter() {
    router.push('/dashboard/console');
  }

  onMounted(() => {
    load();
    loadStats();
    loadUnread();
  });
</script>

<style scoped lang="less">
  .msg-box {
    width: 400px;
    max-width: 92vw;
    /* 向下弹出时不能超出视口，否则 Arco 自动翻回 top 又会被顶栏裁掉 */
    max-height: ~'min(560px, calc(100vh - 96px))';
    display: flex;
    flex-direction: column;
    background: var(--color-bg-popup);
  }

  /* ── 头部 ── */
  .mb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 8px;

    &__title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-1);
    }

    &__count {
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: rgb(var(--danger-6));
      color: #fff;
      font-size: 11px;
      font-weight: 500;
      line-height: 18px;
      text-align: center;
    }

    &__readall {
      color: var(--color-text-3);
      font-size: 12px;

      &:not(.arco-btn-disabled):hover {
        color: rgb(var(--primary-6));
      }
    }
  }

  /* ── 分类页签 ── */
  .mb-tabs {
    display: flex;
    gap: 6px;
    padding: 0 14px 10px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .mb-tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 13px;
    background: var(--color-fill-2);
    color: var(--color-text-2);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.16s;
    white-space: nowrap;

    &:hover {
      background: var(--color-fill-3);
      color: var(--color-text-1);
    }

    &.is-active {
      background: rgb(var(--primary-6));
      color: #fff;

      .mb-tab__count {
        background: rgba(255, 255, 255, 0.28);
        color: #fff;
      }
    }

    &__count {
      min-width: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: var(--color-fill-3);
      color: var(--color-text-3);
      font-size: 10px;
      line-height: 15px;
      text-align: center;
    }
  }

  /* ── 列表 ── */
  .mb-list {
    flex: 1;
    min-height: 120px;
    overflow-y: auto;
    /* 卡片有底色，四周留白 + 卡片间距，避免连成一整块 */
    padding: 10px 14px 12px;
    border-top: 1px solid var(--color-border-1);
  }

  .mb-item {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    padding: 12px 10px;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.16s, border-color 0.16s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: var(--color-fill-2);
    }

    /* 未读：极淡铺一层主色 + 标题加粗，不再用整块蓝底抢视觉 */
    &.is-unread {
      background: rgba(var(--primary-1), 0.55);
      border-color: rgba(var(--primary-6), 0.1);

      &:hover {
        background: rgba(var(--primary-1), 0.85);
        border-color: rgba(var(--primary-6), 0.2);
      }

      .mb-item__title {
        font-weight: 600;
        color: var(--color-text-1);
      }
    }

    &__icon {
      position: relative;
      flex: 0 0 auto;
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    &__dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgb(var(--danger-6));
      border: 1.5px solid var(--color-bg-popup);
    }

    &__body {
      flex: 1;
      min-width: 0;
    }

    &__top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    &__title {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__time {
      flex: 0 0 auto;
      font-size: 11px;
      color: var(--color-text-4);
    }

    &__content {
      margin-top: 3px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--color-text-3);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &__foot {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 5px;
    }

    &__cat {
      font-size: 11px;
      color: var(--color-text-4);
    }

    &__urgent {
      font-size: 11px;
      padding: 0 5px;
      border-radius: 3px;
      color: rgb(var(--danger-6));
      background: rgb(var(--danger-1));
    }

    &__go {
      margin-left: auto;
      font-size: 11px;
      color: rgb(var(--primary-6));
    }
  }

  /* ── 空态 / 底部 ── */
  .mb-empty {
    padding: 48px 0 40px;
    text-align: center;

    &__icon {
      font-size: 30px;
      color: var(--color-text-4);
    }

    &__text {
      margin-top: 10px;
      font-size: 13px;
      color: var(--color-text-2);
    }

    &__hint {
      margin-top: 4px;
      font-size: 12px;
      color: var(--color-text-4);
    }
  }

  .mb-footer {
    flex: 0 0 auto;
    padding: 8px 14px;
    border-top: 1px solid var(--color-border-1);
    text-align: center;

    &__link {
      font-size: 12px;
      color: var(--color-text-3);
      cursor: pointer;

      &:hover {
        color: rgb(var(--primary-6));
      }
    }
  }
</style>

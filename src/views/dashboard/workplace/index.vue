<template>
  <div class="workplace" v-loading="loading">
    <!-- 问候横幅 -->
    <section class="wp-greeting" :style="{ background: `linear-gradient(120deg, ${greeting.from}, ${greeting.to})` }">
      <div class="wp-greeting__left">
        <a-avatar :size="52" :style="{ background: 'rgba(255,255,255,.9)', color: greeting.from, fontSize: '22px', fontWeight: '600' }">
          {{ userInitial }}
        </a-avatar>
        <div class="wp-greeting__text">
          <h1 class="wp-greeting__title">{{ greeting.hello }}，{{ userName }}</h1>
          <p class="wp-greeting__sub">
            {{ todayText }}
            <a-space :size="6" class="wp-greeting__weather">
              <component :is="weather.icon" class="wp-greeting__weather-icon" />
              <span>{{ weather.city }} {{ weather.temperature }} {{ weather.text }}</span>
            </a-space>
          </p>
        </div>
      </div>
      <div class="wp-greeting__stats">
        <div class="wp-stat" v-for="s in statItems" :key="s.label">
          <div class="wp-stat__value">{{ s.value }}</div>
          <div class="wp-stat__label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <a-row :gutter="16">
      <!-- 项目卡片 -->
      <a-col :xs="24" :md="12" :xl="6" v-for="p in projects" :key="p.id" class="wp-col">
        <a-card class="wp-project" :bordered="false">
          <div class="wp-project__head">
            <span class="wp-project__icon" :style="{ background: p.color }">
              <component :is="p.icon" />
            </span>
            <a-tag :color="statusColor(p.status)" size="small">{{ p.status }}</a-tag>
          </div>
          <div class="wp-project__name">{{ p.name }}</div>
          <div class="wp-project__desc">{{ p.desc }}</div>
          <div class="wp-project__foot">
            <a-progress :percent="p.progress" size="small" :show-text="false" :stroke="{ color: p.color }" style="flex: 1" />
            <span class="wp-project__percent">{{ p.progress }}%</span>
          </div>
          <div class="wp-project__meta">{{ p.creator }} · {{ p.createdAt }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" class="wp-lower">
      <!-- 最近动态 -->
      <a-col :xs="24" :xl="14" class="wp-col">
        <a-card title="最近动态" :bordered="false" class="wp-card-fill">
          <a-timeline>
            <a-timeline-item v-for="a in activities" :key="a.id">
              <div class="wp-activity">
                <a-avatar :size="28" :style="{ background: a.userColor, fontSize: '12px' }">
                  {{ a.user.slice(0, 1) }}
                </a-avatar>
                <div class="wp-activity__main">
                  <span class="wp-activity__user">{{ a.user }}</span>
                  <span class="wp-activity__action">{{ a.action }}</span>
                  <span class="wp-activity__target">{{ a.target }}</span>
                </div>
                <span class="wp-activity__time">{{ a.time }}</span>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>

      <!-- 快捷入口 -->
      <a-col :xs="24" :xl="10" class="wp-col">
        <a-card title="快捷入口" :bordered="false" class="wp-card-fill">
          <div class="wp-shortcuts">
            <a-card class="wp-shortcut" :bordered="false" v-for="s in shortcuts" :key="s.id"
              @click="s.path && $router.push(s.path)">
              <div class="wp-shortcut__inner">
                <span class="wp-shortcut__icon" :style="{ background: s.color }">
                  <component :is="s.icon" />
                </span>
                <span class="wp-shortcut__name">{{ s.name }}</span>
              </div>
            </a-card>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { getWorkplace, type WorkplaceData } from '@/api/dashboard';
  import useUserStore from '@/store/modules/user';

  const userStore = useUserStore();

  const loading = ref(false);
  const data = ref<WorkplaceData | null>(null);

  const projects = computed(() => data.value?.projects ?? []);
  const activities = computed(() => data.value?.activities ?? []);
  const shortcuts = computed(() => data.value?.shortcuts ?? []);
  const weather = computed(() => data.value?.weather ?? { text: '', temperature: '', icon: '', city: '' });
  const summary = computed(() => data.value?.summary ?? { projects: 0, todos: 0, messages: 0 });

  const userName = computed(() => userStore.name || '演示用户');
  const userInitial = computed(() => userName.value.slice(0, 1).toUpperCase());

  const todayText = computed(() =>
    new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date()),
  );

  const statItems = computed(() => [
    { label: '项目', value: summary.value.projects },
    { label: '待办', value: summary.value.todos },
    { label: '消息', value: summary.value.messages },
  ]);

  const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { hello: '早上好', from: '#339af5', to: '#4361ee' };
    if (hour >= 12 && hour < 18) return { hello: '下午好', from: '#00b42a', to: '#12c97a' };
    if (hour >= 18 && hour < 23) return { hello: '晚上好', from: '#ff7d00', to: '#f53f3f' };
    return { hello: '深夜了', from: '#722ed1', to: '#9254de' };
  });

  function statusColor(status: string) {
    if (status === '进行中') return 'arcoblue';
    if (status === '待启动') return 'orange';
    return 'green';
  }

  onMounted(async () => {
    loading.value = true;
    try {
      const res = await getWorkplace();
      data.value = res.data;
    } finally {
      loading.value = false;
    }
  });
</script>

<style scoped lang="less">
  .wp-col {
    display: flex;

    & > .arco-card {
      flex: 1;
    }
  }

  .wp-greeting {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 26px 28px;
    margin-bottom: 16px;
    border-radius: 12px;
    color: #fff;
  }

  .wp-greeting__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .wp-greeting__title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }

  .wp-greeting__sub {
    margin: 8px 0 0;
    opacity: 0.85;
    font-size: 13px;
  }

  .wp-greeting__weather-icon {
    color: #fff;
    font-size: 14px;
  }

  .wp-greeting__stats {
    display: flex;
    gap: 36px;
  }

  .wp-stat {
    text-align: center;

    &__value {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
    }

    &__label {
      margin-top: 8px;
      opacity: 0.85;
      font-size: 12px;
    }
  }

  .wp-project {
    height: 100%;

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__icon {
      display: inline-flex;
      width: 34px;
      height: 34px;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: #fff;
      font-size: 17px;
    }

    &__name {
      margin-top: 14px;
      color: var(--color-text-1);
      font-size: 15px;
      font-weight: 600;
    }

    &__desc {
      margin-top: 4px;
      overflow: hidden;
      color: var(--color-text-3);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__foot {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
    }

    &__percent {
      min-width: 34px;
      color: var(--color-text-2);
      font-size: 12px;
      text-align: right;
    }

    &__meta {
      margin-top: 10px;
      color: var(--color-text-3);
      font-size: 11px;
    }
  }

  .wp-lower {
    margin-top: 16px;
    align-items: stretch;
  }

  .wp-card-fill {
    height: 100%;
  }

  .wp-activity {
    display: flex;
    align-items: center;
    gap: 10px;

    &__main {
      flex: 1;
      min-width: 0;
      font-size: 13px;

      & > span {
        display: inline;
      }
    }

    &__user {
      color: var(--color-text-1);
      font-weight: 500;
    }

    &__action {
      margin: 0 2px;
      color: var(--color-text-2);
    }

    &__target {
      color: rgb(var(--primary-6));
    }

    &__time {
      flex-shrink: 0;
      color: var(--color-text-3);
      font-size: 12px;
    }
  }

  .wp-shortcuts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .wp-shortcut {
    cursor: pointer;
    text-align: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }

    &__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
    }

    &__icon {
      display: inline-flex;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: #fff;
      font-size: 20px;
    }

    &__name {
      color: var(--color-text-1);
      font-size: 12px;
    }
  }
</style>

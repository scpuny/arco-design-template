<template>
  <div class="monitor" v-loading="loading">
    <!-- 基本信息 -->
    <a-card title="服务器信息" :bordered="false" class="mt-card">
      <a-descriptions :column="3" :data="serverInfo" />
    </a-card>

    <!-- 资源用量 -->
    <a-row :gutter="16" class="mt-row">
      <a-col :xs="24" :md="8" class="mt-col">
        <a-card title="CPU" :bordered="false" class="mt-card-fill">
          <div class="mt-meter">
            <a-progress
              :percent="monitor?.cpu.usage ?? 0"
              type="circle"
              :width="112"
              :stroke-width="10"
              :show-text="false"
              :color="usageColor(monitor?.cpu.usage ?? 0)"
            />
            <div class="mt-meter__center">{{ monitor?.cpu.usage ?? 0 }}%</div>
          </div>
          <a-space direction="vertical" :size="4" class="mt-meta">
            <a-space>
              <a-tag size="small">在线核心</a-tag>
              <span>{{ monitor?.cpu.online }} / {{ monitor?.cpu.cores }}</span>
            </a-space>
            <a-space>
              <a-tag size="small">系统 / 用户</a-tag>
              <span>{{ monitor?.cpu.system }}% / {{ monitor?.cpu.user }}%</span>
            </a-space>
            <a-space>
              <a-tag size="small">负载</a-tag>
              <span>{{ monitor?.load.join(' / ') }}</span>
            </a-space>
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8" class="mt-col">
        <a-card title="内存" :bordered="false" class="mt-card-fill">
          <div class="mt-meter">
            <a-progress
              :percent="monitor?.memory.usage ?? 0"
              type="circle"
              :width="112"
              :stroke-width="10"
              :show-text="false"
              :color="usageColor(monitor?.memory.usage ?? 0)"
            />
            <div class="mt-meter__center">{{ monitor?.memory.usage ?? 0 }}%</div>
          </div>
          <a-space direction="vertical" :size="4" class="mt-meta">
            <a-space>
              <a-tag size="small">已用</a-tag>
              <span>{{ monitor?.memory.used }} / {{ monitor?.memory.total }} GB</span>
            </a-space>
            <a-space>
              <a-tag size="small">空闲</a-tag>
              <span>{{ monitor?.memory.free }} GB</span>
            </a-space>
            <a-space>
              <a-tag size="small">Swap</a-tag>
              <span>{{ monitor?.swap.usage }}%</span>
            </a-space>
          </a-space>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8" class="mt-col">
        <a-card title="磁盘" :bordered="false" class="mt-card-fill">
          <div v-for="d in monitor?.disks ?? []" :key="d.name" class="mt-disk">
            <div class="mt-disk__line">
              <span class="mt-disk__name">{{ d.name }}</span>
              <span class="mt-disk__usage">{{ d.used }} / {{ d.total }} GB · {{ d.usage }}%</span>
            </div>
            <a-progress
              :percent="d.usage"
              size="small"
              :show-text="false"
              :color="usageColor(d.usage)"
            />
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 进程 -->
    <a-card title="进程监控" :bordered="false" class="mt-row">
      <a-table :data="monitor?.processes ?? []" :pagination="false" row-key="pid">
        <template #columns>
          <a-table-column title="PID" data-index="pid" :width="90" align="center" />
          <a-table-column title="进程" data-index="name" :width="220" />
          <a-table-column title="用户" data-index="user" :width="110" align="center" />
          <a-table-column title="CPU" :width="130">
            <template #cell="{ record }">
              <a-space>
                <span>{{ record.cpu }}%</span>
                <a-progress
                  :percent="Math.min(record.cpu * 2, 100)"
                  size="small"
                  :show-text="false"
                  :color="record.cpu > 20 ? 'rgb(var(--orange-6))' : 'rgb(var(--primary-6))'"
                  style="width: 70px"
                />
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="内存" :width="130">
            <template #cell="{ record }">
              <a-space>
                <span>{{ record.mem }}%</span>
                <a-progress
                  :percent="Math.min(record.mem * 2, 100)"
                  size="small"
                  :show-text="false"
                  :color="record.mem > 20 ? 'rgb(var(--orange-6))' : 'rgb(var(--green-6))'"
                  style="width: 70px"
                />
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="启动于" data-index="startedAt" :width="110" align="center" />
          <a-table-column title="状态" :width="100" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === '运行中' ? 'green' : 'red'">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { getMonitor, type MonitorServer } from '@/api/monitor';

  const monitor = ref<MonitorServer | null>(null);
  const loading = ref(false);

  const serverInfo = computed(() => {
    const m = monitor.value;
    if (!m) return [];
    return [
      { label: '主机名', value: m.host },
      { label: 'IP 地址', value: m.ip },
      { label: '操作系统', value: m.os },
      { label: '架构', value: m.arch },
      { label: 'JDK 版本', value: m.java },
      { label: '运行时长', value: m.uptime },
    ];
  });

  /** 用量颜色：<70 正常，70~90 警告，>=90 危险 */
  function usageColor(usage: number) {
    if (usage >= 90) return 'rgb(var(--red-6))';
    if (usage >= 70) return 'rgb(var(--orange-6))';
    return 'rgb(var(--green-6))';
  }

  onMounted(async () => {
    loading.value = true;
    try {
      monitor.value = await getMonitor();
    } finally {
      loading.value = false;
    }
  });
</script>

<style scoped lang="less">
  .mt-row {
    margin-top: 16px;
  }

  .mt-col {
    display: flex;

    & > .arco-card {
      flex: 1;
    }
  }

  .mt-card-fill {
    width: 100%;
  }

  .mt-meter {
    position: relative;
    width: 112px;
    height: 112px;
    margin: 0 auto 16px;

    &__center {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }

  .mt-meta {
    width: 100%;
    font-size: 13px;
    color: var(--color-text-2);
  }

  .mt-disk {
    & + & {
      margin-top: 14px;
    }

    &__line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }

    &__name {
      color: var(--color-text-1);
      font-weight: 500;
    }

    &__usage {
      color: var(--color-text-3);
      font-size: 12px;
    }
  }
</style>

<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.system.logs') }}
    </a-typography-title>

    <a-card :bordered="false">
      <!-- 筛选区 -->
      <a-form :model="query" layout="inline" class="log-filter">
        <a-form-item label="模块">
          <a-select v-model="query.module" :options="moduleOptions" style="width: 150px" allow-clear placeholder="全部" />
        </a-form-item>
        <a-form-item label="级别">
          <a-select v-model="query.level" :options="levelOptions" style="width: 120px" allow-clear placeholder="全部" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model="query.status" :options="statusOptions" style="width: 120px" allow-clear placeholder="全部" />
        </a-form-item>
        <a-form-item label="关键词">
          <a-input v-model="query.keyword" placeholder="操作人 / 操作 / 详情" style="width: 200px" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="load()">
              <template #icon><icon-search /></template>查询
            </a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        :data="rows"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        :row-class="rowClass"
      >
        <template #columns>
          <a-table-column title="时间" data-index="time" :width="170" />
          <a-table-column title="模块" data-index="module" :width="110" />
          <a-table-column title="操作" data-index="operation" :width="140" />
          <a-table-column title="操作人" data-index="operator" :width="100" align="center" />
          <a-table-column title="级别" :width="90" align="center">
            <template #cell="{ record }">
              <a-tag :color="levelColor(record.level)" size="small">{{ record.level }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.status === '成功' ? 'green' : 'red'">{{ record.status }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="耗时" :width="90" align="center">
            <template #cell="{ record }">{{ record.cost }} ms</template>
          </a-table-column>
          <a-table-column title="操作" :width="80" align="center" fixed="right">
            <template #cell="{ record }">
              <a-link @click="openDetail(record)">详情</a-link>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 详情抽屉 -->
    <a-drawer :visible="detailVisible" :width="440" @cancel="detailVisible = false">
      <template #title>日志详情</template>
      <div v-if="current">
        <a-descriptions :column="1" :data="detailData" class="log-detail" />
        <a-divider />
        <a-alert type="info" :bordered="false">
          <template #title>请求方法</template>
          <code class="log-method">{{ current.method }}</code>
        </a-alert>
        <div class="log-detail__note">
          <a-typography-title :heading="6">说明</a-typography-title>
          <a-typography text>{{ current.detail }}</a-typography>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { getLogs, type OperationLog } from '@/api/log';

  const loading = ref(false);
  const rows = ref<OperationLog[]>([]);
  const current = ref<OperationLog | null>(null);
  const detailVisible = ref(false);

  const query = reactive({
    module: undefined as string | undefined,
    level: undefined as 'INFO' | 'WARN' | 'ERROR' | undefined,
    status: undefined as '成功' | '失败' | undefined,
    keyword: '',
  });

  const moduleOptions = computed(() => {
    const set = new Set(rows.value.map((r) => r.module));
    return ['全部', ...set].map((m) => ({ label: m === '全部' ? '全部' : m, value: m === '全部' ? 'all' : m }));
  });
  const levelOptions = [
    { label: 'INFO', value: 'INFO' },
    { label: 'WARN', value: 'WARN' },
    { label: 'ERROR', value: 'ERROR' },
  ];
  const statusOptions = [
    { label: '成功', value: '成功' },
    { label: '失败', value: '失败' },
  ];

  const detailData = computed(() => {
    if (!current.value) return [];
    const c = current.value;
    return [
      { label: '时间', value: c.time },
      { label: '模块', value: c.module },
      { label: '操作', value: c.operation },
      { label: '操作人', value: c.operator },
      { label: 'IP 地址', value: c.ip },
      { label: '耗时', value: `${c.cost} ms` },
      { label: '级别', value: c.level },
      { label: '状态', value: c.status },
    ];
  });

  async function load() {
    loading.value = true;
    try {
      const res = await getLogs({
        module: query.module,
        level: query.level,
        status: query.status,
        keyword: query.keyword,
      });
      rows.value = res.content;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    query.module = undefined;
    query.level = undefined;
    query.status = undefined;
    query.keyword = '';
    load();
  }

  function openDetail(record: OperationLog) {
    current.value = record;
    detailVisible.value = true;
  }

  function rowClass(record: OperationLog) {
    return record.level === 'ERROR' && record.status === '失败' ? 'log-row--error' : '';
  }

  function levelColor(level: OperationLog['level']) {
    if (level === 'ERROR') return 'red';
    if (level === 'WARN') return 'orange';
    return 'green';
  }

  onMounted(load);
</script>

<style scoped lang="less">
  .log-filter {
    margin-bottom: 12px;
  }

  .log-row--error {
    background: rgba(245, 63, 63, 0.04);
  }

  .log-detail {
    :deep(.arco-descriptions-item-label) {
      min-width: 64px;
      color: var(--color-text-3);
    }
  }

  .log-detail__note {
    code.log-method {
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--color-fill-2);
      font-size: 12px;
      color: var(--color-text-1);
    }
  }
</style>

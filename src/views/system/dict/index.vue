<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.system.dict') }}
    </a-typography-title>
    <CrudTable
      endpoint="/api/system/dicts"
      :columns="columns"
      :fields="fields"
      :search-placeholder="$t('system.common.searchPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
  import CrudTable from '@/components/crud-table/index.vue';
  import type { CrudColumn, CrudField } from '@/components/crud-table/index.vue';

  const columns: CrudColumn[] = [
    { title: '字典编码', dataIndex: 'code', width: 180 },
    { title: '字典名称', dataIndex: 'name', width: 140 },
    { title: '项编码', dataIndex: 'itemCode', width: 140 },
    { title: '项名称', dataIndex: 'itemLabel', width: 120 },
    { title: '排序', dataIndex: 'sort', width: 90, align: 'center' },
    { title: '状态', dataIndex: 'enabled', width: 100, tag: true, align: 'center' },
  ];
  const fields: CrudField[] = [
    { key: 'code', label: '字典编码', required: true },
    { key: 'name', label: '字典名称', required: true },
    { key: 'itemCode', label: '项编码', required: true },
    { key: 'itemLabel', label: '项名称', required: true },
    { key: 'sort', label: '排序', type: 'number' },
    { key: 'enabled', label: '启用', type: 'switch' },
  ];
</script>

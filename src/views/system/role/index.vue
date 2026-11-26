<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.system.role') }}
    </a-typography-title>
    <CrudTable
      endpoint="/api/system/roles"
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
    { title: '角色名称', dataIndex: 'name', width: 150 },
    { title: '角色编码', dataIndex: 'code', width: 160 },
    { title: '描述', dataIndex: 'description' },
    { title: '状态', dataIndex: 'status', width: 100, tag: true, align: 'center' },
    { title: '更新时间', dataIndex: 'updatedAt', width: 120, align: 'center' },
  ];
  const fields: CrudField[] = [
    { key: 'name', label: '角色名称', required: true },
    { key: 'code', label: '角色编码', required: true },
    { key: 'description', label: '描述', type: 'textarea' },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] },
  ];
</script>

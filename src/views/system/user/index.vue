<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.system.user') }}
    </a-typography-title>
    <CrudTable
      endpoint="/api/system/users"
      :columns="columns"
      :fields="fields"
      :search-placeholder="$t('system.user.searchPlaceholder')"
    />
  </div>
</template>

<script setup lang="ts">
  import CrudTable from '@/components/crud-table/index.vue';
  import type { CrudColumn, CrudField } from '@/components/crud-table/index.vue';
  const columns: CrudColumn[] = [
    { title: '用户名', dataIndex: 'username', width: 130 },
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 190 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    { title: '角色', dataIndex: 'role', width: 130 },
    { title: '状态', dataIndex: 'status', width: 100, tag: true, align: 'center' },
    { title: '创建日期', dataIndex: 'createdAt', width: 120, align: 'center' },
  ];
  const fields: CrudField[] = [
    { key: 'username', label: '用户名', required: true },
    { key: 'name', label: '姓名', required: true },
    { key: 'email', label: '邮箱', required: true },
    { key: 'phone', label: '手机号' },
    { key: 'role', label: '角色', type: 'select', options: ['超级管理员', '系统管理员', '审计员', '普通用户'], required: true },
    { key: 'status', label: '状态', type: 'select', options: ['启用', '停用'] },
  ];
</script>

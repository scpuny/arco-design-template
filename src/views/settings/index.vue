<template>
  <div>
    <a-typography-title :heading="5" style="margin: 0 0 16px">
      {{ $t('menu.settings') }}
    </a-typography-title>
    <a-card :bordered="false" :loading="loading">
      <a-form :model="form" layout="vertical" style="max-width: 640px">
        <a-form-item field="siteName" :label="$t('settings.siteName')">
          <a-input v-model="form.siteName" />
        </a-form-item>
        <a-form-item field="siteUrl" :label="$t('settings.siteUrl')">
          <a-input v-model="form.siteUrl" />
        </a-form-item>
        <a-form-item field="contactEmail" :label="$t('settings.contactEmail')">
          <a-input v-model="form.contactEmail" />
        </a-form-item>
        <a-form-item field="pageSize" :label="$t('settings.pageSize')">
          <a-input-number v-model="form.pageSize" :min="5" :max="100" style="width: 100%" />
        </a-form-item>
        <a-form-item field="enableRegister" :label="$t('settings.enableRegister')">
          <a-switch v-model="form.enableRegister" />
        </a-form-item>
        <a-form-item field="enableNotify" :label="$t('settings.enableNotify')">
          <a-switch v-model="form.enableNotify" />
        </a-form-item>
        <a-form-item field="description" :label="$t('settings.description')">
          <a-textarea v-model="form.description" :auto-size="{ minRows: 3, maxRows: 6 }" />
        </a-form-item>
        <a-space>
          <a-button type="primary" :loading="saving" @click="save">{{ $t('settings.save') }}</a-button>
          <a-button @click="load">{{ $t('settings.reset') }}</a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import axios from 'axios';

  interface Settings {
    siteName: string;
    siteUrl: string;
    contactEmail: string;
    pageSize: number;
    enableRegister: boolean;
    enableNotify: boolean;
    description: string;
  }

  const loading = ref(false);
  const saving = ref(false);
  const form = reactive<Settings>({
    siteName: '',
    siteUrl: '',
    contactEmail: '',
    pageSize: 20,
    enableRegister: true,
    enableNotify: true,
    description: '',
  });

  async function load() {
    loading.value = true;
    try {
      const res = await axios.get<Settings>('/api/settings');
      Object.assign(form, res.data);
    } finally {
      loading.value = false;
    }
  }

  async function save() {
    saving.value = true;
    try {
      await axios.put('/api/settings', { ...form });
      Message.success('保存成功');
    } finally {
      saving.value = false;
    }
  }

  onMounted(load);
</script>

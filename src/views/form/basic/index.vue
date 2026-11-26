<template>
  <div>
    <FormPageHeader
      title="基础表单"
      description="表单页面用于向用户收集或验证信息，基础表单常用于数据项较少的表单场景。表单标签也可支持两列内联布局。"
    />

    <a-card :bordered="false">
      <a-form
        :model="form"
        :rules="rules"
        layout="horizontal"
        :label-col-props="{ span: 5 }"
        :wrapper-col-props="{ span: 14 }"
        ref="formRef"
        class="basic-form"
      >
        <a-form-item field="name" label="预约姓名">
          <a-input v-model="form.name" placeholder="输入姓名" allow-clear />
        </a-form-item>
        <a-form-item field="phone" label="预约号码">
          <a-input v-model="form.phone" placeholder="电话号码" allow-clear />
        </a-form-item>
        <a-form-item field="time" label="预约时间">
          <a-date-picker v-model="form.time" show-time style="width: 100%" placeholder="选择日期时间" />
        </a-form-item>
        <a-form-item field="doctor" label="预约医生">
          <a-select v-model="form.doctor" placeholder="请选择预约的医生">
            <a-option value="zhang">张伟医生</a-option>
            <a-option value="li">李娜医生</a-option>
            <a-option value="wang">王强医生</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="item" label="预约事项">
          <a-select v-model="form.item" placeholder="请选择预约事项">
            <a-option value="checkup">常规体检</a-option>
            <a-option value="vaccine">疫苗接种</a-option>
            <a-option value="followup">复查随访</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="性别">
          <a-radio-group v-model="form.gender">
            <a-radio value="男">男</a-radio>
            <a-radio value="女">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="预约备注">
          <a-textarea
            v-model="form.remark"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            placeholder="请输入预约备注"
          />
        </a-form-item>
        <a-form-item label="图片">
          <a-upload
            :auto-upload="false"
            :file-list="files"
            :limit="10"
            list-type="picture"
            accept="image/*"
            @change="onFilesChange"
            @remove="onFilesRemove"
          >
            <template #upload-button>
              <div class="upload-trigger">
                <icon-plus />
                <span>上传图片</span>
              </div>
            </template>
          </a-upload>
          <a-alert type="info" :bordered="false" class="upload-tip">
            <template #title>提示</template>
            <template #default>单个文件不超过 20MB，最多只能上传 10 个文件</template>
          </a-alert>
        </a-form-item>

        <a-form-item :label-col-props="{ span: 0 }">
          <a-space>
            <a-button type="primary" :loading="loading" @click="submit">提交预约</a-button>
            <a-button @click="reset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance, FileItem } from '@arco-design/web-vue';
  import axios from 'axios';
  import FormPageHeader from '../components/form-page-header.vue';

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const files = ref<FileItem[]>([]);

  const form = reactive({
    name: '',
    phone: '',
    time: '',
    doctor: '',
    item: '',
    gender: '男',
    remark: '',
  });

  const rules = {
    name: [{ required: true, message: '请输入预约姓名' }],
    phone: [{ required: true, message: '请输入预约号码' }],
    doctor: [{ required: true, message: '请选择预约医生' }],
    item: [{ required: true, message: '请选择预约事项' }],
    remark: [{ required: true, message: '请输入预约备注' }],
  };

  function onFilesChange(list: FileItem[]) {
    files.value = list;
  }
  function onFilesRemove(file: FileItem) {
    return true;
  }

  async function submit() {
    const ok = await formRef.value?.validate().catch(() => false);
    if (ok === false) return;
    loading.value = true;
    try {
      await axios.post('/api/form/submit', { ...form, files: files.value.map((f) => f.name) });
      Message.success('提交成功');
      reset();
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    Object.assign(form, {
      name: '',
      phone: '',
      time: '',
      doctor: '',
      item: '',
      gender: '男',
      remark: '',
    });
    files.value = [];
    formRef.value?.resetFields();
  }
</script>

<style scoped lang="less">
  .basic-form {
    // 居中窄列：标签右对齐内联，控件 14 格，整体不铺满右侧留白（对齐 Naive 参考）
    max-width: 760px;
    margin: 8px auto;

    :deep(.arco-form-label) {
      text-align: right;
    }
  }

  .upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 92px;
    height: 92px;
    color: var(--color-text-3);
    font-size: 12px;
  }

  .upload-tip {
    margin-top: 10px;
    max-width: 300px;
  }
</style>

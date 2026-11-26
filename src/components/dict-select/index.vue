<script setup lang="ts">
  import { computed } from 'vue';
  import { useDictOptions, DEFAULT_DICT_APP } from '@/hooks/use-dict';

  /**
   * 字典下拉：选项来自平台数据字典（`sys_dict_item`），不再在页面里硬编码词表。
   *
   * <p>写入的是 item_code（存储值），展示的是 item_label（文案）——页面不需要关心这套映射。
   * 字典还没加载完时下拉为空，但已选中的旧值仍能原样回显（不显示空白）。
   */
  const props = withDefaults(
    defineProps<{
      /** 选中值（字典项的 item_code） */
      modelValue?: string | null;
      /** 字典编码，如 system.status */
      dictCode: string;
      /** 应用标识（默认应用） */
      app?: string;
      placeholder?: string;
      disabled?: boolean;
      allowClear?: boolean;
      /** 未匹配字典时原样回显（兼容存量中文值） */
      fallbackToRaw?: boolean;
    }>(),
    {
      modelValue: null,
      app: DEFAULT_DICT_APP,
      placeholder: '请选择',
      disabled: false,
      allowClear: true,
      fallbackToRaw: true,
    }
  );

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string | null): void;
    (e: 'change', value: string | null): void;
  }>();

  const options = useDictOptions(props.dictCode, props.app);

  const selectOptions = computed(() =>
    options.value
      .filter((o) => o.enabled)
      .map((o) => ({ label: o.itemLabel, value: o.itemCode }))
  );

  /** 字典里没有当前值（例如存量中文）时，补一个"原样"选项，避免下拉显示空白 */
  const effectiveOptions = computed(() => {
    const raw = props.modelValue;
    if (!props.fallbackToRaw || !raw) return selectOptions.value;
    if (selectOptions.value.some((o) => o.value === raw))
      return selectOptions.value;
    return [{ label: raw, value: raw }, ...selectOptions.value];
  });

  function onChange(value: unknown) {
    const next = (value as string | null) ?? null;
    emit('update:modelValue', next);
    emit('change', next);
  }
</script>

<template>
  <a-select
    :model-value="modelValue ?? undefined"
    :options="effectiveOptions"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    @change="onChange"
  />
</template>

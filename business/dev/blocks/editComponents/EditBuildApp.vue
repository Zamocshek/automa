<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Описание"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.bridgeUrl"
      label="URL моста"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-input
      :model-value="data.appName"
      label="Имя приложения"
      class="w-full"
      placeholder="silverback-coding-demo"
      @change="updateData({ appName: $event })"
    />
    <label class="input-label">JSON действий</label>
    <ui-textarea
      :model-value="data.actionsJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ actionsJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.dir"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать путь сборки в переменную
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

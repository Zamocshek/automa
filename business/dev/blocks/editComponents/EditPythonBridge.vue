<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Описание"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <BlockValueField
      help="bridge"
      :model-value="data.bridgeUrl"
      label="URL моста"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-input
      :model-value="data.action"
      label="Действие"
      class="w-full"
      placeholder="echo, uppercase, python_exec, json_get"
      @change="updateData({ action: $event })"
    />
    <label class="input-label">JSON-параметры</label>
    <ui-textarea
      :model-value="data.payload"
      class="w-full font-mono"
      rows="10"
      spellcheck="false"
      @change="updateData({ payload: $event })"
    />
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result"
      @change="updateData({ returnPath: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      label="Таймаут, мс"
      class="w-full"
      type="number"
      @change="updateData({ timeout: Number($event) })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать результат в переменную
    </ui-checkbox>
    <BlockValueField
      v-if="data.assignVariable"
      help="variableName"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
    <ui-checkbox
      :model-value="data.saveData"
      @change="updateData({ saveData: $event })"
    >
      Сохранить результат в колонку данных
    </ui-checkbox>
    <ui-input
      v-if="data.saveData"
      :model-value="data.dataColumn"
      label="Колонка данных"
      class="w-full"
      @change="updateData({ dataColumn: $event })"
    />
  </div>
</template>

<script setup>
import BlockValueField from './BlockValueField.vue';
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

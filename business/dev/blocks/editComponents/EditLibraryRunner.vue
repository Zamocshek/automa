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
    <ui-select
      :model-value="data.runtime"
      label="Рантайм"
      class="w-full"
      @change="updateData({ runtime: $event })"
    >
      <option value="python">python</option>
      <option value="node">node</option>
    </ui-select>
    <label class="input-label">JSON пакетов</label>
    <ui-textarea
      :model-value="data.packagesJson"
      class="w-full font-mono"
      rows="5"
      spellcheck="false"
      @change="updateData({ packagesJson: $event })"
    />
    <label class="input-label">Код</label>
    <ui-textarea
      :model-value="data.code"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ code: $event })"
    />
    <label class="input-label">Входной JSON</label>
    <ui-textarea
      :model-value="data.inputJson"
      class="w-full font-mono"
      rows="6"
      spellcheck="false"
      @change="updateData({ inputJson: $event })"
    />
    <ui-input
      :model-value="data.executionTimeout"
      label="Таймаут выполнения, сек"
      class="w-full"
      type="number"
      @change="updateData({ executionTimeout: Number($event) })"
    />
    <ui-input
      :model-value="data.installTimeout"
      label="Таймаут установки, сек"
      class="w-full"
      type="number"
      @change="updateData({ installTimeout: Number($event) })"
    />
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result"
      @change="updateData({ returnPath: $event })"
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

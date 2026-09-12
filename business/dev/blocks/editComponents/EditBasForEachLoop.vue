<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Foreach"
      description="BAS-цикл по списку: item/index для обработки элементов."
      :actions="foreachPresets"
      active="foreach"
      @select="selectPreset"
    />
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
    <label class="input-label">JSON элементов</label>
    <ui-textarea
      :model-value="data.itemsJson"
      class="w-full font-mono"
      rows="7"
      spellcheck="false"
      @change="updateData({ itemsJson: $event })"
    />
    <div class="grid grid-cols-3 gap-2">
      <ui-input
        :model-value="data.start"
        label="Начальный индекс"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
      <ui-input
        :model-value="data.indexName"
        label="Переменная индекса"
        placeholder="index"
        @change="updateData({ indexName: $event })"
      />
      <ui-input
        :model-value="data.itemName"
        label="Переменная элемента"
        placeholder="item"
        @change="updateData({ itemName: $event })"
      />
    </div>
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
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
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const foreachPresets = [
  { key: 'commands', label: 'Команды бота', hint: 'start/ping/status', values: { itemsJson: '[\n  "start",\n  "ping",\n  "status"\n]', indexName: 'index', itemName: 'command' } },
  { key: 'leads', label: 'Лиды', hint: 'элементы лидов', values: { itemsJson: '[\n  "lead_1",\n  "lead_2",\n  "lead_3"\n]', indexName: 'index', itemName: 'lead' } },
  { key: 'urls', label: 'URL список', hint: 'скан страниц', values: { itemsJson: '[\n  "https://example.com",\n  "https://example.com/pricing"\n]', indexName: 'index', itemName: 'url' } },
  { key: 'tasks', label: 'Задачи', hint: 'scan/parse/build', values: { itemsJson: '[\n  "scan",\n  "parse",\n  "build"\n]', indexName: 'index', itemName: 'task' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

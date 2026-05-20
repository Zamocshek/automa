<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Foreach"
      description="BAS-цикл по списку: item/index для обработки элементов."
      :actions="foreachPresets"
      active="foreach"
      @select="selectPreset"
    />
    <ui-textarea
      :model-value="data.description"
      placeholder="Description"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.bridgeUrl"
      label="Bridge URL"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <label class="input-label">Items JSON</label>
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
        label="Start index"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
      <ui-input
        :model-value="data.indexName"
        label="Index variable"
        placeholder="index"
        @change="updateData({ indexName: $event })"
      />
      <ui-input
        :model-value="data.itemName"
        label="Item variable"
        placeholder="item"
        @change="updateData({ itemName: $event })"
      />
    </div>
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Assign result to variable
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Variable name"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
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
  { key: 'leads', label: 'Лиды', hint: 'lead items', values: { itemsJson: '[\n  "lead_1",\n  "lead_2",\n  "lead_3"\n]', indexName: 'index', itemName: 'lead' } },
  { key: 'urls', label: 'URL список', hint: 'scan pages', values: { itemsJson: '[\n  "https://example.com",\n  "https://example.com/pricing"\n]', indexName: 'index', itemName: 'url' } },
  { key: 'tasks', label: 'Задачи', hint: 'scan/parse/build', values: { itemsJson: '[\n  "scan",\n  "parse",\n  "build"\n]', indexName: 'index', itemName: 'task' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

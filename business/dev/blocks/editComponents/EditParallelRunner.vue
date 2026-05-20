<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Многопоток"
      description="Запуск пачки действий в thread/process стиле, как массовый запуск в BAS."
      :actions="parallelPresets"
      :active="data.mode"
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
    <ui-select
      :model-value="data.mode"
      label="Mode"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="thread">thread</option>
      <option value="process">process</option>
    </ui-select>
    <ui-input
      :model-value="data.workers"
      label="Workers"
      class="w-full"
      type="number"
      @change="updateData({ workers: Number($event) })"
    />
    <ui-input
      :model-value="data.repeats"
      label="Repeats"
      class="w-full"
      type="number"
      @change="updateData({ repeats: Number($event) })"
    />
    <label class="input-label">Tasks JSON</label>
    <ui-textarea
      :model-value="data.tasksJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ tasksJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="summary"
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

const parallelPresets = [
  { key: 'thread-fast', label: 'Потоки быстрые', hint: 'I/O', values: { mode: 'thread', workers: 4, repeats: 1, returnPath: 'summary' } },
  { key: 'process-cpu', label: 'Процессы CPU', hint: 'python', values: { mode: 'process', workers: 2, repeats: 1, returnPath: 'summary' } },
  { key: 'stress', label: 'Массовый запуск', hint: 'repeat', values: { mode: 'thread', workers: 8, repeats: 5, returnPath: 'summary' } },
  { key: 'safe', label: 'Безопасный тест', hint: '2 x 1', values: { mode: 'thread', workers: 2, repeats: 1, returnPath: 'summary' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

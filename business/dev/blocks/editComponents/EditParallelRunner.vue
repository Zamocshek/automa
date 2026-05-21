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
    <ui-select
      :model-value="data.mode"
      label="Режим"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="thread">потоки</option>
      <option value="process">процессы</option>
    </ui-select>
    <ui-input
      :model-value="data.workers"
      label="Воркеры"
      class="w-full"
      type="number"
      @change="updateData({ workers: Number($event) })"
    />
    <ui-input
      :model-value="data.threadNumber || data.browserCount || data.workers"
      label="Thread / browser number"
      class="w-full"
      type="number"
      @change="updateData({ threadNumber: Number($event), browserCount: Number($event), workers: Number($event) })"
    />
    <ui-input
      :model-value="data.pageUrl"
      label="Page URL"
      class="w-full"
      placeholder="https://example.com"
      @change="updateData({ pageUrl: $event })"
    />
    <ui-input
      :model-value="data.repeats"
      label="Повторы"
      class="w-full"
      type="number"
      @change="updateData({ repeats: Number($event) })"
    />
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.sleepMinSeconds"
        label="Sleep min"
        type="number"
        @change="updateData({ sleepMinSeconds: Number($event) })"
      />
      <ui-input
        :model-value="data.sleepMaxSeconds"
        label="Sleep max"
        type="number"
        @change="updateData({ sleepMaxSeconds: Number($event) })"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.successLimit"
        label="Success stop"
        type="number"
        @change="updateData({ successLimit: Number($event) })"
      />
      <ui-input
        :model-value="data.failureLimit"
        label="Failure stop"
        type="number"
        @change="updateData({ failureLimit: Number($event) })"
      />
    </div>
    <label class="input-label">JSON задач</label>
    <ui-textarea
      :model-value="data.tasksJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ tasksJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="summary"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать результат в переменную
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
  { key: 'browser-swarm', label: 'Browser swarm', hint: 'BAS', values: { mode: 'thread', workers: 5, threadNumber: 5, browserCount: 5, repeats: 1, pageUrl: 'https://example.com', sleepMinSeconds: 1, sleepMaxSeconds: 3, successLimit: 0, failureLimit: 0, returnPath: 'summary' } },
  { key: 'safe', label: 'Безопасный тест', hint: '2 x 1', values: { mode: 'thread', workers: 2, repeats: 1, returnPath: 'summary' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

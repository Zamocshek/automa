<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Переменные"
      description="Хранилище переменных для проекта, workflow и MCP-сценариев."
      :actions="variablePresets"
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
      <option value="get">get</option>
      <option value="set">set</option>
      <option value="list">list</option>
      <option value="delete">delete</option>
      <option value="increment">increment</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'list'"
      :model-value="data.variableStoreName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableStoreName: $event })"
    />
    <ui-input
      :model-value="data.variableScope"
      label="Область"
      class="w-full"
      placeholder="project or workflow"
      @change="updateData({ variableScope: $event })"
    />
    <template v-if="data.mode === 'set'">
      <ui-select
        :model-value="data.variableType"
        label="Тип"
        class="w-full"
        @change="updateData({ variableType: $event })"
      >
        <option value="any">any</option>
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="integer">integer</option>
        <option value="boolean">boolean</option>
        <option value="list">list</option>
        <option value="json">json</option>
      </ui-select>
      <ui-input
        :model-value="data.variableDescription"
        label="Описание переменной"
        class="w-full"
        @change="updateData({ variableDescription: $event })"
      />
      <label class="input-label">JSON значения</label>
      <ui-textarea
        :model-value="data.valueJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        @change="updateData({ valueJson: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'increment'"
      :model-value="data.delta"
      label="Дельта"
      class="w-full"
      type="number"
      @change="updateData({ delta: Number($event) })"
    />
    <ui-input
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
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Имя переменной Automa"
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

const variablePresets = [
  { key: 'set-string', label: 'Установить строку', hint: 'set', values: { mode: 'set', variableType: 'string', valueJson: '"value"', returnPath: 'result.value' } },
  { key: 'set-number', label: 'Установить число', hint: 'number', values: { mode: 'set', variableType: 'number', valueJson: '1', returnPath: 'result.value' } },
  { key: 'set-list', label: 'Установить список', hint: 'list', values: { mode: 'set', variableType: 'list', valueJson: '["alpha", "beta"]', returnPath: 'result.value' } },
  { key: 'get', label: 'Получить переменную', hint: 'get', values: { mode: 'get', returnPath: 'result.value' } },
  { key: 'list', label: 'Список переменных', hint: 'list', values: { mode: 'list', returnPath: 'result' } },
  { key: 'increment', label: 'Увеличить', hint: '+1', values: { mode: 'increment', delta: 1, returnPath: 'result.value' } },
  { key: 'delete', label: 'Удалить', hint: 'delete', values: { mode: 'delete', returnPath: 'result.deleted' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

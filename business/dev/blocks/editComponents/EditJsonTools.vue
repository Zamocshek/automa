<template>
  <div class="space-y-2">
    <BasActionGrid
      title="JSON"
      description="Работа с JSON и JSONPath как отдельные BAS-кубики."
      :actions="jsonPresets"
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
      label="Операция"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="create">create</option>
      <option value="get">get</option>
      <option value="keys">keys</option>
      <option value="values">values</option>
      <option value="count">count</option>
      <option value="set">set</option>
      <option value="delete">delete</option>
      <option value="parse">parse</option>
      <option value="stringify">stringify</option>
      <option value="format">format</option>
      <option value="valid">valid</option>
    </ui-select>
    <ui-select
      v-if="data.mode === 'create'"
      :model-value="data.shape"
      label="Форма"
      class="w-full"
      @change="updateData({ shape: $event })"
    >
      <option value="object">объект</option>
      <option value="array">массив</option>
    </ui-select>
    <template v-if="!['parse', 'valid', 'format'].includes(data.mode)">
      <label class="input-label">JSON данных</label>
      <ui-textarea
        :model-value="data.dataJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ dataJson: $event })"
      />
      <ui-input
        v-if="data.mode !== 'create'"
        :model-value="data.path"
        label="Путь"
        class="w-full"
        placeholder="user.name"
        @change="updateData({ path: $event })"
      />
    </template>
    <template v-if="data.mode === 'set'">
      <label class="input-label">JSON значения</label>
      <ui-textarea
        :model-value="data.valueJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ valueJson: $event })"
      />
    </template>
    <template v-if="['parse', 'valid', 'format'].includes(data.mode)">
      <label class="input-label">JSON-текст</label>
      <ui-textarea
        :model-value="data.text"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ text: $event })"
      />
    </template>
    <ui-input
      v-if="['stringify', 'format'].includes(data.mode)"
      :model-value="data.indent"
      label="Отступ"
      class="w-full"
      type="number"
      @change="updateData({ indent: Number($event) })"
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

const jsonPresets = [
  { key: 'create-object', label: 'Создать объект', hint: '{}', values: { mode: 'create', shape: 'object', returnPath: 'result' } },
  { key: 'get', label: 'Получить значение', hint: 'path', values: { mode: 'get', path: 'user.name', returnPath: 'result' } },
  { key: 'keys', label: 'Получить все ключи', hint: 'keys', values: { mode: 'keys', path: '', returnPath: 'result' } },
  { key: 'values', label: 'Получить все значения', hint: 'values', values: { mode: 'values', path: '', returnPath: 'result' } },
  { key: 'count', label: 'Количество элементов', hint: 'count', values: { mode: 'count', path: '', returnPath: 'result' } },
  { key: 'set', label: 'Изменить значение', hint: 'set path', values: { mode: 'set', path: 'user.name', valueJson: '"Silverback"', returnPath: 'result' } },
  { key: 'delete', label: 'Удалить значение', hint: 'delete path', values: { mode: 'delete', path: 'user.name', returnPath: 'result' } },
  { key: 'parse', label: 'Строку в JSON', hint: 'parse', values: { mode: 'parse', text: '{"ok": true}', returnPath: 'result' } },
  { key: 'format', label: 'Форматировать JSON', hint: 'pretty', values: { mode: 'format', text: '{"ok":true}', indent: 2, returnPath: 'result' } },
  { key: 'stringify', label: 'JSON в строку', hint: 'stringify', values: { mode: 'stringify', indent: 2, returnPath: 'result' } },
  { key: 'valid', label: 'Проверить JSON', hint: 'valid', values: { mode: 'valid', text: '{"ok": true}', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

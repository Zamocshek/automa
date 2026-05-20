<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Файлы и пути"
      description="Работа с файлами и путями проекта как отдельные BAS-действия."
      :actions="filePresets"
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
      <option value="write">записать файл</option>
      <option value="read">прочитать файл</option>
      <option value="list">список папки</option>
      <option value="exists">существует</option>
      <option value="mkdir">создать папку</option>
      <option value="copy">копировать файл</option>
      <option value="move">переместить файл</option>
      <option value="delete">удалить файл</option>
      <option value="join">склеить путь</option>
      <option value="dirname">dirname</option>
      <option value="basename">basename</option>
      <option value="ext">extension</option>
      <option value="normalize">normalize</option>
      <option value="relative">relative</option>
      <option value="isAbsolute">абсолютный путь</option>
    </ui-select>
    <template v-if="['copy', 'move'].includes(data.mode)">
      <ui-input
        :model-value="data.source"
        label="Источник"
        class="w-full"
        @change="updateData({ source: $event })"
      />
      <ui-input
        :model-value="data.target"
        label="Назначение"
        class="w-full"
        @change="updateData({ target: $event })"
      />
    </template>
    <template v-else-if="data.mode === 'join'">
      <label class="input-label">JSON частей</label>
      <ui-textarea
        :model-value="data.partsJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        @change="updateData({ partsJson: $event })"
      />
    </template>
    <template v-else>
      <ui-input
        :model-value="data.path"
        label="Путь"
        class="w-full"
        @change="updateData({ path: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'relative'"
      :model-value="data.base"
      label="База"
      class="w-full"
      @change="updateData({ base: $event })"
    />
    <template v-if="data.mode === 'write'">
      <label class="input-label">Текст</label>
      <ui-textarea
        :model-value="data.text"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ text: $event })"
      />
    </template>
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

const filePresets = [
  { key: 'write', label: 'Записать файл', hint: 'write', values: { mode: 'write', path: 'demo/output.txt', text: 'Silverback Coding', returnPath: 'result.path' } },
  { key: 'read', label: 'Прочитать файл', hint: 'read', values: { mode: 'read', path: 'demo/output.txt', returnPath: 'result.text' } },
  { key: 'list', label: 'Список файлов', hint: 'folder', values: { mode: 'list', path: 'demo', returnPath: 'result.items' } },
  { key: 'exists', label: 'Проверить файл', hint: 'exists', values: { mode: 'exists', path: 'demo/output.txt', returnPath: 'result.exists' } },
  { key: 'mkdir', label: 'Создать папку', hint: 'mkdir', values: { mode: 'mkdir', path: 'demo', returnPath: 'result.path' } },
  { key: 'copy', label: 'Копировать', hint: 'copy', values: { mode: 'copy', source: 'demo/output.txt', target: 'demo/copy.txt', returnPath: 'result' } },
  { key: 'join', label: 'Объединить путь', hint: 'join', values: { mode: 'join', partsJson: '["demo", "output.txt"]', returnPath: 'result' } },
  { key: 'basename', label: 'Имя файла', hint: 'basename', values: { mode: 'basename', path: 'demo/output.txt', returnPath: 'result' } },
  { key: 'normalize', label: 'Нормализовать путь', hint: 'normalize', values: { mode: 'normalize', path: 'demo/../demo/output.txt', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

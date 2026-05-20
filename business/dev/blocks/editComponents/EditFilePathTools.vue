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
      label="Operation"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="write">write file</option>
      <option value="read">read file</option>
      <option value="list">list folder</option>
      <option value="exists">exists</option>
      <option value="mkdir">make folder</option>
      <option value="copy">copy file</option>
      <option value="move">move file</option>
      <option value="delete">delete file</option>
      <option value="join">join path</option>
      <option value="dirname">dirname</option>
      <option value="basename">basename</option>
      <option value="ext">extension</option>
      <option value="normalize">normalize</option>
      <option value="relative">relative</option>
      <option value="isAbsolute">is absolute</option>
    </ui-select>
    <template v-if="['copy', 'move'].includes(data.mode)">
      <ui-input
        :model-value="data.source"
        label="Source"
        class="w-full"
        @change="updateData({ source: $event })"
      />
      <ui-input
        :model-value="data.target"
        label="Target"
        class="w-full"
        @change="updateData({ target: $event })"
      />
    </template>
    <template v-else-if="data.mode === 'join'">
      <label class="input-label">Parts JSON</label>
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
        label="Path"
        class="w-full"
        @change="updateData({ path: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'relative'"
      :model-value="data.base"
      label="Base"
      class="w-full"
      @change="updateData({ base: $event })"
    />
    <template v-if="data.mode === 'write'">
      <label class="input-label">Text</label>
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

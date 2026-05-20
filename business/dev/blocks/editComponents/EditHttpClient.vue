<template>
  <div class="space-y-2">
    <BasActionGrid
      title="HTTP"
      description="Сетевые запросы и быстрые проверки ответа в стиле BAS HTTP-клиента."
      :actions="httpPresets"
      :active="data.method"
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
      :model-value="data.method"
      label="Method"
      class="w-full"
      @change="updateData({ method: $event })"
    >
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="PATCH">PATCH</option>
      <option value="DELETE">DELETE</option>
    </ui-select>
    <ui-input
      :model-value="data.url"
      label="URL"
      class="w-full"
      @change="updateData({ url: $event })"
    />
    <label class="input-label">Headers JSON</label>
    <ui-textarea
      :model-value="data.headersJson"
      class="w-full font-mono"
      rows="6"
      spellcheck="false"
      @change="updateData({ headersJson: $event })"
    />
    <ui-select
      :model-value="data.bodyMode"
      label="Body"
      class="w-full"
      @change="updateData({ bodyMode: $event })"
    >
      <option value="none">none</option>
      <option value="json">JSON</option>
      <option value="text">text</option>
    </ui-select>
    <template v-if="data.bodyMode === 'json'">
      <label class="input-label">JSON body</label>
      <ui-textarea
        :model-value="data.jsonBody"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ jsonBody: $event })"
      />
    </template>
    <template v-if="data.bodyMode === 'text'">
      <label class="input-label">Text body</label>
      <ui-textarea
        :model-value="data.body"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ body: $event })"
      />
    </template>
    <ui-input
      :model-value="data.timeout"
      label="Timeout seconds"
      class="w-full"
      type="number"
      @change="updateData({ timeout: Number($event) })"
    />
    <ui-input
      :model-value="data.maxChars"
      label="Max response chars"
      class="w-full"
      type="number"
      @change="updateData({ maxChars: Number($event) })"
    />
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

const httpPresets = [
  { key: 'GET', label: 'Get запрос', hint: 'GET', values: { method: 'GET', bodyMode: 'none', returnPath: 'result' } },
  { key: 'POST', label: 'Post JSON', hint: 'POST', values: { method: 'POST', bodyMode: 'json', jsonBody: '{\n  "ok": true\n}', returnPath: 'result' } },
  { key: 'status', label: 'Статус ответа', hint: 'status', values: { method: 'GET', bodyMode: 'none', returnPath: 'result.status' } },
  { key: 'text', label: 'Содержание ответа', hint: 'text', values: { method: 'GET', bodyMode: 'none', returnPath: 'result.text' } },
  { key: 'headers', label: 'Заголовки', hint: 'headers', values: { method: 'GET', bodyMode: 'none', returnPath: 'result.headers' } },
  { key: 'cookies', label: 'Cookie request', hint: 'cookie', values: { method: 'GET', headersJson: '{\n  "Cookie": "name=value"\n}', bodyMode: 'none', returnPath: 'result' } },
  { key: 'download', label: 'Скачать', hint: 'body', values: { method: 'GET', bodyMode: 'none', maxChars: 200000, returnPath: 'result.text' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

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
      :model-value="data.operation || 'request'"
      label="BAS action"
      class="w-full"
      @change="updateData({ operation: $event })"
    >
      <option value="request">request</option>
      <option value="reset">reset session</option>
      <option value="status">response status</option>
      <option value="content">response content</option>
      <option value="header">response headers</option>
      <option value="download">download</option>
      <option value="xpath">XML/XPath extract</option>
    </ui-select>
    <ui-select
      :model-value="data.method"
      label="Метод"
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
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.sessionName"
        label="Session / cookies"
        class="w-full"
        placeholder="default-http"
        @change="updateData({ sessionName: $event })"
      />
      <ui-input
        :model-value="data.proxy"
        label="Proxy"
        class="w-full"
        placeholder="http://user:pass@host:port"
        @change="updateData({ proxy: $event })"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <ui-checkbox :model-value="Boolean(data.loadCookies)" @change="updateData({ loadCookies: $event })">Load cookies</ui-checkbox>
      <ui-checkbox :model-value="Boolean(data.saveCookies)" @change="updateData({ saveCookies: $event })">Save cookies</ui-checkbox>
      <ui-checkbox :model-value="Boolean(data.loadHeaders)" @change="updateData({ loadHeaders: $event })">Load headers</ui-checkbox>
      <ui-checkbox :model-value="Boolean(data.saveHeaders)" @change="updateData({ saveHeaders: $event })">Save headers</ui-checkbox>
    </div>
    <label class="input-label">JSON заголовков</label>
    <ui-textarea
      :model-value="data.headersJson"
      class="w-full font-mono"
      rows="6"
      spellcheck="false"
      @change="updateData({ headersJson: $event })"
    />
    <ui-select
      :model-value="data.bodyMode"
      label="Тело"
      class="w-full"
      @change="updateData({ bodyMode: $event })"
    >
      <option value="none">нет</option>
      <option value="json">JSON</option>
      <option value="text">текст</option>
    </ui-select>
    <template v-if="data.bodyMode === 'json'">
      <label class="input-label">JSON-тело</label>
      <ui-textarea
        :model-value="data.jsonBody"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ jsonBody: $event })"
      />
    </template>
    <template v-if="data.bodyMode === 'text'">
      <label class="input-label">Текстовое тело</label>
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
      label="Таймаут, сек"
      class="w-full"
      type="number"
      @change="updateData({ timeout: Number($event) })"
    />
    <ui-input
      :model-value="data.maxChars"
      label="Макс. символов ответа"
      class="w-full"
      type="number"
      @change="updateData({ maxChars: Number($event) })"
    />
    <ui-input
      :model-value="data.downloadTo"
      label="Download to runtime/data"
      class="w-full"
      placeholder="downloads/response.bin"
      @change="updateData({ downloadTo: $event })"
    />
    <label class="input-label">XML/XPath extractors JSON</label>
    <ui-textarea
      :model-value="data.extractorsJson"
      class="w-full font-mono"
      rows="5"
      spellcheck="false"
      placeholder='[{"name":"title","path":".//title","mode":"text"}]'
      @change="updateData({ extractorsJson: $event })"
    />
    <ui-checkbox
      :model-value="Boolean(data.stopAfterError)"
      @change="updateData({ stopAfterError: $event })"
    >
      Stop after error
    </ui-checkbox>
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

const httpPresets = [
  { key: 'GET', label: 'GET-запрос', hint: 'GET', values: { operation: 'request', method: 'GET', bodyMode: 'none', returnPath: 'result' } },
  { key: 'POST', label: 'POST JSON', hint: 'POST', values: { operation: 'request', method: 'POST', bodyMode: 'json', jsonBody: '{\n  "ok": true\n}', returnPath: 'result' } },
  { key: 'status', label: 'Статус ответа', hint: 'status', values: { operation: 'status', method: 'GET', bodyMode: 'none', returnPath: 'result.status' } },
  { key: 'text', label: 'Содержание ответа', hint: 'text', values: { operation: 'content', method: 'GET', bodyMode: 'none', returnPath: 'result.text' } },
  { key: 'headers', label: 'Заголовки', hint: 'headers', values: { operation: 'header', method: 'GET', bodyMode: 'none', returnPath: 'result.headers' } },
  { key: 'cookies', label: 'Запрос с cookie', hint: 'cookie', values: { operation: 'request', method: 'GET', sessionName: 'default-http', loadCookies: true, saveCookies: true, headersJson: '{\n  "Cookie": "name=value"\n}', bodyMode: 'none', returnPath: 'result' } },
  { key: 'proxy', label: 'Proxy request', hint: 'proxy', values: { operation: 'request', method: 'GET', proxy: 'http://user:pass@host:port', bodyMode: 'none', returnPath: 'result.status' } },
  { key: 'download', label: 'Скачать', hint: 'body', values: { operation: 'download', method: 'GET', bodyMode: 'none', maxChars: 200000, downloadTo: 'downloads/response.bin', returnPath: 'result.downloadPath' } },
  { key: 'xpath-text', label: 'XPath text', hint: 'xml', values: { operation: 'xpath', method: 'GET', bodyMode: 'none', extractorsJson: '[\n  { "name": "title", "path": ".//title", "mode": "text" }\n]', returnPath: 'result.extract' } },
  { key: 'reset', label: 'Reset session', hint: 'reset', values: { operation: 'reset', sessionName: 'default-http', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Ожидание"
      description="Ждать загрузку, файл, CSS, текст или повторять действие с retry."
      :actions="waitPresets"
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
      <option value="sleep">sleep</option>
      <option value="file">ждать файл</option>
      <option value="http">ждать HTTP</option>
      <option value="pageLoad">wait full page load</option>
      <option value="urlLoad">wait URL load</option>
      <option value="browserAddress">wait browser address</option>
      <option value="selector">ждать селектор</option>
      <option value="text">ждать текст</option>
      <option value="try">try-действие</option>
      <option value="retry">retry-действие</option>
    </ui-select>
    <ui-input
      v-if="data.mode === 'sleep'"
      :model-value="data.seconds"
      label="Seconds"
      class="w-full"
      type="number"
      @change="updateData({ seconds: Number($event) })"
    />
    <template v-if="data.mode === 'file'">
      <ui-input
        :model-value="data.path"
        label="Путь"
        class="w-full"
        @change="updateData({ path: $event })"
      />
      <ui-select
        :model-value="data.fileMode || 'exists'"
        label="Условие файла"
        class="w-full"
        @change="updateData({ fileMode: $event })"
      >
        <option value="exists">существует</option>
        <option value="not_exists">не существует</option>
        <option value="changed">изменен</option>
        <option value="contains">содержит текст</option>
      </ui-select>
    </template>
    <template v-if="['http', 'selector', 'text', 'pageLoad', 'urlLoad', 'browserAddress'].includes(data.mode)">
      <ui-select
        v-if="['selector', 'text', 'pageLoad', 'urlLoad', 'browserAddress'].includes(data.mode)"
        :model-value="data.browserEngine || 'chromium'"
        label="Движок браузера"
        class="w-full"
        @change="updateData({ browserEngine: $event })"
      >
        <option value="chromium">chromium</option>
        <option value="firefox">firefox</option>
        <option value="webkit">webkit</option>
        <option value="camoufox">camoufox</option>
      </ui-select>
      <ui-input
        :model-value="data.url"
        label="URL"
        class="w-full"
        @change="updateData({ url: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'selector'"
      :model-value="data.selector"
      label="Селектор"
      class="w-full"
      @change="updateData({ selector: $event })"
    />
    <ui-select
      v-if="data.mode === 'pageLoad'"
      :model-value="data.loadState || 'load'"
      label="Load state"
      class="w-full"
      @change="updateData({ loadState: $event })"
    >
      <option value="load">load</option>
      <option value="domcontentloaded">domcontentloaded</option>
      <option value="networkidle">networkidle</option>
    </ui-select>
    <ui-input
      v-if="['urlLoad', 'browserAddress'].includes(data.mode)"
      :model-value="data.expectedUrl"
      label="Expected URL"
      class="w-full"
      @change="updateData({ expectedUrl: $event })"
    />
    <ui-input
      v-if="['urlLoad', 'browserAddress'].includes(data.mode)"
      :model-value="data.urlContains || data.contains"
      label="URL contains"
      class="w-full"
      @change="updateData({ urlContains: $event })"
    />
    <ui-input
      v-if="['file', 'http', 'text'].includes(data.mode)"
      :model-value="data.text"
      label="Текст"
      class="w-full"
      @change="updateData({ text: $event })"
    />
    <ui-select
      v-if="['selector', 'text', 'pageLoad', 'urlLoad', 'browserAddress'].includes(data.mode)"
      :model-value="data.state || 'visible'"
      label="Состояние"
      class="w-full"
      @change="updateData({ state: $event })"
    >
      <option value="visible">видимый</option>
      <option value="attached">прикреплен</option>
      <option value="hidden">скрыт</option>
      <option value="detached">откреплен</option>
    </ui-select>
    <template v-if="['try', 'retry'].includes(data.mode)">
      <ui-input
        :model-value="data.retryAction"
        label="Действие"
        class="w-full"
        @change="updateData({ retryAction: $event })"
      />
      <label class="input-label">JSON-параметры</label>
      <ui-textarea
        :model-value="data.actionPayloadJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ actionPayloadJson: $event })"
      />
      <ui-input
        v-if="data.mode === 'retry'"
        :model-value="data.attempts"
        label="Попытки"
        class="w-full"
        type="number"
        @change="updateData({ attempts: Number($event) })"
      />
      <ui-input
        v-if="data.mode === 'retry'"
        :model-value="data.delaySeconds"
        label="Задержка, сек"
        class="w-full"
        type="number"
        @change="updateData({ delaySeconds: Number($event) })"
      />
    </template>
    <ui-input
      v-if="data.mode !== 'sleep'"
      :model-value="data.timeoutSeconds"
      label="Таймаут, сек"
      class="w-full"
      type="number"
      @change="updateData({ timeoutSeconds: Number($event) })"
    />
    <ui-input
      v-if="['file', 'http'].includes(data.mode)"
      :model-value="data.interval"
      label="Интервал, сек"
      class="w-full"
      type="number"
      @change="updateData({ interval: Number($event) })"
    />
    <ui-checkbox
      v-if="['selector', 'text', 'pageLoad', 'urlLoad', 'browserAddress'].includes(data.mode)"
      :model-value="data.headless !== false"
      @change="updateData({ headless: $event })"
    >
      Headless-браузер
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

const waitPresets = [
  { key: 'sleep', label: 'Пауза', hint: 'seconds', values: { mode: 'sleep', seconds: 1, returnPath: 'result' } },
  { key: 'http', label: 'Ждать URL', hint: 'HTTP 200', values: { mode: 'http', url: 'https://example.com', timeoutSeconds: 30, interval: 1, returnPath: 'result' } },
  { key: 'page-load', label: 'Полная загрузка', hint: 'load', values: { mode: 'pageLoad', url: 'https://example.com', loadState: 'load', timeoutSeconds: 30, returnPath: 'result' } },
  { key: 'url-load', label: 'Ждать URL load', hint: 'url', values: { mode: 'urlLoad', url: 'https://example.com', urlContains: 'example.com', timeoutSeconds: 30, returnPath: 'result' } },
  { key: 'browser-address', label: 'Адрес браузера', hint: 'address', values: { mode: 'browserAddress', url: 'https://example.com', expectedUrl: 'https://example.com/', timeoutSeconds: 30, returnPath: 'result.url' } },
  { key: 'selector', label: 'Ждать CSS', hint: 'selector', values: { mode: 'selector', url: 'https://example.com', selector: 'h1', state: 'visible', returnPath: 'result' } },
  { key: 'text', label: 'Ждать текст', hint: 'текст страницы', values: { mode: 'text', url: 'https://example.com', text: 'Example', returnPath: 'result' } },
  { key: 'file', label: 'Ждать файл', hint: 'файл найден', values: { mode: 'file', path: 'demo/file.txt', fileMode: 'exists', timeoutSeconds: 30, interval: 1, returnPath: 'result' } },
  { key: 'retry', label: 'Повтор действия', hint: 'повторить', values: { mode: 'retry', retryAction: 'http_request', attempts: 3, delaySeconds: 1, returnPath: 'result' } },
  { key: 'try', label: 'Try/Catch', hint: 'безопасный запуск', values: { mode: 'try', retryAction: 'http_request', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

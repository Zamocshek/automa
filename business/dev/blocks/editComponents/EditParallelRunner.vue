<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Многопоток"
      description="Параллельные действия моста или браузерные задания."
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
    <BlockValueField
      help="bridge"
      :model-value="data.bridgeUrl"
      label="URL моста"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-select
      :model-value="data.executionTarget || 'batch'"
      label="Что запускать"
      class="w-full"
      @change="updateData({ executionTarget: $event, returnPath: $event === 'browser' ? 'result.summary' : 'summary' })"
    >
      <option value="batch">Действия моста</option>
      <option value="browser">Браузерные задания</option>
    </ui-select>
    <ui-select
      v-if="data.executionTarget !== 'browser'"
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
      label="Параллельные исполнители"
      class="w-full"
      type="number"
      min="1"
      max="512"
      :help="t('authoring.help.workers')"
      @change="updateData({ workers: Number($event) })"
    />
    <ui-input
      v-if="data.executionTarget === 'browser'"
      :model-value="data.browserCount || 1"
      label="Количество браузеров"
      class="w-full"
      type="number"
      min="1"
      max="10000"
      :help="t('authoring.help.browserCount')"
      @change="updateData({ browserCount: Number($event) })"
    />
    <BlockValueField
      v-if="data.executionTarget === 'browser'"
      help="url"
      templates
      :model-value="data.pageUrl"
      label="Адрес страницы"
      class="w-full"
      placeholder="https://example.com"
      @change="updateData({ pageUrl: $event })"
    />
    <ui-input
      :model-value="data.repeats"
      label="Повторы"
      class="w-full"
      type="number"
      min="1"
      max="1000"
      @change="updateData({ repeats: Number($event) })"
    />
    <template v-if="data.executionTarget === 'browser'">
    <ui-select :model-value="data.browserEngine || 'chromium'" label="Движок браузера" class="w-full" @change="updateData({ browserEngine: $event })">
      <option value="chromium">Chromium</option>
      <option value="firefox">Firefox</option>
      <option value="webkit">WebKit</option>
      <option value="camoufox">Camoufox</option>
    </ui-select>
    <ui-checkbox :model-value="data.headless !== false" @change="updateData({ headless: $event })">Без видимых окон браузеров</ui-checkbox>
    <ui-checkbox :model-value="data.dryRun === true" @change="updateData({ dryRun: $event })">Только проверить план, не запускать браузеры</ui-checkbox>
    <ui-input :model-value="data.timeoutSeconds || 600" label="Ожидание ответа исполнителя, сек" type="number" min="1" max="86400" class="w-full" @change="updateData({ timeoutSeconds: Number($event) })" />
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.sleepMinSeconds"
        label="Пауза от, сек"
        type="number"
        min="0"
        :help="t('authoring.help.sleep')"
        @change="updateData({ sleepMinSeconds: Number($event) })"
      />
      <ui-input
        :model-value="data.sleepMaxSeconds"
        label="Пауза до, сек"
        type="number"
        min="0"
        @change="updateData({ sleepMaxSeconds: Number($event) })"
      />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.successLimit"
        label="Лимит успешных запусков"
        type="number"
        min="0"
        :help="t('authoring.help.limits')"
        @change="updateData({ successLimit: Number($event) })"
      />
      <ui-input
        :model-value="data.failureLimit"
        label="Лимит ошибок"
        type="number"
        min="0"
        @change="updateData({ failureLimit: Number($event) })"
      />
    </div>
    </template>
    <BlockValueField
      v-if="data.executionTarget !== 'browser'"
      label="JSON задач"
      help="tasks"
      json="array"
      multiline
      templates
      :model-value="data.tasksJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ tasksJson: $event })"
    />
    <BlockValueField
      help="returnPath"
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
    <BlockValueField
      v-if="data.assignVariable"
      help="variableName"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
import BlockValueField from './BlockValueField.vue';
import BasActionGrid from './BasActionGrid.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

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
  { key: 'browser-swarm', label: 'Параллельные браузеры', hint: 'BAS', values: { executionTarget: 'browser', dryRun: true, mode: 'thread', workers: 5, threadNumber: 5, browserCount: 5, repeats: 1, pageUrl: 'https://example.com', sleepMinSeconds: 1, sleepMaxSeconds: 3, successLimit: 0, failureLimit: 0, returnPath: 'result.summary' } },
  { key: 'safe', label: 'Безопасный тест', hint: '2 x 1', values: { mode: 'thread', workers: 2, repeats: 1, returnPath: 'summary' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  const isBrowser = action.key === 'browser-swarm';
  updateData({
    ...action.values,
    executionTarget: isBrowser ? 'browser' : 'batch',
    returnPath: isBrowser ? 'result.summary' : 'summary',
    dryRun: isBrowser,
  });
}
</script>

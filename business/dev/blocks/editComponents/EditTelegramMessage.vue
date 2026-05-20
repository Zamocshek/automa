<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Telegram сообщение"
      description="BAS-кубик для отправки сообщения: токен из ресурса или [[value_token]], chat id, текст с [[VARIABLE]] и сохранение ответа."
      :actions="telegramPresets"
      :active="data.dryRun ? 'dry-run' : 'send'"
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
    <ui-input
      :model-value="data.valueToken"
      label="value_token / прямой токен"
      class="w-full"
      placeholder="[[value_token]] или 123456:ABC"
      @change="updateData({ valueToken: $event })"
    />
    <ui-input
      :model-value="data.tokenResource"
      label="Ресурс токена"
      class="w-full"
      placeholder="telegram_bot_token"
      @change="updateData({ tokenResource: $event })"
    />
    <ui-input
      :model-value="data.chatId"
      label="Telegram ID / chat_id"
      class="w-full"
      placeholder="[[telegram_chat_id]]"
      @change="updateData({ chatId: $event })"
    />
    <ui-select
      :model-value="data.parseMode"
      label="Формат"
      class="w-full"
      @change="updateData({ parseMode: $event })"
    >
      <option value="">обычный текст</option>
      <option value="HTML">HTML</option>
      <option value="MarkdownV2">MarkdownV2</option>
    </ui-select>
    <label class="input-label">Текст сообщения</label>
    <ui-textarea
      :model-value="data.text"
      class="w-full"
      rows="8"
      spellcheck="false"
      placeholder="ПРИВЕТ, [[user_name]]. Сделайте вот этот список действий."
      @change="updateData({ text: $event })"
    />
    <ui-checkbox
      :model-value="data.dryRun"
      @change="updateData({ dryRun: $event })"
    >
      Dry-run: собрать payload без реальной отправки
    </ui-checkbox>
    <ui-input
      :model-value="data.requestTimeout"
      label="Таймаут запроса, сек"
      class="w-full"
      type="number"
      @change="updateData({ requestTimeout: Number($event) })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.payload"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать ответ Telegram в переменную
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      placeholder="telegram_message"
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

const telegramPresets = [
  {
    key: 'dry-run',
    label: 'Dry-run',
    hint: 'safe',
    values: {
      dryRun: true,
      valueToken: '[[value_token]]',
      chatId: '[[telegram_chat_id]]',
      text: 'ПРИВЕТ, [[user_name]]. Сделайте вот этот список действий.',
      returnPath: 'result.payload',
      variableName: 'telegram_preview',
    },
  },
  {
    key: 'send',
    label: 'Отправить',
    hint: 'send',
    values: {
      dryRun: false,
      tokenResource: 'telegram_bot_token',
      chatId: '[[telegram_chat_id]]',
      text: 'Привет, [[user_name]]',
      returnPath: 'result',
      variableName: 'telegram_response',
    },
  },
  {
    key: 'resource-token',
    label: 'Токен из ресурса',
    hint: 'resource',
    values: {
      dryRun: true,
      valueToken: '',
      tokenResource: 'telegram_bot_token',
      chatId: '[[telegram_chat_id]]',
      text: 'Silverback Coding: [[message_text]]',
      returnPath: 'result.payload',
    },
  },
  {
    key: 'html',
    label: 'HTML текст',
    hint: 'HTML',
    values: {
      dryRun: true,
      parseMode: 'HTML',
      text: '<b>Привет, [[user_name]]</b>\\n[[message_text]]',
      returnPath: 'result.payload',
    },
  },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

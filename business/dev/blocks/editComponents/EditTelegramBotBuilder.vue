<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Telegram-бот"
      description="Готовые пресеты стартап-бота: polling, команды, MCP-демо, токен через resource."
      :actions="telegramPresets"
      :active="data.runtime"
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
      :model-value="data.runtime"
      label="Рантайм"
      class="w-full"
      @change="updateData({ runtime: $event })"
    >
      <option value="python">python</option>
      <option value="node">node</option>
    </ui-select>
    <ui-input
      :model-value="data.appName"
      label="Имя приложения"
      class="w-full"
      placeholder="silverback-telegram-bot"
      @change="updateData({ appName: $event })"
    />
    <ui-input
      :model-value="data.tokenResource"
      label="Ресурс токена"
      class="w-full"
      placeholder="telegram_bot_token"
      @change="updateData({ tokenResource: $event })"
    />
    <ui-input
      :model-value="data.startText"
      label="Стартовый текст"
      class="w-full"
      @change="updateData({ startText: $event })"
    />
    <label class="input-label">JSON обработчиков команд</label>
    <ui-textarea
      :model-value="data.commandHandlersJson"
      class="w-full font-mono"
      rows="8"
      spellcheck="false"
      @change="updateData({ commandHandlersJson: $event })"
    />
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.dir"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать путь бота в переменную
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

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const telegramPresets = [
  {
    key: 'python-basic',
    label: 'Python-бот',
    hint: 'polling',
    values: {
      runtime: 'python',
      appName: 'silverback-telegram-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Silverback-бот запущен',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong" },\n  { "command": "status", "response": "bot is alive" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'python-mcp',
    label: 'MCP демо-бот',
    hint: 'status/upper',
    values: {
      runtime: 'python',
      appName: 'silverback-telegram-mcp-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'MCP-бот запущен: /ping /status /upper текст',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong от MCP-моста" },\n  { "command": "status", "response": "MCP workflow готов" },\n  { "command": "upper", "response": "Используйте MCP-блок uppercase в workflow" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'node-basic',
    label: 'Node-бот',
    hint: 'telegraf',
    values: {
      runtime: 'node',
      appName: 'silverback-telegraf-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Silverback Node-бот запущен',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong" },\n  { "command": "status", "response": "Node-бот работает" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'startup',
    label: 'Бот для стартапа',
    hint: 'лиды',
    values: {
      runtime: 'python',
      appName: 'silverback-startup-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Отправьте /lead для старта',
      commandHandlersJson: '[\n  { "command": "lead", "response": "Лид принят. Workflow обработает его." },\n  { "command": "help", "response": "Команды: /lead /status" }\n]',
      returnPath: 'result.dir',
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

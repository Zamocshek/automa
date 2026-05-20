<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Telegram bot"
      description="Готовые пресеты стартап-бота: polling, команды, MCP-демо, токен через resource."
      :actions="telegramPresets"
      :active="data.runtime"
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
      :model-value="data.runtime"
      label="Runtime"
      class="w-full"
      @change="updateData({ runtime: $event })"
    >
      <option value="python">python</option>
      <option value="node">node</option>
    </ui-select>
    <ui-input
      :model-value="data.appName"
      label="App name"
      class="w-full"
      placeholder="silverback-telegram-bot"
      @change="updateData({ appName: $event })"
    />
    <ui-input
      :model-value="data.tokenResource"
      label="Token resource"
      class="w-full"
      placeholder="telegram_bot_token"
      @change="updateData({ tokenResource: $event })"
    />
    <ui-input
      :model-value="data.startText"
      label="Start text"
      class="w-full"
      @change="updateData({ startText: $event })"
    />
    <label class="input-label">Command handlers JSON</label>
    <ui-textarea
      :model-value="data.commandHandlersJson"
      class="w-full font-mono"
      rows="8"
      spellcheck="false"
      @change="updateData({ commandHandlersJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="result.dir"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Assign bot path to variable
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

const telegramPresets = [
  {
    key: 'python-basic',
    label: 'Python bot',
    hint: 'polling',
    values: {
      runtime: 'python',
      appName: 'silverback-telegram-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Silverback bot online',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong" },\n  { "command": "status", "response": "bot is alive" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'python-mcp',
    label: 'MCP demo bot',
    hint: 'status/upper',
    values: {
      runtime: 'python',
      appName: 'silverback-telegram-mcp-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'MCP bot online: /ping /status /upper text',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong from MCP bridge" },\n  { "command": "status", "response": "MCP workflow is ready" },\n  { "command": "upper", "response": "Use MCP uppercase block in workflow" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'node-basic',
    label: 'Node bot',
    hint: 'telegraf',
    values: {
      runtime: 'node',
      appName: 'silverback-telegraf-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Silverback Node bot online',
      commandHandlersJson: '[\n  { "command": "ping", "response": "pong" },\n  { "command": "status", "response": "node bot is alive" }\n]',
      returnPath: 'result.dir',
    },
  },
  {
    key: 'startup',
    label: 'Startup bot',
    hint: 'lead flow',
    values: {
      runtime: 'python',
      appName: 'silverback-startup-bot',
      tokenResource: 'telegram_bot_token',
      startText: 'Send /lead to start',
      commandHandlersJson: '[\n  { "command": "lead", "response": "Lead accepted. Workflow will process it." },\n  { "command": "help", "response": "Commands: /lead /status" }\n]',
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

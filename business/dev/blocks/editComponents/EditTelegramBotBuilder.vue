<template>
  <div class="space-y-2">
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
      placeholder="visual-coding-telegram-bot"
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
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

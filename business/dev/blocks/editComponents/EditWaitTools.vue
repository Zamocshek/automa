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
      :model-value="data.mode"
      label="Operation"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="sleep">sleep</option>
      <option value="file">wait file</option>
      <option value="http">wait HTTP</option>
      <option value="selector">wait selector</option>
      <option value="text">wait text</option>
      <option value="try">try action</option>
      <option value="retry">retry action</option>
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
        label="Path"
        class="w-full"
        @change="updateData({ path: $event })"
      />
      <ui-select
        :model-value="data.fileMode || 'exists'"
        label="File condition"
        class="w-full"
        @change="updateData({ fileMode: $event })"
      >
        <option value="exists">exists</option>
        <option value="not_exists">not exists</option>
        <option value="changed">changed</option>
        <option value="contains">contains text</option>
      </ui-select>
    </template>
    <template v-if="['http', 'selector', 'text'].includes(data.mode)">
      <ui-select
        v-if="['selector', 'text'].includes(data.mode)"
        :model-value="data.browserEngine || 'chromium'"
        label="Browser engine"
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
      label="Selector"
      class="w-full"
      @change="updateData({ selector: $event })"
    />
    <ui-input
      v-if="['file', 'http', 'text'].includes(data.mode)"
      :model-value="data.text"
      label="Text"
      class="w-full"
      @change="updateData({ text: $event })"
    />
    <ui-select
      v-if="['selector', 'text'].includes(data.mode)"
      :model-value="data.state || 'visible'"
      label="State"
      class="w-full"
      @change="updateData({ state: $event })"
    >
      <option value="visible">visible</option>
      <option value="attached">attached</option>
      <option value="hidden">hidden</option>
      <option value="detached">detached</option>
    </ui-select>
    <template v-if="['try', 'retry'].includes(data.mode)">
      <ui-input
        :model-value="data.retryAction"
        label="Action"
        class="w-full"
        @change="updateData({ retryAction: $event })"
      />
      <label class="input-label">Payload JSON</label>
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
        label="Attempts"
        class="w-full"
        type="number"
        @change="updateData({ attempts: Number($event) })"
      />
      <ui-input
        v-if="data.mode === 'retry'"
        :model-value="data.delaySeconds"
        label="Delay seconds"
        class="w-full"
        type="number"
        @change="updateData({ delaySeconds: Number($event) })"
      />
    </template>
    <ui-input
      v-if="data.mode !== 'sleep'"
      :model-value="data.timeoutSeconds"
      label="Timeout seconds"
      class="w-full"
      type="number"
      @change="updateData({ timeoutSeconds: Number($event) })"
    />
    <ui-input
      v-if="['file', 'http'].includes(data.mode)"
      :model-value="data.interval"
      label="Interval seconds"
      class="w-full"
      type="number"
      @change="updateData({ interval: Number($event) })"
    />
    <ui-checkbox
      v-if="['selector', 'text'].includes(data.mode)"
      :model-value="data.headless !== false"
      @change="updateData({ headless: $event })"
    >
      Headless browser
    </ui-checkbox>
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

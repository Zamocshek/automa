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
      label="Mode"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="scan">scan page</option>
      <option value="query">query selector</option>
      <option value="suggest">suggest selectors</option>
    </ui-select>
    <ui-select
      :model-value="data.source"
      label="Source"
      class="w-full"
      @change="updateData({ source: $event })"
    >
      <option value="url">URL</option>
      <option value="html">inline HTML</option>
    </ui-select>
    <ui-input
      v-if="data.source === 'url'"
      :model-value="data.url"
      label="URL"
      class="w-full"
      @change="updateData({ url: $event })"
    />
    <template v-else>
      <label class="input-label">Inline HTML</label>
      <ui-textarea
        :model-value="data.html"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ html: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'query'"
      :model-value="data.selector"
      label="CSS / XPath selector"
      class="w-full"
      @change="updateData({ selector: $event })"
    />
    <ui-input
      v-if="data.mode === 'suggest'"
      :model-value="data.hint"
      label="Selector hint"
      class="w-full"
      @change="updateData({ hint: $event })"
    />
    <ui-input
      :model-value="data.maxElements"
      label="Max elements"
      class="w-full"
      type="number"
      @change="updateData({ maxElements: Number($event) })"
    />
    <ui-checkbox
      :model-value="data.captureNetwork"
      @change="updateData({ captureNetwork: $event })"
    >
      Capture network events
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

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
    <label class="input-label">Packages JSON</label>
    <ui-textarea
      :model-value="data.packagesJson"
      class="w-full font-mono"
      rows="5"
      spellcheck="false"
      @change="updateData({ packagesJson: $event })"
    />
    <label class="input-label">Code</label>
    <ui-textarea
      :model-value="data.code"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ code: $event })"
    />
    <label class="input-label">Input JSON</label>
    <ui-textarea
      :model-value="data.inputJson"
      class="w-full font-mono"
      rows="6"
      spellcheck="false"
      @change="updateData({ inputJson: $event })"
    />
    <ui-input
      :model-value="data.executionTimeout"
      label="Execution timeout seconds"
      class="w-full"
      type="number"
      @change="updateData({ executionTimeout: Number($event) })"
    />
    <ui-input
      :model-value="data.installTimeout"
      label="Install timeout seconds"
      class="w-full"
      type="number"
      @change="updateData({ installTimeout: Number($event) })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="result"
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

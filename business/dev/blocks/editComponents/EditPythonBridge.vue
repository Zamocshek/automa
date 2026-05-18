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
    <ui-input
      :model-value="data.action"
      label="Action"
      class="w-full"
      placeholder="echo, uppercase, python_exec, json_get"
      @change="updateData({ action: $event })"
    />
    <label class="input-label">Payload JSON</label>
    <ui-textarea
      :model-value="data.payload"
      class="w-full font-mono"
      rows="10"
      spellcheck="false"
      @change="updateData({ payload: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="result"
      @change="updateData({ returnPath: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      label="Timeout ms"
      class="w-full"
      type="number"
      @change="updateData({ timeout: Number($event) })"
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
    <ui-checkbox
      :model-value="data.saveData"
      @change="updateData({ saveData: $event })"
    >
      Save result to data column
    </ui-checkbox>
    <ui-input
      v-if="data.saveData"
      :model-value="data.dataColumn"
      label="Data column"
      class="w-full"
      @change="updateData({ dataColumn: $event })"
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

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
      <option value="thread">thread</option>
      <option value="process">process</option>
    </ui-select>
    <ui-input
      :model-value="data.workers"
      label="Workers"
      class="w-full"
      type="number"
      @change="updateData({ workers: Number($event) })"
    />
    <ui-input
      :model-value="data.repeats"
      label="Repeats"
      class="w-full"
      type="number"
      @change="updateData({ repeats: Number($event) })"
    />
    <label class="input-label">Tasks JSON</label>
    <ui-textarea
      :model-value="data.tasksJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ tasksJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="summary"
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

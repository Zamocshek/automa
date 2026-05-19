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
    <div class="grid grid-cols-3 gap-2">
      <ui-input
        :model-value="data.start"
        label="Start"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
      <ui-input
        :model-value="data.end"
        label="End"
        type="number"
        @change="updateData({ end: Number($event) })"
      />
      <ui-input
        :model-value="data.step"
        label="Step"
        type="number"
        @change="updateData({ step: Number($event) })"
      />
    </div>
    <ui-checkbox
      :model-value="data.inclusive"
      @change="updateData({ inclusive: $event })"
    >
      Include end
    </ui-checkbox>
    <ui-input
      :model-value="data.indexName"
      label="Index variable"
      class="w-full"
      placeholder="i"
      @change="updateData({ indexName: $event })"
    />
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

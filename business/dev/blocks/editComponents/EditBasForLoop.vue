<template>
  <div class="space-y-2">
    <BasActionGrid
      title="For"
      description="BAS-цикл по числам: индекс, шаг, включать конец."
      :actions="forPresets"
      :active="`${data.start}:${data.end}:${data.step}`"
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
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const forPresets = [
  { key: '0:5:1', label: 'For 0..5', hint: 'i++', values: { start: 0, end: 5, step: 1, inclusive: false, indexName: 'i' } },
  { key: '1:10:1', label: 'For 1..10', hint: 'inclusive', values: { start: 1, end: 10, step: 1, inclusive: true, indexName: 'i' } },
  { key: '10:0:-1', label: 'Обратный цикл', hint: 'i--', values: { start: 10, end: 0, step: -1, inclusive: false, indexName: 'i' } },
  { key: '0:100:10', label: 'Шаг 10', hint: 'batch', values: { start: 0, end: 100, step: 10, inclusive: false, indexName: 'i' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

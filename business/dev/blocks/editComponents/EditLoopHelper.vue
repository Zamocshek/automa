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
      <option value="range">range</option>
      <option value="repeat">repeat item</option>
      <option value="chunk">chunk list</option>
      <option value="enumerate">enumerate list</option>
    </ui-select>
    <div v-if="data.mode === 'range'" class="grid grid-cols-3 gap-2">
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
      v-if="data.mode === 'range'"
      :model-value="data.inclusive"
      @change="updateData({ inclusive: $event })"
    >
      Include end
    </ui-checkbox>
    <template v-if="data.mode === 'repeat'">
      <label class="input-label">Item JSON</label>
      <ui-textarea
        :model-value="data.itemJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ itemJson: $event })"
      />
      <ui-input
        :model-value="data.times"
        label="Times"
        class="w-full"
        type="number"
        @change="updateData({ times: Number($event) })"
      />
    </template>
    <template v-if="['chunk', 'enumerate'].includes(data.mode)">
      <label class="input-label">Items JSON</label>
      <ui-textarea
        :model-value="data.itemsJson"
        class="w-full font-mono"
        rows="7"
        spellcheck="false"
        @change="updateData({ itemsJson: $event })"
      />
      <ui-input
        v-if="data.mode === 'chunk'"
        :model-value="data.size"
        label="Chunk size"
        class="w-full"
        type="number"
        @change="updateData({ size: Number($event) })"
      />
      <ui-input
        v-if="data.mode === 'enumerate'"
        :model-value="data.start"
        label="Start index"
        class="w-full"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
    </template>
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

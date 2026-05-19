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
      <option value="log">log</option>
      <option value="message">message</option>
      <option value="random">random number</option>
    </ui-select>
    <ui-select
      v-if="data.mode === 'log'"
      :model-value="data.level || 'info'"
      label="Level"
      class="w-full"
      @change="updateData({ level: $event })"
    >
      <option value="debug">debug</option>
      <option value="info">info</option>
      <option value="warn">warn</option>
      <option value="error">error</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'random'"
      :model-value="data.message"
      label="Message"
      class="w-full"
      @change="updateData({ message: $event })"
    />
    <template v-if="data.mode === 'log'">
      <label class="input-label">Data JSON</label>
      <ui-textarea
        :model-value="data.dataJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ dataJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'random'">
      <ui-input
        :model-value="data.min"
        label="Min"
        class="w-full"
        type="number"
        @change="updateData({ min: Number($event) })"
      />
      <ui-input
        :model-value="data.max"
        label="Max"
        class="w-full"
        type="number"
        @change="updateData({ max: Number($event) })"
      />
      <ui-checkbox
        :model-value="data.integer !== false"
        @change="updateData({ integer: $event })"
      >
        Integer
      </ui-checkbox>
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

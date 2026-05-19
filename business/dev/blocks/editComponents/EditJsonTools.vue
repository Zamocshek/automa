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
      <option value="create">create</option>
      <option value="get">get</option>
      <option value="keys">keys</option>
      <option value="values">values</option>
      <option value="count">count</option>
      <option value="set">set</option>
      <option value="delete">delete</option>
      <option value="parse">parse</option>
      <option value="stringify">stringify</option>
      <option value="valid">valid</option>
    </ui-select>
    <ui-select
      v-if="data.mode === 'create'"
      :model-value="data.shape"
      label="Shape"
      class="w-full"
      @change="updateData({ shape: $event })"
    >
      <option value="object">object</option>
      <option value="array">array</option>
    </ui-select>
    <template v-if="!['parse', 'valid'].includes(data.mode)">
      <label class="input-label">Data JSON</label>
      <ui-textarea
        :model-value="data.dataJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ dataJson: $event })"
      />
      <ui-input
        v-if="data.mode !== 'create'"
        :model-value="data.path"
        label="Path"
        class="w-full"
        placeholder="user.name"
        @change="updateData({ path: $event })"
      />
    </template>
    <template v-if="data.mode === 'set'">
      <label class="input-label">Value JSON</label>
      <ui-textarea
        :model-value="data.valueJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ valueJson: $event })"
      />
    </template>
    <template v-if="['parse', 'valid'].includes(data.mode)">
      <label class="input-label">JSON text</label>
      <ui-textarea
        :model-value="data.text"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ text: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'stringify'"
      :model-value="data.indent"
      label="Indent"
      class="w-full"
      type="number"
      @change="updateData({ indent: Number($event) })"
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

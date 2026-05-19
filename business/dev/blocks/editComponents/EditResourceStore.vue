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
      <option value="get">get</option>
      <option value="set">set</option>
      <option value="list">list</option>
      <option value="delete">delete</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'list'"
      :model-value="data.resourceName"
      label="Resource name"
      class="w-full"
      @change="updateData({ resourceName: $event })"
    />
    <template v-if="data.mode === 'set'">
      <ui-input
        :model-value="data.resourceType"
        label="Resource type"
        class="w-full"
        placeholder="string, number, list, file, url, token"
        @change="updateData({ resourceType: $event })"
      />
      <ui-input
        :model-value="data.resourceDescription"
        label="Resource description"
        class="w-full"
        @change="updateData({ resourceDescription: $event })"
      />
      <label class="input-label">Value JSON</label>
      <ui-textarea
        :model-value="data.resourceValue"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ resourceValue: $event })"
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

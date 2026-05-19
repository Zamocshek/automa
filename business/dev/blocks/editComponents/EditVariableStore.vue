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
      <option value="increment">increment</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'list'"
      :model-value="data.variableStoreName"
      label="Variable store name"
      class="w-full"
      @change="updateData({ variableStoreName: $event })"
    />
    <ui-input
      :model-value="data.variableScope"
      label="Scope"
      class="w-full"
      placeholder="project or workflow"
      @change="updateData({ variableScope: $event })"
    />
    <template v-if="data.mode === 'set'">
      <ui-select
        :model-value="data.variableType"
        label="Type"
        class="w-full"
        @change="updateData({ variableType: $event })"
      >
        <option value="any">any</option>
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="integer">integer</option>
        <option value="boolean">boolean</option>
        <option value="list">list</option>
        <option value="json">json</option>
      </ui-select>
      <ui-input
        :model-value="data.variableDescription"
        label="Variable description"
        class="w-full"
        @change="updateData({ variableDescription: $event })"
      />
      <label class="input-label">Value JSON</label>
      <ui-textarea
        :model-value="data.valueJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        @change="updateData({ valueJson: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'increment'"
      :model-value="data.delta"
      label="Delta"
      class="w-full"
      type="number"
      @change="updateData({ delta: Number($event) })"
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
      label="Automa variable name"
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

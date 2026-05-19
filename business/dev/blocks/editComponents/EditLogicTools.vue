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
      <option value="compare">compare</option>
      <option value="truthy">truthy</option>
      <option value="boolean">boolean group</option>
      <option value="choose">choose value</option>
    </ui-select>
    <ui-select
      v-if="data.mode !== 'truthy'"
      :model-value="data.operator"
      label="Operator"
      class="w-full"
      @change="updateData({ operator: $event })"
    >
      <option value="eq">eq</option>
      <option value="ne">ne</option>
      <option value="gt">gt</option>
      <option value="gte">gte</option>
      <option value="lt">lt</option>
      <option value="lte">lte</option>
      <option value="contains">contains</option>
      <option value="not_contains">not contains</option>
      <option value="starts_with">starts with</option>
      <option value="ends_with">ends with</option>
      <option value="regex">regex</option>
      <option value="in">in</option>
      <option value="not_in">not in</option>
      <option value="and">and</option>
      <option value="or">or</option>
      <option value="not">not</option>
    </ui-select>
    <template v-if="data.mode === 'boolean'">
      <label class="input-label">Values JSON</label>
      <ui-textarea
        :model-value="data.valuesJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        @change="updateData({ valuesJson: $event })"
      />
    </template>
    <template v-else>
      <label class="input-label">Left / value JSON</label>
      <ui-textarea
        :model-value="data.leftJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ leftJson: $event })"
      />
      <label v-if="data.mode !== 'truthy'" class="input-label">Right JSON</label>
      <ui-textarea
        v-if="data.mode !== 'truthy'"
        :model-value="data.rightJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ rightJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'choose'">
      <label class="input-label">When true JSON</label>
      <ui-textarea
        :model-value="data.whenTrueJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ whenTrueJson: $event })"
      />
      <label class="input-label">When false JSON</label>
      <ui-textarea
        :model-value="data.whenFalseJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ whenFalseJson: $event })"
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

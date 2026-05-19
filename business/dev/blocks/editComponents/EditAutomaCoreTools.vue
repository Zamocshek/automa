<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Description"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.mode"
      label="Mode"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="getVariable">get variable</option>
      <option value="setVariable">set variable</option>
      <option value="pushVariable">push variable</option>
      <option value="incrementVariable">increment variable</option>
      <option value="setTableColumn">set table column</option>
      <option value="getTable">get table</option>
      <option value="setGlobalData">set global data</option>
      <option value="getGlobalData">get global data</option>
      <option value="getPrevBlockData">get previous block data</option>
      <option value="snapshot">snapshot all core data</option>
    </ui-select>
    <ui-input
      v-if="usesName"
      :model-value="data.coreName"
      label="Name"
      class="w-full"
      placeholder="counter or column name"
      @change="updateData({ coreName: $event })"
    />
    <ui-input
      v-if="usesPath"
      :model-value="data.corePath"
      label="Path"
      class="w-full"
      placeholder="user.name or 0.email"
      @change="updateData({ corePath: $event })"
    />
    <template v-if="usesValue">
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
      v-if="data.mode === 'incrementVariable'"
      :model-value="data.delta"
      label="Delta"
      class="w-full"
      type="number"
      @change="updateData({ delta: Number($event) })"
    />
    <template v-if="usesDefault">
      <label class="input-label">Default JSON</label>
      <ui-textarea
        :model-value="data.defaultJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ defaultJson: $event })"
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
      label="Automa variable name"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
    <ui-checkbox
      :model-value="data.saveData"
      @change="updateData({ saveData: $event })"
    >
      Save result to table column
    </ui-checkbox>
    <ui-input
      v-if="data.saveData"
      :model-value="data.dataColumn"
      label="Table column"
      class="w-full"
      @change="updateData({ dataColumn: $event })"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const usesValue = computed(() =>
  ['setVariable', 'pushVariable', 'setTableColumn', 'setGlobalData'].includes(props.data.mode)
);
const usesPath = computed(() =>
  ['getTable', 'setGlobalData', 'getGlobalData', 'getPrevBlockData'].includes(props.data.mode)
);
const usesName = computed(() =>
  ['getVariable', 'setVariable', 'pushVariable', 'incrementVariable', 'setTableColumn', 'setGlobalData', 'getGlobalData'].includes(props.data.mode)
);
const usesDefault = computed(() =>
  ['getVariable', 'getTable', 'getGlobalData', 'getPrevBlockData'].includes(props.data.mode)
);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

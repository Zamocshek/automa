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
      <option value="schemaBuild">schema build</option>
      <option value="schemaGet">schema get</option>
      <option value="schemaList">schema list</option>
      <option value="schemaValidate">schema validate</option>
      <option value="parallelPlanBuild">parallel plan build</option>
      <option value="parallelPlanRun">parallel plan run</option>
      <option value="parallelPlanList">parallel plan list</option>
      <option value="designAppBuild">design app build</option>
      <option value="designAppVerify">design app verify</option>
    </ui-select>
    <ui-input
      v-if="usesSchemaName"
      :model-value="data.schemaName"
      label="Schema name"
      class="w-full"
      @change="updateData({ schemaName: $event })"
    />
    <ui-input
      v-if="data.mode === 'schemaBuild'"
      :model-value="data.schemaTitle"
      label="Schema title"
      class="w-full"
      @change="updateData({ schemaTitle: $event })"
    />
    <template v-if="usesFields">
      <label class="input-label">Fields JSON</label>
      <ui-textarea
        :model-value="data.fieldsJson"
        class="w-full font-mono"
        rows="9"
        spellcheck="false"
        @change="updateData({ fieldsJson: $event })"
      />
      <label class="input-label">Design tokens JSON</label>
      <ui-textarea
        :model-value="data.tokensJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ tokensJson: $event })"
      />
    </template>
    <label
      v-if="data.mode === 'schemaValidate'"
      class="input-label"
    >
      Values JSON
    </label>
    <ui-textarea
      v-if="data.mode === 'schemaValidate'"
      :model-value="data.valuesJson"
      class="w-full font-mono"
      rows="6"
      spellcheck="false"
      @change="updateData({ valuesJson: $event })"
    />
    <template v-if="usesPlan">
      <ui-input
        :model-value="data.planName"
        label="Plan name"
        class="w-full"
        @change="updateData({ planName: $event })"
      />
      <ui-select
        :model-value="data.planMode"
        label="Plan mode"
        class="w-full"
        @change="updateData({ planMode: $event })"
      >
        <option value="thread">thread</option>
        <option value="process">process</option>
      </ui-select>
      <ui-input
        :model-value="data.workers"
        label="Workers"
        type="number"
        class="w-full"
        @change="updateData({ workers: Number($event) })"
      />
      <ui-input
        :model-value="data.repeats"
        label="Repeats"
        type="number"
        class="w-full"
        @change="updateData({ repeats: Number($event) })"
      />
      <label class="input-label">Tasks JSON</label>
      <ui-textarea
        :model-value="data.tasksJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ tasksJson: $event })"
      />
      <ui-checkbox
        v-if="data.mode === 'parallelPlanRun'"
        :model-value="data.saveResult"
        @change="updateData({ saveResult: $event })"
      >
        Save last run result
      </ui-checkbox>
    </template>
    <template v-if="usesApp">
      <ui-input
        :model-value="data.appName"
        label="App name"
        class="w-full"
        @change="updateData({ appName: $event })"
      />
      <ui-input
        v-if="data.mode === 'designAppBuild'"
        :model-value="data.appTitle"
        label="App title"
        class="w-full"
        @change="updateData({ appTitle: $event })"
      />
      <ui-input
        v-if="data.mode === 'designAppVerify'"
        :model-value="data.projectPath"
        label="Project path"
        class="w-full"
        placeholder="optional absolute path"
        @change="updateData({ projectPath: $event })"
      />
      <ui-checkbox
        v-if="data.mode === 'designAppBuild'"
        :model-value="data.overwrite"
        @change="updateData({ overwrite: $event })"
      >
        Overwrite generated app
      </ui-checkbox>
      <ui-checkbox
        v-if="data.mode === 'designAppBuild'"
        :model-value="data.verify"
        @change="updateData({ verify: $event })"
      >
        Verify after build
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
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const usesSchemaName = computed(() => !['schemaList', 'parallelPlanList'].includes(props.data.mode));
const usesFields = computed(() => ['schemaBuild', 'designAppBuild'].includes(props.data.mode));
const usesPlan = computed(() => ['parallelPlanBuild', 'parallelPlanRun'].includes(props.data.mode));
const usesApp = computed(() => ['designAppBuild', 'designAppVerify'].includes(props.data.mode));

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Описание"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <BlockValueField
      help="bridge"
      :model-value="data.bridgeUrl"
      label="URL моста"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-select
      :model-value="data.mode"
      label="Режим"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="schemaBuild">собрать схему</option>
      <option value="schemaGet">получить схему</option>
      <option value="schemaList">список схем</option>
      <option value="schemaValidate">проверить схему</option>
      <option value="parallelPlanBuild">собрать план</option>
      <option value="parallelPlanRun">запустить план</option>
      <option value="parallelPlanList">список планов</option>
      <option value="designAppBuild">собрать приложение</option>
      <option value="designAppVerify">проверить приложение</option>
      <option value="runtimeFormBuild">собрать форму запуска</option>
      <option value="runtimeFormVerify">проверить форму запуска</option>
    </ui-select>
    <ui-input
      v-if="usesSchemaName"
      :model-value="data.schemaName"
      label="Имя схемы"
      class="w-full"
      @change="updateData({ schemaName: $event })"
    />
    <ui-input
      v-if="data.mode === 'schemaBuild'"
      :model-value="data.schemaTitle"
      label="Заголовок схемы"
      class="w-full"
      @change="updateData({ schemaTitle: $event })"
    />
    <template v-if="usesFields">
      <label class="input-label">JSON полей</label>
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
      JSON значений
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
        label="Имя плана"
        class="w-full"
        @change="updateData({ planName: $event })"
      />
      <ui-select
        :model-value="data.planMode"
        label="Режим плана"
        class="w-full"
        @change="updateData({ planMode: $event })"
      >
        <option value="thread">потоки</option>
        <option value="process">процессы</option>
      </ui-select>
      <ui-input
        :model-value="data.workers"
        label="Параллельные исполнители"
        type="number"
        class="w-full"
        @change="updateData({ workers: Number($event) })"
      />
      <ui-input
        :model-value="data.repeats"
        label="Повторы"
        type="number"
        class="w-full"
        @change="updateData({ repeats: Number($event) })"
      />
      <BlockValueField
      label="JSON задач"
      help="tasks"
      json="array"
      multiline
      templates
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
        label="Имя приложения"
        class="w-full"
        @change="updateData({ appName: $event })"
      />
      <ui-input
        v-if="['designAppBuild', 'runtimeFormBuild'].includes(data.mode)"
        :model-value="data.appTitle"
        label="Заголовок приложения"
        class="w-full"
        @change="updateData({ appTitle: $event })"
      />
      <ui-input
        v-if="['designAppVerify', 'runtimeFormVerify'].includes(data.mode)"
        :model-value="data.projectPath"
        label="Путь проекта"
        class="w-full"
        placeholder="необязательный абсолютный путь"
        @change="updateData({ projectPath: $event })"
      />
      <ui-checkbox
        v-if="['designAppBuild', 'runtimeFormBuild'].includes(data.mode)"
        :model-value="data.overwrite"
        @change="updateData({ overwrite: $event })"
      >
        Overwrite generated app
      </ui-checkbox>
      <ui-checkbox
        v-if="['designAppBuild', 'runtimeFormBuild'].includes(data.mode)"
        :model-value="data.verify"
        @change="updateData({ verify: $event })"
      >
        Verify after build
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'runtimeFormBuild'">
      <ui-select
        :model-value="data.runtime"
        label="Runtime"
        class="w-full"
        @change="updateData({ runtime: $event })"
      >
        <option value="system">System command</option>
        <option value="python">Python</option>
        <option value="node">Node</option>
      </ui-select>
      <ui-select
        :model-value="data.shell"
        label="Shell"
        class="w-full"
        @change="updateData({ shell: $event })"
      >
        <option value="powershell">PowerShell</option>
        <option value="cmd">cmd</option>
        <option value="pwsh">pwsh</option>
        <option value="bash">bash</option>
        <option value="sh">sh</option>
        <option value="none">direct</option>
      </ui-select>
      <ui-input
        :model-value="data.cwd"
        label="CWD"
        class="w-full"
        @change="updateData({ cwd: $event })"
      />
      <label class="input-label">Command</label>
      <ui-textarea
        :model-value="data.command"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ command: $event })"
      />
      <label class="input-label">Python / Node code</label>
      <ui-textarea
        :model-value="data.code"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ code: $event })"
      />
      <label class="input-label">ENV JSON</label>
      <ui-textarea
        :model-value="data.envJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ envJson: $event })"
      />
      <label class="input-label">ENV mapping JSON</label>
      <ui-textarea
        :model-value="data.envMappingJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ envMappingJson: $event })"
      />
      <label class="input-label">Input JSON</label>
      <ui-textarea
        :model-value="data.inputJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ inputJson: $event })"
      />
      <label class="input-label">Packages JSON</label>
      <ui-textarea
        :model-value="data.packagesJson"
        class="w-full font-mono"
        rows="3"
        spellcheck="false"
        @change="updateData({ packagesJson: $event })"
      />
      <label class="input-label">Android devices JSON</label>
      <ui-textarea
        :model-value="data.androidDevicesJson"
        class="w-full font-mono"
        rows="3"
        spellcheck="false"
        @change="updateData({ androidDevicesJson: $event })"
      />
      <label class="input-label">Android tasks JSON</label>
      <ui-textarea
        :model-value="data.androidTasksJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ androidTasksJson: $event })"
      />
      <ui-checkbox
        :model-value="data.dryRun"
        @change="updateData({ dryRun: $event })"
      >
        Dry run by default
      </ui-checkbox>
    </template>
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать результат в переменную
    </ui-checkbox>
    <BlockValueField
      v-if="data.assignVariable"
      help="variableName"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
import BlockValueField from './BlockValueField.vue';
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const usesSchemaName = computed(() => !['schemaList', 'parallelPlanList', 'runtimeFormVerify'].includes(props.data.mode));
const usesFields = computed(() => ['schemaBuild', 'designAppBuild', 'runtimeFormBuild'].includes(props.data.mode));
const usesPlan = computed(() => ['parallelPlanBuild', 'parallelPlanRun'].includes(props.data.mode));
const usesApp = computed(() => ['designAppBuild', 'designAppVerify', 'runtimeFormBuild', 'runtimeFormVerify'].includes(props.data.mode));

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Команда системы"
      description="BAS-кубик для cmd/PowerShell: выполнить команду, получить stdout/stderr и сохранить результат в переменную."
      :actions="commandPresets"
      :active="data.shell"
      @select="selectPreset"
    />
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
      :model-value="data.shell"
      label="Движок команды"
      class="w-full"
      @change="updateData({ shell: $event })"
    >
      <option value="cmd">cmd.exe</option>
      <option value="powershell">PowerShell</option>
      <option value="pwsh">PowerShell 7</option>
      <option value="sh">sh/bash</option>
      <option value="none">Без shell</option>
    </ui-select>
    <label class="input-label">Команда</label>
    <ui-textarea
      :model-value="data.command"
      class="w-full font-mono"
      rows="7"
      spellcheck="false"
      placeholder="echo Hello [[user_name]]"
      @change="updateData({ command: $event })"
    />
    <ui-input
      :model-value="data.cwd"
      label="Рабочая папка"
      class="w-full"
      placeholder="."
      @change="updateData({ cwd: $event })"
    />
    <label class="input-label">stdin / входной текст</label>
    <ui-textarea
      :model-value="data.inputText"
      class="w-full font-mono"
      rows="4"
      spellcheck="false"
      placeholder="Можно подставлять [[VARIABLE]]"
      @change="updateData({ inputText: $event })"
    />
    <label class="input-label">ENV JSON</label>
    <ui-textarea
      :model-value="data.envJson"
      class="w-full font-mono"
      rows="5"
      spellcheck="false"
      placeholder="{&quot;TOKEN&quot;:&quot;[[value_token]]&quot;}"
      @change="updateData({ envJson: $event })"
    />
    <ui-input
      :model-value="data.executionTimeout"
      label="Таймаут, сек"
      class="w-full"
      type="number"
      @change="updateData({ executionTimeout: Number($event) })"
    />
    <ui-input
      :model-value="data.maxOutputChars"
      label="Макс. символов вывода"
      class="w-full"
      type="number"
      @change="updateData({ maxOutputChars: Number($event) })"
    />
    <ui-checkbox
      :model-value="data.dryRun"
      @change="updateData({ dryRun: $event })"
    >
      Только показать команду, не запускать
    </ui-checkbox>
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.stdout"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать output в переменную Automa
    </ui-checkbox>
    <BlockValueField
      v-if="data.assignVariable"
      help="variableName"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      placeholder="cmd_output"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
import BlockValueField from './BlockValueField.vue';
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const commandPresets = [
  {
    key: 'cmd-echo',
    label: 'CMD echo',
    hint: 'stdout',
    values: {
      shell: 'cmd',
      command: 'echo Hello [[user_name]]',
      returnPath: 'result.stdout',
      variableName: 'cmd_output',
    },
  },
  {
    key: 'powershell-version',
    label: 'PowerShell',
    hint: '$PSVersion',
    values: {
      shell: 'powershell',
      command: '$PSVersionTable.PSVersion.ToString()',
      returnPath: 'result.stdout',
      variableName: 'powershell_output',
    },
  },
  {
    key: 'git-status',
    label: 'Git status',
    hint: 'repo',
    values: {
      shell: 'cmd',
      command: 'git status --short --branch',
      cwd: '.',
      returnPath: 'result.stdout',
      variableName: 'git_status',
    },
  },
  {
    key: 'python-version',
    label: 'Python version',
    hint: 'py',
    values: {
      shell: 'cmd',
      command: 'py --version',
      returnPath: 'result.stdout',
      variableName: 'python_version',
    },
  },
  {
    key: 'dry-run',
    label: 'Dry run',
    hint: 'safe',
    values: {
      shell: 'cmd',
      command: 'echo [[VARIABLE]]',
      dryRun: true,
      returnPath: 'result.command',
      variableName: 'command_preview',
    },
  },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

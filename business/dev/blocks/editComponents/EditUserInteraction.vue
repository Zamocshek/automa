<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Взаимодействие с пользователем"
      description="BAS-кубик из статьи: messageBox, запрос ввода, звук, ручное управление вкладкой и JS в web interface."
      :actions="interactionPresets"
      :active="data.mode"
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
      :model-value="data.mode"
      label="Операция"
      class="w-full"
      @change="selectMode"
    >
      <option value="messageBox">Сообщение</option>
      <option value="requestInput">request input</option>
      <option value="playSound">play sound</option>
      <option value="manualControl">manual browser control</option>
      <option value="executeUiJs">execute JS in web interface</option>
    </ui-select>
    <ui-input
      :model-value="data.title"
      label="Заголовок"
      class="w-full"
      placeholder="Silverback Coding"
      @change="updateData({ title: $event })"
    />
    <label class="input-label">Сообщение / prompt</label>
    <ui-textarea
      :model-value="data.message"
      class="w-full"
      rows="4"
      placeholder="Привет, [[user_name]]. Проверьте шаг и продолжайте."
      @change="updateData({ message: $event })"
    />
    <template v-if="data.mode === 'requestInput'">
      <ui-input
        :model-value="data.inputName"
        label="Имя переменной ввода"
        class="w-full"
        placeholder="user_input"
        @change="updateInputName"
      />
      <ui-input
        :model-value="data.defaultValue"
        label="Значение по умолчанию"
        class="w-full"
        placeholder="[[default_name]]"
        @change="updateData({ defaultValue: $event })"
      />
    </template>
    <template v-if="data.mode === 'playSound'">
      <ui-input
        :model-value="data.frequency"
        label="Частота"
        class="w-full"
        type="number"
        @change="updateData({ frequency: Number($event) })"
      />
      <ui-input
        :model-value="data.durationMs"
        label="Длительность, мс"
        class="w-full"
        type="number"
        @change="updateData({ durationMs: Number($event) })"
      />
      <ui-input
        :model-value="data.volume"
        label="Громкость"
        class="w-full"
        type="number"
        step="0.01"
        @change="updateData({ volume: Number($event) })"
      />
    </template>
    <template v-if="data.mode === 'executeUiJs'">
      <label class="input-label">Input JSON</label>
      <ui-textarea
        :model-value="data.inputJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        placeholder="{&quot;message&quot;:&quot;[[VARIABLE]]&quot;}"
        @change="updateData({ inputJson: $event })"
      />
      <label class="input-label">JS код в активной странице</label>
      <ui-textarea
        :model-value="data.code"
        class="w-full font-mono"
        rows="7"
        spellcheck="false"
        placeholder="result = input.message;"
        @change="updateData({ code: $event })"
      />
    </template>
    <template v-if="data.mode === 'manualControl'">
      <label class="input-label">Инструкция оператору</label>
      <ui-textarea
        :model-value="data.instructions"
        class="w-full"
        rows="4"
        placeholder="Откройте активную вкладку, выполните ручной шаг и подтвердите checkpoint."
        @change="updateData({ instructions: $event })"
      />
      <ui-checkbox
        :model-value="data.createIntervention !== false"
        @change="updateData({ createIntervention: $event, wait: $event && data.wait })"
      >
        Создать manual intervention checkpoint
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.wait"
        @change="updateData({ wait: $event, createIntervention: $event || data.createIntervention })"
      >
        Ждать ответа оператора
      </ui-checkbox>
    </template>
    <ui-input
      v-if="['messageBox', 'requestInput', 'manualControl'].includes(data.mode)"
      :model-value="data.timeoutSeconds"
      label="Таймаут, сек"
      class="w-full"
      type="number"
      min="1"
      max="86400"
      @change="updateData({ timeoutSeconds: Number($event) })"
    />
    <ui-checkbox
      :model-value="data.logToBridge !== false"
      @change="updateData({ logToBridge: $event })"
    >
      Записать действие в bridge/MCP trace
    </ui-checkbox>
    <BlockValueField
      help="returnPath"
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.value"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать результат в переменную Automa
    </ui-checkbox>
    <BlockValueField
      v-if="data.assignVariable"
      help="variableName"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      placeholder="user_input"
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

const interactionPresets = [
  {
    key: 'messageBox',
    label: 'Message box',
    hint: 'alert',
    values: {
      mode: 'messageBox',
      message: 'Привет, [[user_name]]. Проверьте шаг и продолжайте.',
      returnPath: 'result',
      variableName: 'message_box',
    },
  },
  {
    key: 'requestInput',
    label: 'Request input',
    hint: 'prompt',
    values: {
      mode: 'requestInput',
      inputName: 'user_input',
      message: 'Введите значение для [[field_name]]',
      defaultValue: '',
      returnPath: 'result.value',
      variableName: 'user_input',
    },
  },
  {
    key: 'playSound',
    label: 'Play sound',
    hint: 'beep',
    values: {
      mode: 'playSound',
      frequency: 880,
      durationMs: 240,
      volume: 0.18,
      returnPath: 'result.played',
      variableName: 'sound_played',
    },
  },
  {
    key: 'manualControl',
    label: 'Manual browser',
    hint: 'operator',
    values: {
      mode: 'manualControl',
      message: 'Нужен ручной шаг в активной вкладке.',
      instructions: 'Возьмите управление браузером, выполните действие и подтвердите checkpoint.',
      createIntervention: true,
      wait: true,
      returnPath: 'result.bridge',
      variableName: 'manual_control',
    },
  },
  {
    key: 'executeUiJs',
    label: 'Web JS',
    hint: 'page',
    values: {
      mode: 'executeUiJs',
      inputJson: '{\n  "message": "[[user_name]]"\n}',
      code: 'result = document.title || input.message;',
      returnPath: 'result.value',
      variableName: 'ui_js_result',
    },
  },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData({ createIntervention: false, wait: false, ...action.values });
}

function selectMode(mode) {
  const preset = interactionPresets.find((action) => action.key === mode);
  if (preset) selectPreset(preset);
}

function updateInputName(inputName) {
  const variableName = !props.data.variableName || props.data.variableName === props.data.inputName
    ? inputName
    : props.data.variableName;
  updateData({ inputName, variableName });
}
</script>

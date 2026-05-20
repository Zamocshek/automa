<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Логика скрипта"
      description="If/boolean/choose в формате простых действий для визуального workflow."
      :actions="logicPresets"
      :active="data.mode"
      @select="selectPreset"
    />
    <ui-textarea
      :model-value="data.description"
      placeholder="Описание"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
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
      <option value="compare">compare</option>
      <option value="truthy">truthy</option>
      <option value="boolean">boolean-группа</option>
      <option value="choose">выбор значения</option>
    </ui-select>
    <ui-select
      v-if="data.mode !== 'truthy'"
      :model-value="data.operator"
      label="Оператор"
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
      <label class="input-label">JSON значений</label>
      <ui-textarea
        :model-value="data.valuesJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        @change="updateData({ valuesJson: $event })"
      />
    </template>
    <template v-else>
      <label class="input-label">Левое значение JSON</label>
      <ui-textarea
        :model-value="data.leftJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ leftJson: $event })"
      />
      <label v-if="data.mode !== 'truthy'" class="input-label">Правое значение JSON</label>
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
      <label class="input-label">JSON если true</label>
      <ui-textarea
        :model-value="data.whenTrueJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ whenTrueJson: $event })"
      />
      <label class="input-label">JSON если false</label>
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
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Имя переменной"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const logicPresets = [
  { key: 'if-eq', label: 'Если равно', hint: '==', values: { mode: 'compare', operator: 'eq', returnPath: 'result' } },
  { key: 'if-contains', label: 'Если содержит', hint: 'contains', values: { mode: 'compare', operator: 'contains', leftJson: '"silverback coding"', rightJson: '"coding"', returnPath: 'result' } },
  { key: 'regex', label: 'Проверка regex', hint: 'regex', values: { mode: 'compare', operator: 'regex', rightJson: '"coding"', returnPath: 'result' } },
  { key: 'truthy', label: 'Проверить true/false', hint: 'bool', values: { mode: 'truthy', leftJson: 'true', returnPath: 'result' } },
  { key: 'and', label: 'И (AND)', hint: 'all', values: { mode: 'boolean', operator: 'and', valuesJson: '[true, true]', returnPath: 'result' } },
  { key: 'or', label: 'ИЛИ (OR)', hint: 'any', values: { mode: 'boolean', operator: 'or', valuesJson: '[true, false]', returnPath: 'result' } },
  { key: 'not', label: 'НЕ (NOT)', hint: 'invert', values: { mode: 'boolean', operator: 'not', valuesJson: '[false]', returnPath: 'result' } },
  { key: 'choose', label: 'Выбрать значение', hint: 'true/false', values: { mode: 'choose', operator: 'eq', whenTrueJson: '"ok"', whenFalseJson: '"fail"', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

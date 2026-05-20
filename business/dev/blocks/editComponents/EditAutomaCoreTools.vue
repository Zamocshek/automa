<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Описание"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.mode"
      label="Режим"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="getVariable">получить переменную</option>
      <option value="setVariable">записать переменную</option>
      <option value="pushVariable">добавить в переменную</option>
      <option value="incrementVariable">увеличить переменную</option>
      <option value="setTableColumn">записать колонку таблицы</option>
      <option value="getTable">получить таблицу</option>
      <option value="setGlobalData">записать globalData</option>
      <option value="getGlobalData">получить globalData</option>
      <option value="getPrevBlockData">данные прошлого блока</option>
      <option value="snapshot">снимок всех данных</option>
    </ui-select>
    <ui-input
      v-if="usesName"
      :model-value="data.coreName"
      label="Имя"
      class="w-full"
      placeholder="counter или имя колонки"
      @change="updateData({ coreName: $event })"
    />
    <ui-input
      v-if="usesPath"
      :model-value="data.corePath"
      label="Путь"
      class="w-full"
      placeholder="user.name or 0.email"
      @change="updateData({ corePath: $event })"
    />
    <template v-if="usesValue">
      <label class="input-label">JSON значения</label>
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
      label="Дельта"
      class="w-full"
      type="number"
      @change="updateData({ delta: Number($event) })"
    />
    <template v-if="usesDefault">
      <label class="input-label">JSON по умолчанию</label>
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
      label="Имя переменной Automa"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
    <ui-checkbox
      :model-value="data.saveData"
      @change="updateData({ saveData: $event })"
    >
      Сохранить результат в колонку таблицы
    </ui-checkbox>
    <ui-input
      v-if="data.saveData"
      :model-value="data.dataColumn"
      label="Колонка таблицы"
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

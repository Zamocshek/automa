<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Списки"
      description="Готовые действия со списками: создать, добавить, получить, удалить, сравнить."
      :actions="listPresets"
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
      @change="updateData({ mode: $event })"
    >
      <option value="create">create</option>
      <option value="length">length</option>
      <option value="append">append</option>
      <option value="get">Получить</option>
      <option value="first">first</option>
      <option value="last">last</option>
      <option value="random">random</option>
      <option value="insert">insert</option>
      <option value="set">Записать</option>
      <option value="remove">remove</option>
      <option value="removeValue">delete by value</option>
      <option value="contains">contains</option>
      <option value="slice">slice</option>
      <option value="removeRange">remove range</option>
      <option value="join">join</option>
      <option value="parse">parse string</option>
      <option value="index">index</option>
      <option value="copy">copy</option>
      <option value="sort">sort</option>
      <option value="dedupe">dedupe</option>
      <option value="shuffle">shuffle</option>
      <option value="merge">merge</option>
      <option value="compare">compare</option>
      <option value="filterContains">filter contains</option>
    </ui-select>
    <label class="input-label">JSON элементов</label>
    <ui-textarea
      :model-value="data.itemsJson"
      class="w-full font-mono"
      rows="7"
      spellcheck="false"
      @change="updateData({ itemsJson: $event })"
    />
    <template v-if="['append', 'insert', 'set', 'removeValue', 'contains', 'index'].includes(data.mode)">
      <label class="input-label">JSON элемента</label>
      <ui-textarea
        :model-value="data.itemJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ itemJson: $event })"
      />
    </template>
    <ui-input
      v-if="['get', 'insert', 'set', 'remove'].includes(data.mode)"
      :model-value="data.index"
      label="Индекс"
      class="w-full"
      type="number"
      @change="updateData({ index: Number($event) })"
    />
    <div v-if="['slice', 'removeRange'].includes(data.mode)" class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.start"
        label="Старт"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
      <ui-input
        v-if="data.mode === 'slice'"
        :model-value="data.end"
        label="Конец"
        @change="updateData({ end: $event })"
      />
      <ui-input
        v-if="data.mode === 'removeRange'"
        :model-value="data.count"
        label="Количество"
        type="number"
        @change="updateData({ count: Number($event) })"
      />
    </div>
    <template v-if="['join', 'parse'].includes(data.mode)">
      <ui-input
        :model-value="data.separator"
        label="Разделитель"
        class="w-full"
        @change="updateData({ separator: $event })"
      />
      <ui-input
        v-if="data.mode === 'parse'"
        :model-value="data.text"
        label="Текст"
        class="w-full"
        @change="updateData({ text: $event })"
      />
    </template>
    <template v-if="['sort', 'filterContains'].includes(data.mode)">
      <ui-input
        :model-value="data.key"
        label="Ключ объекта"
        class="w-full"
        placeholder="name"
        @change="updateData({ key: $event })"
      />
      <ui-checkbox
        v-if="data.mode === 'sort'"
        :model-value="data.reverse"
        @change="updateData({ reverse: $event })"
      >
        Обратная сортировка
      </ui-checkbox>
      <ui-input
        v-if="data.mode === 'filterContains'"
        :model-value="data.text"
        label="Содержит текст"
        class="w-full"
        @change="updateData({ text: $event })"
      />
    </template>
    <template v-if="data.mode === 'merge'">
      <label class="input-label">JSON списков</label>
      <ui-textarea
        :model-value="data.listsJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ listsJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'compare'">
      <ui-select
        :model-value="data.compareMode"
        label="Режим сравнения"
        class="w-full"
        @change="updateData({ compareMode: $event })"
      >
        <option value="equals">равны</option>
        <option value="same_items">те же элементы</option>
        <option value="intersection">пересечение</option>
        <option value="difference">разница</option>
      </ui-select>
      <label class="input-label">JSON правого списка</label>
      <ui-textarea
        :model-value="data.rightJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ rightJson: $event })"
      />
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
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const listPresets = [
  { key: 'create', label: 'Создать список', hint: '[]', values: { mode: 'create', itemsJson: '[]', returnPath: 'result' } },
  { key: 'append', label: 'Добавить элемент', hint: 'push', values: { mode: 'append', itemJson: '"new item"', returnPath: 'result' } },
  { key: 'get', label: 'Получить элемент', hint: 'index', values: { mode: 'get', index: 0, returnPath: 'result' } },
  { key: 'first', label: 'Первый элемент', hint: 'first', values: { mode: 'first', returnPath: 'result' } },
  { key: 'last', label: 'Последний элемент', hint: 'last', values: { mode: 'last', returnPath: 'result' } },
  { key: 'random', label: 'Случайный элемент', hint: 'random', values: { mode: 'random', returnPath: 'result' } },
  { key: 'insert', label: 'Вставить элемент', hint: 'insert', values: { mode: 'insert', index: 0, itemJson: '"inserted"', returnPath: 'result' } },
  { key: 'set', label: 'Установить элемент', hint: 'set', values: { mode: 'set', index: 0, itemJson: '"updated"', returnPath: 'result' } },
  { key: 'remove', label: 'Удалить по индексу', hint: 'remove', values: { mode: 'remove', index: 0, returnPath: 'result' } },
  { key: 'remove-value', label: 'Удалить по значению', hint: 'value', values: { mode: 'removeValue', itemJson: '"alpha"', returnPath: 'result' } },
  { key: 'contains', label: 'Содержит', hint: 'contains', values: { mode: 'contains', itemJson: '"alpha"', returnPath: 'result' } },
  { key: 'slice', label: 'Подсписок', hint: 'slice', values: { mode: 'slice', start: 0, end: 2, returnPath: 'result' } },
  { key: 'remove-range', label: 'Удалить часть', hint: 'range', values: { mode: 'removeRange', start: 0, count: 1, returnPath: 'result' } },
  { key: 'dedupe', label: 'Удалить дубликаты', hint: 'unique', values: { mode: 'dedupe', returnPath: 'result' } },
  { key: 'join', label: 'Объединить в строку', hint: 'join', values: { mode: 'join', separator: ',', returnPath: 'result' } },
  { key: 'parse', label: 'Парсить строку', hint: 'split', values: { mode: 'parse', text: 'a,b,c', separator: ',', returnPath: 'result' } },
  { key: 'sort', label: 'Сортировать', hint: 'sort', values: { mode: 'sort', reverse: false, returnPath: 'result' } },
  { key: 'index', label: 'Получить индекс', hint: 'index', values: { mode: 'index', itemJson: '"alpha"', returnPath: 'result' } },
  { key: 'copy', label: 'Копировать список', hint: 'copy', values: { mode: 'copy', returnPath: 'result' } },
  { key: 'shuffle', label: 'Перемешать список', hint: 'shuffle', values: { mode: 'shuffle', returnPath: 'result' } },
  { key: 'merge', label: 'Объединить списки', hint: 'merge', values: { mode: 'merge', listsJson: '[["a"], ["b"]]', returnPath: 'result' } },
  { key: 'compare', label: 'Сравнить списки', hint: 'compare', values: { mode: 'compare', compareMode: 'same_items', rightJson: '[]', returnPath: 'result' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

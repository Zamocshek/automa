<template>
  <div class="space-y-2">
    <BasActionGrid
      :current="data"
      title="Ресурсы"
      description="Секреты, URL, токены и настройки проекта как reusable BAS-ресурсы."
      :actions="resourcePresets"
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
      label="Режим"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="get">Получить</option>
      <option value="set">Записать</option>
      <option value="list">Показать список</option>
      <option value="delete">Удалить</option>
    </ui-select>
    <BlockValueField
      v-if="data.mode !== 'list'"
      help="resourceName"
      :model-value="data.resourceName"
      label="Имя ресурса"
      class="w-full"
      @change="updateData({ resourceName: $event })"
    />
    <template v-if="data.mode === 'set'">
      <ui-select
        :model-value="data.resourceType"
        label="Тип ресурса"
        class="w-full"
        @change="updateData({ resourceType: $event })"
      >
        <option value="string">Строка</option>
        <option value="number">Число</option>
        <option value="string-generator">Генератор строк</option>
        <option value="random-number">Случайное число</option>
        <option value="list">Список</option>
        <option value="from-file">Из файла</option>
        <option value="from-url">По ссылке</option>
        <option value="files-from-folder">Файлы из папки</option>
        <option value="database">База данных</option>
        <option value="checkbox">Флажок</option>
        <option value="info">Информация</option>
        <option value="secret">Секрет / токен</option>
        <option value="url">URL</option>
        <option value="proxy">Прокси</option>
      </ui-select>
      <ui-input
        :model-value="data.resourceDescription"
        label="Описание ресурса"
        class="w-full"
        @change="updateData({ resourceDescription: $event })"
      />
      <div class="grid grid-cols-2 gap-2">
        <ui-input
          :model-value="data.resourceDescriptionEn"
          label="Описание на английском"
          class="w-full"
          @change="updateData({ resourceDescriptionEn: $event })"
        />
        <ui-input
          :model-value="data.resourceDescriptionRu"
          label="Описание на русском"
          class="w-full"
          @change="updateData({ resourceDescriptionRu: $event })"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <ui-input
          :model-value="data.resourceHintEn || data.resourceHint"
          label="Подсказка на английском"
          class="w-full"
          @change="updateData({ resourceHintEn: $event, resourceHint: $event })"
        />
        <ui-input
          :model-value="data.resourceHintRu"
          label="Подсказка на русском"
          class="w-full"
          @change="updateData({ resourceHintRu: $event })"
        />
      </div>
      <ui-input
        :model-value="data.resourceGroup"
        label="Группа"
        class="w-full"
        placeholder="Telegram, Android, Browser, Env"
        @change="updateData({ resourceGroup: $event })"
      />
      <div class="grid grid-cols-2 gap-2">
        <ui-checkbox
          :model-value="data.allowEmpty !== false"
          @change="updateData({ allowEmpty: $event })"
        >
          Разрешить пустое значение
        </ui-checkbox>
        <ui-checkbox
          :model-value="Boolean(data.multiline)"
          @change="updateData({ multiline: $event })"
        >
          Многострочное значение
        </ui-checkbox>
      </div>
      <BlockValueField
      label="JSON значения"
      :help="data.resourceType === 'secret' ? 'secret' : 'json'"
      json="any"
      multiline
      templates
        :model-value="data.resourceValue"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ resourceValue: $event })"
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

const resourcePresets = [
  { key: 'token', label: 'Создать токен', hint: 'секрет', values: { mode: 'set', resourceName: 'telegram_bot_token', resourceType: 'secret', resourceDescription: 'Токен подставляется локально', resourceValue: '"<TOKEN>"', returnPath: 'result.name' } },
  { key: 'string', label: 'Строка', hint: 'text', values: { mode: 'set', resourceName: 'text_value', resourceType: 'string', resourceValue: '"value"', allowEmpty: true, multiline: false, returnPath: 'result.name' } },
  { key: 'number', label: 'Число', hint: '123', values: { mode: 'set', resourceName: 'thread_count', resourceType: 'number', resourceValue: '4', returnPath: 'result.value' } },
  { key: 'string-generator', label: 'Генератор строк', hint: 'gen', values: { mode: 'set', resourceName: 'generated_login', resourceType: 'string-generator', resourceValue: '"user_{{random}}"', returnPath: 'result.value' } },
  { key: 'random-number', label: 'Случайное число', hint: 'rand', values: { mode: 'set', resourceName: 'random_delay', resourceType: 'random-number', resourceValue: '0', returnPath: 'result.value' } },
  { key: 'url', label: 'Создать URL', hint: 'api', values: { mode: 'set', resourceName: 'api_url', resourceType: 'url', resourceValue: '"https://example.com/api"', returnPath: 'result.name' } },
  { key: 'proxy', label: 'Создать прокси', hint: 'proxy', values: { mode: 'set', resourceName: 'proxy_url', resourceType: 'proxy', resourceValue: '"http://user:pass@host:port"', returnPath: 'result.name' } },
  { key: 'list', label: 'Создать список', hint: 'list', values: { mode: 'set', resourceName: 'items', resourceType: 'list', resourceValue: '["alpha", "beta"]', returnPath: 'result.name' } },
  { key: 'from-file', label: 'Из файла', hint: 'file', values: { mode: 'set', resourceName: 'input_file', resourceType: 'from-file', resourceValue: '"runtime/data/input.txt"', returnPath: 'result.value' } },
  { key: 'from-url', label: 'По ссылке', hint: 'url', values: { mode: 'set', resourceName: 'remote_feed', resourceType: 'from-url', resourceValue: '"https://example.com/feed.json"', returnPath: 'result.value' } },
  { key: 'files-folder', label: 'Файлы из папки', hint: 'folder', values: { mode: 'set', resourceName: 'input_folder_files', resourceType: 'files-from-folder', resourceValue: '["runtime/data/input"]', returnPath: 'result.value' } },
  { key: 'database', label: 'База данных', hint: 'db', values: { mode: 'set', resourceName: 'sqlite_db', resourceType: 'database', resourceValue: '"runtime/data/app.sqlite"', returnPath: 'result.value' } },
  { key: 'checkbox', label: 'Флажок', hint: 'bool', values: { mode: 'set', resourceName: 'dry_run', resourceType: 'checkbox', resourceValue: 'true', returnPath: 'result.value' } },
  { key: 'info', label: 'Информация', hint: 'note', values: { mode: 'set', resourceName: 'operator_note', resourceType: 'info', resourceValue: '"Fill env fields before Execute."', returnPath: 'result.value' } },
  { key: 'get', label: 'Получить ресурс', hint: 'get', values: { mode: 'get', returnPath: 'result.value' } },
  { key: 'all', label: 'Все ресурсы', hint: 'list', values: { mode: 'list', returnPath: 'result' } },
  { key: 'delete', label: 'Удалить ресурс', hint: 'delete', values: { mode: 'delete', returnPath: 'result.deleted' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

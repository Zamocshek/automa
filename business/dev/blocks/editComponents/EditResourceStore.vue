<template>
  <div class="space-y-2">
    <BasActionGrid
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
      <option value="get">get</option>
      <option value="set">set</option>
      <option value="list">list</option>
      <option value="delete">delete</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'list'"
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
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="string-generator">String generator</option>
        <option value="random-number">Random number</option>
        <option value="list">List</option>
        <option value="from-file">From file</option>
        <option value="from-url">From URL</option>
        <option value="files-from-folder">Files from folder</option>
        <option value="database">Database</option>
        <option value="checkbox">CheckBox</option>
        <option value="info">Info</option>
        <option value="secret">Secret/token</option>
        <option value="url">URL</option>
        <option value="proxy">Proxy</option>
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
          label="English description"
          class="w-full"
          @change="updateData({ resourceDescriptionEn: $event })"
        />
        <ui-input
          :model-value="data.resourceDescriptionRu"
          label="Russian description"
          class="w-full"
          @change="updateData({ resourceDescriptionRu: $event })"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <ui-input
          :model-value="data.resourceHintEn || data.resourceHint"
          label="Hint EN"
          class="w-full"
          @change="updateData({ resourceHintEn: $event, resourceHint: $event })"
        />
        <ui-input
          :model-value="data.resourceHintRu"
          label="Hint RU"
          class="w-full"
          @change="updateData({ resourceHintRu: $event })"
        />
      </div>
      <ui-input
        :model-value="data.resourceGroup"
        label="Group"
        class="w-full"
        placeholder="Telegram, Android, Browser, Env"
        @change="updateData({ resourceGroup: $event })"
      />
      <div class="grid grid-cols-2 gap-2">
        <ui-checkbox
          :model-value="data.allowEmpty !== false"
          @change="updateData({ allowEmpty: $event })"
        >
          Allow empty value
        </ui-checkbox>
        <ui-checkbox
          :model-value="Boolean(data.multiline)"
          @change="updateData({ multiline: $event })"
        >
          Multiline
        </ui-checkbox>
      </div>
      <label class="input-label">JSON значения</label>
      <ui-textarea
        :model-value="data.resourceValue"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ resourceValue: $event })"
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

const resourcePresets = [
  { key: 'token', label: 'Создать токен', hint: 'секрет', values: { mode: 'set', resourceName: 'telegram_bot_token', resourceType: 'secret', resourceDescription: 'Токен подставляется локально', resourceValue: '"<TOKEN>"', returnPath: 'result.name' } },
  { key: 'string', label: 'String', hint: 'text', values: { mode: 'set', resourceName: 'text_value', resourceType: 'string', resourceValue: '"value"', allowEmpty: true, multiline: false, returnPath: 'result.name' } },
  { key: 'number', label: 'Number', hint: '123', values: { mode: 'set', resourceName: 'thread_count', resourceType: 'number', resourceValue: '4', returnPath: 'result.value' } },
  { key: 'string-generator', label: 'String generator', hint: 'gen', values: { mode: 'set', resourceName: 'generated_login', resourceType: 'string-generator', resourceValue: '"user_{{random}}"', returnPath: 'result.value' } },
  { key: 'random-number', label: 'Random number', hint: 'rand', values: { mode: 'set', resourceName: 'random_delay', resourceType: 'random-number', resourceValue: '0', returnPath: 'result.value' } },
  { key: 'url', label: 'Создать URL', hint: 'api', values: { mode: 'set', resourceName: 'api_url', resourceType: 'url', resourceValue: '"https://example.com/api"', returnPath: 'result.name' } },
  { key: 'proxy', label: 'Создать прокси', hint: 'proxy', values: { mode: 'set', resourceName: 'proxy_url', resourceType: 'proxy', resourceValue: '"http://user:pass@host:port"', returnPath: 'result.name' } },
  { key: 'list', label: 'Создать список', hint: 'list', values: { mode: 'set', resourceName: 'items', resourceType: 'list', resourceValue: '["alpha", "beta"]', returnPath: 'result.name' } },
  { key: 'from-file', label: 'From file', hint: 'file', values: { mode: 'set', resourceName: 'input_file', resourceType: 'from-file', resourceValue: '"runtime/data/input.txt"', returnPath: 'result.value' } },
  { key: 'from-url', label: 'From URL', hint: 'url', values: { mode: 'set', resourceName: 'remote_feed', resourceType: 'from-url', resourceValue: '"https://example.com/feed.json"', returnPath: 'result.value' } },
  { key: 'files-folder', label: 'Files from folder', hint: 'folder', values: { mode: 'set', resourceName: 'input_folder_files', resourceType: 'files-from-folder', resourceValue: '["runtime/data/input"]', returnPath: 'result.value' } },
  { key: 'database', label: 'Database', hint: 'db', values: { mode: 'set', resourceName: 'sqlite_db', resourceType: 'database', resourceValue: '"runtime/data/app.sqlite"', returnPath: 'result.value' } },
  { key: 'checkbox', label: 'CheckBox', hint: 'bool', values: { mode: 'set', resourceName: 'dry_run', resourceType: 'checkbox', resourceValue: 'true', returnPath: 'result.value' } },
  { key: 'info', label: 'Info', hint: 'note', values: { mode: 'set', resourceName: 'operator_note', resourceType: 'info', resourceValue: '"Fill env fields before Execute."', returnPath: 'result.value' } },
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

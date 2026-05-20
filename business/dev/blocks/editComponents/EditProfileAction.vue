<template>
  <div class="space-y-2">
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
      label="Операция"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="create">create</option>
      <option value="list">list</option>
      <option value="get">get</option>
      <option value="copy">copy</option>
      <option value="metadata">записать метаданные</option>
      <option value="importCookies">импорт cookies</option>
      <option value="exportCookies">экспорт cookies</option>
      <option value="lock">lock</option>
      <option value="release">release</option>
      <option value="delete">delete</option>
    </ui-select>
    <ui-select
      v-if="!['list'].includes(data.mode)"
      :model-value="data.browserEngine || 'chromium'"
      label="Движок браузера"
      class="w-full"
      @change="updateData({ browserEngine: $event })"
    >
      <option value="chromium">chromium</option>
      <option value="firefox">firefox</option>
      <option value="webkit">webkit</option>
      <option value="camoufox">camoufox</option>
    </ui-select>
    <ui-input
      v-if="data.mode !== 'list'"
      :model-value="data.profileName"
      label="Профиль"
      class="w-full"
      @change="updateData({ profileName: $event })"
    />
    <ui-input
      v-if="data.mode === 'copy'"
      :model-value="data.targetProfileName"
      label="Целевой профиль"
      class="w-full"
      @change="updateData({ targetProfileName: $event })"
    />
    <ui-input
      v-if="['create', 'metadata'].includes(data.mode)"
      :model-value="data.profileDescription"
      label="Описание"
      class="w-full"
      @change="updateData({ profileDescription: $event })"
    />
    <template v-if="data.mode === 'metadata'">
      <label class="input-label">JSON метаданных</label>
      <ui-textarea
        :model-value="data.metadataJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ metadataJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'importCookies'">
      <label class="input-label">JSON cookies</label>
      <ui-textarea
        :model-value="data.cookiesJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ cookiesJson: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'release'"
      :model-value="data.lockToken"
      label="Lock-токен"
      class="w-full"
      @change="updateData({ lockToken: $event })"
    />
    <ui-checkbox
      v-if="['delete', 'release'].includes(data.mode)"
      :model-value="data.force"
      @change="updateData({ force: $event })"
    >
      Принудительно
    </ui-checkbox>
    <ui-checkbox
      v-if="data.mode === 'copy'"
      :model-value="data.overwrite"
      @change="updateData({ overwrite: $event })"
    >
      Перезаписать цель
    </ui-checkbox>
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
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>

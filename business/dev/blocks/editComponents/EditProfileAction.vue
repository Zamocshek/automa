<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Profiles / Fingerprint"
      description="BAS-style browser profile, cookie and Camoufox fingerprint operations as visible actions."
      :actions="profilePresets"
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
      <option value="fingerprintGet">get fingerprint</option>
      <option value="fingerprintApply">apply fingerprint</option>
      <option value="fingerprintPerformance">performance fingerprint</option>
      <option value="fingerprintOverride">override key</option>
      <option value="fingerprintCancelOverride">cancel override</option>
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
    <template v-if="['metadata', 'fingerprintApply', 'fingerprintPerformance'].includes(data.mode)">
      <label class="input-label">JSON метаданных</label>
      <ui-textarea
        :model-value="data.metadataJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ metadataJson: $event })"
      />
    </template>
    <template v-if="['fingerprintOverride', 'fingerprintCancelOverride'].includes(data.mode)">
      <ui-input
        :model-value="data.fingerprintKey"
        label="Fingerprint key"
        class="w-full"
        placeholder="user_agent"
        @change="updateData({ fingerprintKey: $event })"
      />
      <label v-if="data.mode === 'fingerprintOverride'" class="input-label">JSON value</label>
      <ui-textarea
        v-if="data.mode === 'fingerprintOverride'"
        :model-value="data.fingerprintValueJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ fingerprintValueJson: $event })"
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
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const profilePresets = [
  { key: 'create', label: 'Create profile', hint: 'permanent', values: { mode: 'create', browserEngine: 'chromium', returnPath: 'result' } },
  { key: 'switch-permanent', label: 'Switch permanent', hint: 'profile', values: { mode: 'get', returnPath: 'result' } },
  { key: 'switch-temporary', label: 'Switch temporary', hint: 'copy', values: { mode: 'copy', targetProfileName: 'temp-browser-profile', overwrite: true, returnPath: 'result' } },
  { key: 'copy', label: 'Copy profile folder', hint: 'copy', values: { mode: 'copy', targetProfileName: 'demo-browser-profile-copy', returnPath: 'result' } },
  { key: 'delete', label: 'Delete profile', hint: 'delete', values: { mode: 'delete', force: false, returnPath: 'result.deleted' } },
  { key: 'info', label: 'Current profile info', hint: 'info', values: { mode: 'get', returnPath: 'result' } },
  { key: 'get-fingerprint', label: 'Get fingerprint', hint: 'read', values: { mode: 'fingerprintGet', browserEngine: 'camoufox', returnPath: 'result.fingerprint' } },
  { key: 'apply-fingerprint', label: 'Apply fingerprint', hint: 'apply', values: { mode: 'fingerprintApply', browserEngine: 'camoufox', metadataJson: '{\n  "fingerprint": {\n    "os_type": "windows",\n    "screen_width": 1366,\n    "screen_height": 768\n  }\n}', returnPath: 'result.metadata.fingerprint' } },
  { key: 'performance', label: 'Performance fingerprint', hint: 'perf', values: { mode: 'fingerprintPerformance', browserEngine: 'camoufox', metadataJson: '{\n  "hardwareConcurrency": 4,\n  "deviceMemory": 8,\n  "webglEnabled": true\n}', returnPath: 'result.metadata.fingerprint' } },
  { key: 'override-key', label: 'Override key', hint: 'key', values: { mode: 'fingerprintOverride', browserEngine: 'camoufox', fingerprintKey: 'user_agent', fingerprintValueJson: '"Mozilla/5.0"', returnPath: 'result.metadata.fingerprintOverrides' } },
  { key: 'cancel-override', label: 'Cancel override', hint: 'clear', values: { mode: 'fingerprintCancelOverride', browserEngine: 'camoufox', fingerprintKey: '', returnPath: 'result.metadata.fingerprintOverrides' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>

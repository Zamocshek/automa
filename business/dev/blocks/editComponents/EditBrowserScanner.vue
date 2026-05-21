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
      label="Режим"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="scan">скан страницы</option>
      <option value="recon">Playwright recon plan</option>
      <option value="query">проверка CSS/XPath</option>
      <option value="suggest">подбор селекторов</option>
    </ui-select>
    <ui-select
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
      :model-value="data.profileName"
      label="Профиль браузера"
      class="w-full"
      placeholder="account-01"
      @change="updateData({ profileName: $event })"
    />
    <ui-checkbox
      :model-value="data.autoCreateProfile !== false"
      @change="updateData({ autoCreateProfile: $event })"
    >
      Автоматически создавать профиль
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.syncCamoufoxProfile"
      @change="updateData({ syncCamoufoxProfile: $event })"
    >
      Sync Camoufox manager profile before run
    </ui-checkbox>
    <template v-if="data.syncCamoufoxProfile">
      <ui-input
        :model-value="data.camoufoxManagerPath"
        label="Camoufox manager path"
        class="w-full"
        placeholder="runtime/reference/camoumgr"
        @change="updateData({ camoufoxManagerPath: $event })"
      />
      <ui-input
        :model-value="data.camoufoxManagerProfileName"
        label="Manager profile name"
        class="w-full"
        placeholder="account-01"
        @change="updateData({ camoufoxManagerProfileName: $event })"
      />
      <ui-input
        :model-value="data.camoufoxTargetPrefix"
        label="Silverback profile prefix"
        class="w-full"
        placeholder="camoumgr-"
        @change="updateData({ camoufoxTargetPrefix: $event })"
      />
      <ui-checkbox
        :model-value="data.camoufoxCopyData"
        @change="updateData({ camoufoxCopyData: $event })"
      >
        Copy profile data directory
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.camoufoxOverwriteData"
        @change="updateData({ camoufoxOverwriteData: $event })"
      >
        Overwrite copied profile data
      </ui-checkbox>
    </template>
    <ui-checkbox
      :model-value="data.headless !== false"
      @change="updateData({ headless: $event })"
    >
      Headless-браузер
    </ui-checkbox>
    <ui-select
      :model-value="data.source"
      label="Источник"
      class="w-full"
      @change="updateData({ source: $event })"
    >
      <option value="url">URL</option>
      <option value="html">inline HTML</option>
    </ui-select>
    <ui-input
      v-if="data.source === 'url'"
      :model-value="data.url"
      label="URL"
      class="w-full"
      @change="updateData({ url: $event })"
    />
    <template v-else>
      <label class="input-label">Inline HTML</label>
      <ui-textarea
        :model-value="data.html"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ html: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'query'"
      :model-value="data.selector"
      label="CSS / XPath селектор"
      class="w-full"
      @change="updateData({ selector: $event })"
    />
    <ui-input
      v-if="data.mode === 'suggest'"
      :model-value="data.hint"
      label="Подсказка селектора"
      class="w-full"
      @change="updateData({ hint: $event })"
    />
    <template v-if="data.mode === 'recon'">
      <ui-input
        :model-value="data.intent"
        label="Задача автоматизации"
        class="w-full"
        placeholder="Изучить форму логина, кнопки, API-запросы"
        @change="updateData({ intent: $event })"
      />
      <ui-input
        :model-value="data.hint"
        label="Подсказка селектора"
        class="w-full"
        placeholder="login, submit, search"
        @change="updateData({ hint: $event })"
      />
      <ui-input
        :model-value="data.waitSelector"
        label="Ждать CSS селектор"
        class="w-full"
        placeholder="main, form, button"
        @change="updateData({ waitSelector: $event })"
      />
      <ui-checkbox
        :model-value="data.screenshot"
        @change="updateData({ screenshot: $event })"
      >
        Сохранить скриншот
      </ui-checkbox>
    </template>
    <ui-input
      :model-value="data.maxElements"
      label="Максимум элементов"
      class="w-full"
      type="number"
      @change="updateData({ maxElements: Number($event) })"
    />
    <ui-checkbox
      :model-value="data.captureNetwork || data.mode === 'recon'"
      @change="updateData({ captureNetwork: $event })"
    >
      Захватывать сетевые события
    </ui-checkbox>
    <ui-input
      :model-value="data.networkPolicyName"
      label="Network policy name"
      class="w-full"
      placeholder="login-recorder-policy"
      @change="updateData({ networkPolicyName: $event })"
    />
    <ui-checkbox
      :model-value="data.buildNetworkPolicy"
      @change="updateData({ buildNetworkPolicy: $event })"
    >
      Build/update policy before run
    </ui-checkbox>
    <ui-select
      :model-value="data.networkPolicyDefaultAction || 'continue'"
      label="Default request action"
      class="w-full"
      @change="updateData({ networkPolicyDefaultAction: $event })"
    >
      <option value="continue">continue</option>
      <option value="block">block</option>
    </ui-select>
    <ui-input
      :model-value="data.networkPolicyEventLimit"
      label="Policy event limit"
      class="w-full"
      type="number"
      @change="updateData({ networkPolicyEventLimit: Number($event) })"
    />
    <label class="input-label">Network policy rules JSON</label>
    <ui-textarea
      :model-value="data.networkPolicyRulesJson"
      class="w-full font-mono"
      rows="7"
      spellcheck="false"
      @change="updateData({ networkPolicyRulesJson: $event })"
    />
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

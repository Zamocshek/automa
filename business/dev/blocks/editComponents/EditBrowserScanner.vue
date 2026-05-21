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

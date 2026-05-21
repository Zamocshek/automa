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
    <ui-input
      :model-value="data.appName"
      label="Имя приложения"
      class="w-full"
      placeholder="silverback-coding-demo"
      @change="updateData({ appName: $event })"
    />
    <label class="input-label">Упаковка</label>
    <ui-select
      :model-value="data.packageMode"
      class="w-full"
      @change="updateData({ packageMode: $event })"
    >
      <option value="none">Только папка runtime/builds</option>
      <option value="pyinstaller">PyInstaller .exe</option>
    </ui-select>
    <div v-if="data.packageMode === 'pyinstaller'" class="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <ui-checkbox
        :model-value="data.packageOnefile !== false"
        @change="updateData({ packageOnefile: $event })"
      >
        Один .exe файл
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.packageWindowed"
        @change="updateData({ packageWindowed: $event })"
      >
        Оконный режим без консоли
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.packageDryRun !== false"
        @change="updateData({ packageDryRun: $event })"
      >
        Dry-run упаковки
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.packageAllowInstall"
        @change="updateData({ packageAllowInstall: $event })"
      >
        Разрешить установку PyInstaller
      </ui-checkbox>
      <ui-input
        :model-value="data.packageTimeout"
        label="Таймаут упаковки, сек"
        type="number"
        class="w-full"
        @change="updateData({ packageTimeout: Number($event) })"
      />
    </div>
    <label class="input-label">JSON действий</label>
    <ui-textarea
      :model-value="data.actionsJson"
      class="w-full font-mono"
      rows="12"
      spellcheck="false"
      @change="updateData({ actionsJson: $event })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Путь результата"
      class="w-full"
      placeholder="result.dir"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Записать путь сборки в переменную
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

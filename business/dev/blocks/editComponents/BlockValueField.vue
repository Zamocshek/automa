<template>
  <div
    ref="root"
    class="block-value-field"
    :class="{ 'has-references': tokens.length, 'has-error': issue }"
  >
    <label :for="id" class="input-label">{{ label }}</label>
    <div class="relative">
      <component
        :is="multiline ? 'textarea' : 'input'"
        :id="id"
        ref="input"
        :value="draft"
        :placeholder="placeholder"
        :type="multiline ? undefined : 'text'"
        :rows="multiline ? rows : undefined"
        :aria-describedby="`${id}-help`"
        :aria-invalid="issue ? 'true' : undefined"
        :spellcheck="false"
        class="bg-input w-full rounded-lg px-4 py-2"
        @input="updateValue($event.target.value)"
        @select="rememberSelection"
        @keyup="rememberSelection"
        @click="rememberSelection"
        @blur="rememberSelection"
      />
    </div>
    <p
      :id="`${id}-help`"
      class="field-help"
      :role="issue ? 'alert' : undefined"
    >
      {{ issue ? t(`authoring.errors.${issue}`) : t(`authoring.help.${help}`) }}
    </p>
    <div
      v-if="tokens.length"
      class="field-references"
      :aria-label="t('authoring.references')"
    >
      <code v-for="token in tokens" :key="token">{{ token }}</code>
    </div>
    <div v-if="templates && names.length" class="field-insert">
      <select
        v-model="selected"
        :aria-label="t('authoring.chooseVariable')"
        class="bg-input min-w-0 grow rounded px-2 py-1"
      >
        <option value="" disabled>{{ t('authoring.chooseVariable') }}</option>
        <option v-for="name in names" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!selected"
        :title="t('authoring.insertVariable')"
        :aria-label="t('authoring.insertVariable')"
        @click="insertVariable"
      >
        <v-remixicon name="riAddLine" />
      </button>
    </div>
  </div>
</template>
<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useComponentId } from '@/composable/componentId';
import { jsonIssue, references } from './fieldAssistance';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  help: { type: String, default: 'value' },
  placeholder: { type: String, default: '' },
  json: { type: String, default: '' },
  rows: { type: [Number, String], default: 5 },
  multiline: Boolean,
  templates: Boolean,
});
const emit = defineEmits(['change']);
const { t } = useI18n();
const id = useComponentId('block-field');
const input = ref(null);
const root = ref(null);
const selected = ref('');
const draft = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => {
    draft.value = value;
  }
);
const names = inject('blockVariableNames', ref([]));
const tokens = computed(() => (props.templates ? references(draft.value) : []));
const issue = computed(() =>
  props.json ? jsonIssue(draft.value, props.json) : ''
);
let selection = null;
function updateValue(value) {
  draft.value = value;
  emit('change', value);
}
function rememberSelection() {
  selection = [input.value.selectionStart, input.value.selectionEnd];
}
async function insertVariable() {
  if (!selected.value) return;
  const value = String(draft.value ?? '');
  const [start, end] = selection || [value.length, value.length];
  const token = `[[${selected.value}]]`;
  updateValue(value.slice(0, start) + token + value.slice(end));
  await nextTick();
  input.value.focus();
  input.value.setSelectionRange(start + token.length, start + token.length);
  rememberSelection();
}
</script>
<style scoped>
.block-value-field {
  min-width: 0;
}
.field-help {
  margin: 4px 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--silverback-muted, #6b7280);
  overflow-wrap: anywhere;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.dark .field-help {
  color: #bbc3cd;
}
.has-references input,
.has-references textarea {
  box-shadow: inset 3px 0 #14b8a6;
}
.has-error input,
.has-error textarea {
  outline: 1px solid #ef4444;
}
.has-error .field-help {
  color: #ef4444;
}
.field-references {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin: 4px 0;
}
.field-references code {
  font-size: 12px;
  color: var(--silverback-text, #0f766e);
  overflow-wrap: anywhere;
}
.dark .field-references code {
  color: #5eead4;
}
.field-insert {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
}
.field-insert button {
  flex: 0 0 28px;
  height: 28px;
}
.field-insert button:disabled {
  opacity: 0.4;
}
</style>

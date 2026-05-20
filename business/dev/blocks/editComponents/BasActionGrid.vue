<template>
  <section class="bas-action-panel">
    <div class="bas-action-header">
      <p class="bas-action-title">{{ title }}</p>
      <span v-if="badge" class="bas-action-badge">{{ badge }}</span>
    </div>
    <p v-if="description" class="bas-action-description">
      {{ description }}
    </p>
    <div class="bas-action-grid">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="bas-action-button"
        :class="{ active: isActive(action) }"
        @click="$emit('select', action)"
      >
        <span class="bas-action-label">{{ action.label }}</span>
        <small v-if="action.hint" class="bas-action-hint">{{ action.hint }}</small>
      </button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'BAS-действия',
  },
  description: {
    type: String,
    default: '',
  },
  badge: {
    type: String,
    default: 'пресет',
  },
  active: {
    type: String,
    default: '',
  },
  actions: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['select']);

function isActive(action) {
  if (!props.active) return false;

  const values = action?.values || {};
  const candidates = [
    action?.key,
    values.mode,
    values.operation,
    values.runtime,
    values.method,
    values.resourceType,
    values.template,
  ].filter(Boolean);

  return candidates.some((candidate) => String(candidate) === String(props.active));
}
</script>

<style scoped>
.bas-action-panel {
  padding: 10px;
  border: 1px solid rgba(139, 92, 246, 0.34);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(19, 14, 29, 0.96), rgba(9, 8, 13, 0.96));
}

.bas-action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.bas-action-title {
  margin: 0;
  color: #f5f3ff;
  font-size: 13px;
  font-weight: 700;
}

.bas-action-badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.22);
  color: #c4b5fd;
  font-size: 10px;
  text-transform: uppercase;
}

.bas-action-description {
  margin: 0 0 8px;
  color: #a7a3b7;
  font-size: 11px;
  line-height: 1.35;
}

.bas-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.bas-action-button {
  min-height: 42px;
  padding: 8px 9px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #f8f7ff;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.bas-action-button:hover,
.bas-action-button.active {
  border-color: rgba(167, 139, 250, 0.8);
  background: rgba(139, 92, 246, 0.22);
}

.bas-action-button:active {
  transform: translateY(1px);
}

.bas-action-label {
  display: block;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.2;
}

.bas-action-hint {
  display: block;
  margin-top: 3px;
  color: #c4b5fd;
  font-size: 10px;
  line-height: 1.2;
}
</style>

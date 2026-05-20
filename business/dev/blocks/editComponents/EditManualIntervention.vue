<template>
  <div class="space-y-2">
    <bas-action-grid
      title="Manual / captcha presets"
      description="Safe checkpoints for captcha, login, payment and human approval steps."
      :actions="presets"
      :active="data.mode"
      @select="applyPreset"
    />

    <ui-textarea
      :model-value="data.description"
      placeholder="Description"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.bridgeUrl"
      label="Bridge URL"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-select
      :model-value="data.mode"
      label="Mode"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="captchaCheck">captcha check</option>
      <option value="create">create checkpoint</option>
      <option value="wait">wait checkpoint</option>
      <option value="respond">respond checkpoint</option>
      <option value="list">list checkpoints</option>
    </ui-select>

    <template v-if="['captchaCheck', 'create'].includes(data.mode)">
      <ui-input
        :model-value="data.title"
        label="Title"
        class="w-full"
        @change="updateData({ title: $event })"
      />
      <ui-input
        :model-value="data.reason"
        label="Reason"
        class="w-full"
        @change="updateData({ reason: $event })"
      />
      <label class="input-label">Instructions</label>
      <ui-textarea
        :model-value="data.instructions"
        class="w-full"
        rows="4"
        @change="updateData({ instructions: $event })"
      />
    </template>

    <template v-if="data.mode === 'captchaCheck'">
      <ui-select
        :model-value="data.browserEngine || 'chromium'"
        label="Browser engine"
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
        label="Profile"
        class="w-full"
        @change="updateData({ profileName: $event })"
      />
      <ui-select
        :model-value="data.source"
        label="Source"
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
          rows="7"
          spellcheck="false"
          @change="updateData({ html: $event })"
        />
      </template>
      <ui-input
        :model-value="data.text"
        label="Extra text to check"
        class="w-full"
        @change="updateData({ text: $event })"
      />
      <ui-checkbox
        :model-value="data.screenshot !== false"
        @change="updateData({ screenshot: $event })"
      >
        Save screenshot for operator
      </ui-checkbox>
      <ui-checkbox
        :model-value="Boolean(data.force)"
        @change="updateData({ force: $event })"
      >
        Always create checkpoint
      </ui-checkbox>
      <ui-checkbox
        :model-value="Boolean(data.wait)"
        @change="updateData({ wait: $event })"
      >
        Wait for operator response
      </ui-checkbox>
    </template>

    <template v-if="['wait', 'respond'].includes(data.mode)">
      <ui-input
        :model-value="data.interventionId"
        label="Checkpoint ID"
        class="w-full"
        @change="updateData({ interventionId: $event })"
      />
    </template>
    <template v-if="data.mode === 'respond'">
      <ui-select
        :model-value="data.decision || 'resume'"
        label="Decision"
        class="w-full"
        @change="updateData({ decision: $event })"
      >
        <option value="resume">resume</option>
        <option value="approve">approve</option>
        <option value="skip">skip</option>
        <option value="reject">reject</option>
        <option value="fail">fail</option>
      </ui-select>
      <ui-input
        :model-value="data.note"
        label="Operator note"
        class="w-full"
        @change="updateData({ note: $event })"
      />
    </template>

    <ui-input
      :model-value="data.timeoutSeconds"
      label="Timeout seconds"
      class="w-full"
      type="number"
      @change="updateData({ timeoutSeconds: Number($event) })"
    />
    <ui-input
      :model-value="data.returnPath"
      label="Result path"
      class="w-full"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Assign result to variable
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Variable name"
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

const presets = [
  {
    key: 'captchaCheck',
    label: 'Captcha check',
    hint: 'scan + pause',
    values: {
      mode: 'captchaCheck',
      title: 'Captcha or manual check',
      reason: 'captcha_or_security_check',
      force: false,
      wait: false,
    },
  },
  {
    key: 'create',
    label: 'Pause',
    hint: 'manual gate',
    values: {
      mode: 'create',
      title: 'Manual approval required',
      reason: 'human_review',
      force: true,
      wait: false,
    },
  },
  {
    key: 'wait',
    label: 'Wait',
    hint: 'resume by ID',
    values: { mode: 'wait' },
  },
  {
    key: 'respond',
    label: 'Respond',
    hint: 'approve/reject',
    values: { mode: 'respond', decision: 'resume' },
  },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function applyPreset(action) {
  updateData(action.values || {});
}
</script>

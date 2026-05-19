<template>
  <div class="space-y-2">
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
      label="Operation"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="create">create</option>
      <option value="length">length</option>
      <option value="append">append</option>
      <option value="get">get</option>
      <option value="first">first</option>
      <option value="last">last</option>
      <option value="random">random</option>
      <option value="insert">insert</option>
      <option value="set">set</option>
      <option value="remove">remove</option>
      <option value="contains">contains</option>
      <option value="slice">slice</option>
      <option value="removeRange">remove range</option>
      <option value="join">join</option>
      <option value="parse">parse string</option>
      <option value="index">index</option>
      <option value="copy">copy</option>
      <option value="sort">sort</option>
      <option value="dedupe">dedupe</option>
      <option value="shuffle">shuffle</option>
      <option value="merge">merge</option>
      <option value="compare">compare</option>
      <option value="filterContains">filter contains</option>
    </ui-select>
    <label class="input-label">Items JSON</label>
    <ui-textarea
      :model-value="data.itemsJson"
      class="w-full font-mono"
      rows="7"
      spellcheck="false"
      @change="updateData({ itemsJson: $event })"
    />
    <template v-if="['append', 'insert', 'set', 'remove', 'contains', 'index'].includes(data.mode)">
      <label class="input-label">Item JSON</label>
      <ui-textarea
        :model-value="data.itemJson"
        class="w-full font-mono"
        rows="4"
        spellcheck="false"
        @change="updateData({ itemJson: $event })"
      />
    </template>
    <ui-input
      v-if="['get', 'insert', 'set', 'remove'].includes(data.mode)"
      :model-value="data.index"
      label="Index"
      class="w-full"
      type="number"
      @change="updateData({ index: Number($event) })"
    />
    <div v-if="['slice', 'removeRange'].includes(data.mode)" class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.start"
        label="Start"
        type="number"
        @change="updateData({ start: Number($event) })"
      />
      <ui-input
        v-if="data.mode === 'slice'"
        :model-value="data.end"
        label="End"
        @change="updateData({ end: $event })"
      />
      <ui-input
        v-if="data.mode === 'removeRange'"
        :model-value="data.count"
        label="Count"
        type="number"
        @change="updateData({ count: Number($event) })"
      />
    </div>
    <template v-if="['join', 'parse'].includes(data.mode)">
      <ui-input
        :model-value="data.separator"
        label="Separator"
        class="w-full"
        @change="updateData({ separator: $event })"
      />
      <ui-input
        v-if="data.mode === 'parse'"
        :model-value="data.text"
        label="Text"
        class="w-full"
        @change="updateData({ text: $event })"
      />
    </template>
    <template v-if="['sort', 'filterContains'].includes(data.mode)">
      <ui-input
        :model-value="data.key"
        label="Object key"
        class="w-full"
        placeholder="name"
        @change="updateData({ key: $event })"
      />
      <ui-checkbox
        v-if="data.mode === 'sort'"
        :model-value="data.reverse"
        @change="updateData({ reverse: $event })"
      >
        Reverse sort
      </ui-checkbox>
      <ui-input
        v-if="data.mode === 'filterContains'"
        :model-value="data.text"
        label="Contains text"
        class="w-full"
        @change="updateData({ text: $event })"
      />
    </template>
    <template v-if="data.mode === 'merge'">
      <label class="input-label">Lists JSON</label>
      <ui-textarea
        :model-value="data.listsJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ listsJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'compare'">
      <ui-select
        :model-value="data.compareMode"
        label="Compare mode"
        class="w-full"
        @change="updateData({ compareMode: $event })"
      >
        <option value="equals">equals</option>
        <option value="same_items">same items</option>
        <option value="intersection">intersection</option>
        <option value="difference">difference</option>
      </ui-select>
      <label class="input-label">Right list JSON</label>
      <ui-textarea
        :model-value="data.rightJson"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        @change="updateData({ rightJson: $event })"
      />
    </template>
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
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

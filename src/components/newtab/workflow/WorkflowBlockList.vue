<template>
  <ui-expand
    hide-header-icon
    header-class="flex items-center py-2 focus:ring-0 w-full text-left text-gray-600 dark:text-gray-200"
  >
    <template #header="{ show }">
      <span :class="category.color" class="h-3 w-3 rounded-full"></span>
      <p class="ml-2 flex-1 capitalize">
        {{ getCategoryName(category) }}
      </p>
      <v-remixicon :name="show ? 'riSubtractLine' : 'riAddLine'" size="20" />
    </template>
    <div class="mb-4 grid grid-cols-2 gap-2">
      <div
        v-for="block in blocks"
        :key="block.id"
        :title="getBlockTitle(block)"
        :data-block-id="block.id"
        draggable="true"
        class="bg-input group relative cursor-move select-none rounded-lg p-4 transition"
        @dragstart="onBlockDragStart($event, block)"
        @dblclick="$emit('add', block)"
      >
        <div
          class="absolute right-2 top-2 flex items-center text-gray-600 dark:text-gray-300"
        >
          <button
            :title="`${t('common.add')} ${getBlockName(block)}`"
            :aria-label="`${t('common.add')} ${getBlockName(block)}`"
            :data-add-block-id="block.id"
            class="cursor-pointer rounded bg-white/80 p-0.5 opacity-100 shadow-sm transition dark:bg-gray-900/80"
            @click.stop="$emit('add', block)"
          >
            <v-remixicon name="riAddLine" size="18" />
          </button>
          <a
            :href="`https://docs.extension.automa.site/blocks/${block.id}.html`"
            :title="t('common.docs')"
            target="_blank"
            rel="noopener"
            class="invisible group-hover:visible"
          >
            <v-remixicon name="riInformationLine" size="18" />
          </a>
          <span
            :title="`${pinned.includes(block.id) ? 'Unpin' : 'Pin'} block`"
            class="invisible ml-1 cursor-pointer group-hover:visible"
            @click="$emit('pin', block)"
          >
            <v-remixicon
              size="18"
              :name="
                pinned.includes(block.id) ? 'riPushpin2Fill' : 'riPushpin2Line'
              "
            />
          </span>
        </div>
        <img
          v-if="block.icon.startsWith('http')"
          :src="block.icon"
          alt=""
          width="24"
          class="mb-2 dark:invert"
        />
        <v-remixicon
          v-else
          :path="getIconPath(block.icon)"
          :name="block.icon"
          size="24"
          class="mb-2"
        />
        <p class="block-catalog-name leading-tight">
          {{ getBlockName(block) }}
        </p>
        <div
          v-if="block.tag"
          class="flex items-center justify-center absolute top-0 right-0 min-w-[52px] h-[22px] group-hover:invisible rounded-tr-lg rounded-bl-[22px] rounded-tl-0 rounded-br-0 bg-[#79FFEB] dark:bg-[#2DD4BF] text-sm font-semibold dark:text-gray-900"
        >
          {{ block.tag }}
        </div>
      </div>
    </div>
  </ui-expand>
</template>
<script setup>
import { getBlocks } from '@/utils/getSharedData';
import { useI18n } from 'vue-i18n';

defineProps({
  category: {
    type: Object,
    default: () => ({}),
  },
  blocks: {
    type: Array,
    default: () => [],
  },
  pinned: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['pin', 'add']);

const { t, te } = useI18n();
const blocksDetail = getBlocks();

function getBlockTitle({ description, id, name }) {
  const blockPath = `workflow.blocks.${id}`;
  if (!te(blockPath)) return blocksDetail[id]?.name || name;

  const descPath = `${blockPath}.${description ? 'description' : 'name'}`;
  let blockDescription = te(descPath) ? t(descPath) : name;

  if (description) {
    blockDescription = `[${t(`${blockPath}.name`)}]\n${blockDescription}`;
  }

  return blockDescription;
}
function getCategoryName(category) {
  const localeKey = `workflow.categories.${category.id}`;

  return category.id && te(localeKey) ? t(localeKey) : category.name;
}
function getBlockName({ id, name }) {
  const localeKey = `workflow.blocks.${id}.name`;

  return id && te(localeKey) ? t(localeKey) : name;
}
function getIconPath(path) {
  if (path && path.startsWith('path')) {
    const { 1: iconPath } = path.split(':');
    return iconPath;
  }

  return '';
}
function onBlockDragStart(event, block) {
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('block', JSON.stringify(block));
  event.dataTransfer.setData('text/plain', block.id);
}
</script>
<style scoped>
.block-catalog-name {
  min-height: 2.5em;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.3;
}
</style>

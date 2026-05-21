<template>
  <section class="silverback-project-state">
    <header class="state-header">
      <div class="state-title">
        <span class="eyebrow">Silverback Visual Coding</span>
        <h1>{{ workflowTitle }}</h1>
        <p>
          Ресурсы, переменные, формы, планы и BAS-блоки только для текущего
          workflow/project.
        </p>
      </div>
      <div class="bridge-controls">
        <label>
          Bridge
          <input v-model="bridgeBaseUrl" spellcheck="false" />
        </label>
        <button type="button" :disabled="bridgeState.loading" @click="refreshBridgeState">
          {{ bridgeState.loading ? 'Обновление...' : 'Обновить' }}
        </button>
      </div>
    </header>

    <div class="metric-grid">
      <article v-for="item in metrics" :key="item.label" class="metric-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.detail }}</small>
      </article>
    </div>

    <section class="state-panel">
      <div class="panel-heading">
        <h2>BAS карта текущего проекта</h2>
        <span>{{ visibleBasGroups.length }} групп</span>
      </div>
      <div v-if="visibleBasGroups.length" class="bas-grid">
        <article v-for="group in visibleBasGroups" :key="group.key" class="bas-group">
          <div>
            <strong>{{ group.title }}</strong>
            <span>{{ group.count }} блоков</span>
          </div>
          <ul>
            <li v-for="block in group.blocks.slice(0, 8)" :key="block.key">
              {{ block.name }}
              <small>#{{ block.id }}</small>
            </li>
          </ul>
        </article>
      </div>
      <p v-else class="empty-state">
        В этом workflow пока нет Silverback/BAS блоков.
      </p>
    </section>

    <section class="state-panel">
      <div class="panel-heading">
        <h2>Связи из graph</h2>
        <span>{{ totalReferenceCount }} ссылок</span>
      </div>
      <div class="reference-grid">
        <reference-list
          title="Ресурсы / токены"
          :items="references.resources"
          empty="Resource Store или tokenResource не найдены."
        />
        <reference-list
          title="Bridge переменные"
          :items="references.variables"
          empty="Variable Store в этом workflow не используется."
        />
        <reference-list
          title="Automa core"
          :items="references.automaCore"
          empty="Нет ссылок на native variables/table/globalData."
        />
        <reference-list
          title="Формы / схемы / планы"
          :items="formPlanReferences"
          empty="Runtime forms, schemas и parallel plans не привязаны."
        />
        <reference-list
          title="Output variables"
          :items="references.outputs"
          empty="Блоки не сохраняют результат в variableName."
        />
        <reference-list
          title="Env / runtime"
          :items="references.env"
          empty="Env mapping в блоках не найден."
        />
      </div>
    </section>

    <section class="state-panel">
      <div class="panel-heading">
        <h2>Automa native storage</h2>
        <span>{{ nativeVariablesView.length }} variables</span>
      </div>
      <div class="table-wrap">
        <table v-if="nativeVariablesView.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th>Связь</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in nativeVariablesView"
              :key="item.id || item.name"
              :class="{ linked: item.used }"
            >
              <td>{{ item.name }}</td>
              <td>{{ formatSafeValue(item.name, item.value) }}</td>
              <td>
                <span v-if="item.used" class="badge">used in graph</span>
                <span v-else class="muted">global</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-state">В Automa native variables пока пусто.</p>
      </div>
      <div class="native-extra-grid">
        <article class="mini-card">
          <strong>GlobalData</strong>
          <span>{{ globalDataKeys.length ? globalDataKeys.join(', ') : 'пусто' }}</span>
        </article>
        <article class="mini-card">
          <strong>Table columns</strong>
          <span>{{ tableColumnNames.length ? tableColumnNames.join(', ') : 'не подключены' }}</span>
        </article>
      </div>
    </section>

    <section class="state-panel">
      <div class="panel-heading">
        <h2>Bridge storage</h2>
        <span v-if="bridgeState.lastLoaded">loaded {{ bridgeState.lastLoaded }}</span>
        <span v-else>localhost MCP</span>
      </div>
      <p v-if="bridgeState.error" class="bridge-error">
        {{ bridgeState.error }}
      </p>
      <div class="storage-grid">
        <storage-list
          title="Resources"
          :items="bridgeState.resources"
          :used-names="usedResourceNames"
          name-key="name"
          value-key="value"
        />
        <storage-list
          title="Variables"
          :items="bridgeState.variables"
          :used-names="usedVariableNames"
          name-key="name"
          value-key="value"
        />
        <storage-list
          title="Schemas"
          :items="bridgeState.schemas"
          :used-names="usedSchemaNames"
          name-key="name"
          value-key="path"
        />
        <storage-list
          title="Parallel plans"
          :items="bridgeState.plans"
          :used-names="usedPlanNames"
          name-key="name"
          value-key="path"
        />
      </div>
    </section>
  </section>
</template>

<script setup>
import dbStorage from '@/db/storage';
import { useLiveQuery } from '@/composable/liveQuery';
import { getBlocks } from '@/utils/getSharedData';
import { parseJSON } from '@/utils/helper';
import {
  computed,
  defineComponent,
  h,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

const props = defineProps({
  workflow: {
    type: Object,
    required: true,
  },
  isPackage: {
    type: Boolean,
    default: false,
  },
  isTeam: {
    type: Boolean,
    default: false,
  },
});

const blocks = getBlocks();
const nativeVariables = useLiveQuery(() => dbStorage.variables.toArray());
const bridgeBaseUrl = ref(inferBridgeBaseUrl(props.workflow));
const bridgeState = reactive({
  loading: false,
  error: '',
  lastLoaded: '',
  resources: [],
  variables: [],
  schemas: [],
  plans: [],
});

const sensitiveRe =
  /(token|secret|password|passwd|cookie|authorization|bearer|api[_-]?key|private|credential|telegram_bot_token)/i;

const basGroups = [
  {
    key: 'resources',
    title: 'Ресурсы / поля',
    labels: ['resource-store', 'resource-design-builder'],
  },
  {
    key: 'variables',
    title: 'Переменные / core',
    labels: ['variable-store', 'automa-core-tools', 'insert-data'],
  },
  {
    key: 'json-lists-logic',
    title: 'JSON / lists / logic',
    labels: ['json-tools', 'list-tools', 'logic-tools', 'conditions'],
  },
  {
    key: 'loops',
    title: 'Циклы',
    labels: [
      'loop-helper',
      'bas-for-loop',
      'bas-foreach-loop',
      'while-loop',
      'loop-data',
      'loop-elements',
      'repeat-task',
    ],
  },
  {
    key: 'runtime',
    title: 'Выполнение / код',
    labels: [
      'python-bridge',
      'library-runner',
      'system-command',
      'build-app',
      'project-template-builder',
      'parallel-runner',
      'execute-workflow',
      'javascript-code',
    ],
  },
  {
    key: 'browser',
    title: 'Browser / recorder',
    labels: [
      'browser-scanner',
      'network-recorder-import',
      'profile-action',
      'new-tab',
      'event-click',
      'forms',
      'get-text',
    ],
  },
  {
    key: 'android',
    title: 'Android',
    prefix: 'android-',
    labels: ['android-automation'],
  },
  {
    key: 'telegram',
    title: 'Telegram / bots',
    labels: ['telegram-message', 'telegram-bot-builder'],
  },
  {
    key: 'operator',
    title: 'Оператор / результат',
    labels: ['manual-intervention', 'user-interaction', 'result-tools'],
  },
  {
    key: 'files-wait',
    title: 'Files / wait / retry',
    labels: ['file-path-tools', 'wait-tools'],
  },
];

const graph = computed(() => normalizeGraph(props.workflow, props.isPackage));
const graphNodes = computed(() => flattenNodes(graph.value.nodes));
const workflowTitle = computed(() => {
  const prefix = props.isPackage ? 'Project package' : props.isTeam ? 'Team workflow' : 'Local workflow';
  return `${props.workflow.name || 'Untitled'} · ${prefix}`;
});
const metrics = computed(() => [
  {
    label: 'Blocks',
    value: graphNodes.value.length,
    detail: `${graph.value.edges.length} connections`,
  },
  {
    label: 'Resources',
    value: references.value.resources.length,
    detail: 'resource/token refs',
  },
  {
    label: 'Variables',
    value: usedVariableNames.value.size,
    detail: 'native + bridge refs',
  },
  {
    label: 'Runtime forms',
    value: references.value.runtimeForms.length,
    detail: `${references.value.plans.length} parallel plans`,
  },
]);

const references = computed(() => extractReferences(graphNodes.value));
const totalReferenceCount = computed(() =>
  Object.values(references.value).reduce((sum, items) => sum + items.length, 0)
);
const formPlanReferences = computed(() => [
  ...references.value.schemas,
  ...references.value.plans,
  ...references.value.designApps,
  ...references.value.runtimeForms,
]);
const usedResourceNames = computed(
  () => new Set(references.value.resources.map((item) => item.name).filter(Boolean))
);
const usedVariableNames = computed(
  () =>
    new Set(
      [
        ...references.value.variables,
        ...references.value.automaCore,
        ...references.value.outputs,
      ]
        .map((item) => item.name)
        .filter(Boolean)
    )
);
const usedSchemaNames = computed(
  () => new Set(references.value.schemas.map((item) => item.name).filter(Boolean))
);
const usedPlanNames = computed(
  () => new Set(references.value.plans.map((item) => item.name).filter(Boolean))
);
const globalDataKeys = computed(() => {
  const data = parseMaybeJSON(props.workflow.globalData, {});
  if (Array.isArray(data)) return data.map((item) => item.name || item.key).filter(Boolean);
  if (data && typeof data === 'object') return Object.keys(data);
  return [];
});
const tableColumnNames = computed(() =>
  (props.workflow.table || [])
    .map((column) => column.name || column.id || column.key)
    .filter(Boolean)
);
const nativeVariablesView = computed(() =>
  [...(nativeVariables.value || [])]
    .map((item) => ({
      ...item,
      used: usedVariableNames.value.has(item.name),
    }))
    .sort((left, right) => Number(right.used) - Number(left.used) || left.name.localeCompare(right.name))
);
const visibleBasGroups = computed(() =>
  basGroups
    .map((group) => {
      const blocksInGroup = graphNodes.value.filter((node) => {
        if (group.prefix && node.label.startsWith(group.prefix)) return true;
        return group.labels.includes(node.label);
      });
      return {
        ...group,
        count: blocksInGroup.length,
        blocks: blocksInGroup.map((node) => ({
          key: `${node.id}-${node.label}`,
          id: node.id,
          name: blockName(node.label),
        })),
      };
    })
    .filter((group) => group.count > 0)
);

const ReferenceList = defineComponent({
  props: {
    title: { type: String, required: true },
    items: { type: Array, required: true },
    empty: { type: String, required: true },
  },
  setup(componentProps) {
    return () =>
      h('article', { class: 'reference-card' }, [
        h('h3', componentProps.title),
        componentProps.items.length
          ? h(
              'ul',
              componentProps.items.map((item) =>
                h('li', { key: `${item.name}-${item.nodeId}-${item.kind}` }, [
                  h('strong', item.name || item.kind),
                  h('span', item.kind || ''),
                  h('small', `${item.blockName || 'block'} #${item.nodeId || '-'}`),
                ])
              )
            )
          : h('p', { class: 'empty-state' }, componentProps.empty),
      ]);
  },
});

const StorageList = defineComponent({
  props: {
    title: { type: String, required: true },
    items: { type: Array, required: true },
    usedNames: { type: Object, required: true },
    nameKey: { type: String, required: true },
    valueKey: { type: String, required: true },
  },
  setup(componentProps) {
    return () =>
      h('article', { class: 'storage-card' }, [
        h('h3', componentProps.title),
        componentProps.items.length
          ? h(
              'ul',
              componentProps.items.map((item) => {
                const name = String(item[componentProps.nameKey] || '');
                const used = componentProps.usedNames.has(name);
                return h(
                  'li',
                  { key: name || JSON.stringify(item), class: used ? 'used' : '' },
                  [
                    h('div', [
                      h('strong', name || '<unnamed>'),
                      used ? h('span', { class: 'badge' }, 'used in graph') : null,
                    ]),
                    h(
                      'small',
                      formatSafeValue(
                        `${name} ${item.type || ''}`,
                        item[componentProps.valueKey] ?? item.description ?? ''
                      )
                    ),
                  ]
                );
              })
            )
          : h('p', { class: 'empty-state' }, 'Нет данных.'),
      ]);
  },
});

function normalizeGraph(workflow, isPackage) {
  const raw = parseMaybeJSON(isPackage ? workflow.data : workflow.drawflow, {});

  if (Array.isArray(raw.nodes)) {
    return {
      nodes: raw.nodes,
      edges: Array.isArray(raw.edges) ? raw.edges : [],
    };
  }

  const legacyBlocks = raw?.drawflow?.Home?.data;
  if (legacyBlocks && typeof legacyBlocks === 'object') {
    const nodes = Object.values(legacyBlocks).map((block) => ({
      id: String(block.id),
      label: block.name,
      data: block.data || {},
      position: { x: block.pos_x || 0, y: block.pos_y || 0 },
    }));
    const edges = [];
    Object.values(legacyBlocks).forEach((block) => {
      Object.values(block.outputs || {}).forEach((output) => {
        (output.connections || []).forEach((connection) => {
          edges.push({
            source: String(block.id),
            target: String(connection.node),
          });
        });
      });
    });
    return { nodes, edges };
  }

  return { nodes: [], edges: [] };
}

function flattenNodes(nodes) {
  return nodes.flatMap((node) => {
    const normalized = normalizeNode(node);
    const groupBlocks = Array.isArray(node.data?.blocks)
      ? node.data.blocks.map((block) => normalizeNode(block, normalized.id))
      : [];
    return [normalized, ...groupBlocks];
  });
}

function normalizeNode(node, parentId = '') {
  const label = node.label || node.name || node.id || '';
  return {
    id: String(node.id || node.itemId || label),
    label: String(label),
    parentId,
    data: node.data || {},
  };
}

function extractReferences(nodes) {
  const state = {
    resources: [],
    variables: [],
    automaCore: [],
    schemas: [],
    plans: [],
    designApps: [],
    runtimeForms: [],
    outputs: [],
    env: [],
  };

  nodes.forEach((node) => {
    const data = node.data || {};
    const base = {
      nodeId: node.id,
      blockName: blockName(node.label),
    };

    addReference(state.outputs, data.variableName, {
      ...base,
      kind: 'block output',
    });
    addReference(state.resources, data.resourceName, {
      ...base,
      kind: data.mode ? `resource ${data.mode}` : 'resource',
      type: data.resourceType,
    });
    addReference(state.resources, data.tokenResource, {
      ...base,
      kind: 'token resource',
      type: 'secret',
    });
    addReference(state.variables, data.variableStoreName, {
      ...base,
      kind: data.mode ? `variable ${data.mode}` : 'variable',
      type: data.variableType,
    });
    addReference(state.automaCore, data.coreName, {
      ...base,
      kind: data.mode || 'core',
      path: data.corePath,
    });
    addReference(state.schemas, data.schemaName, {
      ...base,
      kind: data.mode || 'schema',
    });
    addReference(state.schemas, data.resourceSchema, {
      ...base,
      kind: 'plan resource schema',
    });
    addReference(state.plans, data.planName, {
      ...base,
      kind: data.planMode || data.mode || 'parallel plan',
    });
    addReference(
      data.mode === 'runtimeFormBuild' || data.mode === 'runtimeFormVerify'
        ? state.runtimeForms
        : state.designApps,
      data.appName,
      {
        ...base,
        kind: data.mode || 'app',
      }
    );
    addReference(state.variables, data.inputName, {
      ...base,
      kind: 'user input',
    });
    addReference(state.variables, data.indexName, {
      ...base,
      kind: 'loop index',
    });
    addReference(state.variables, data.itemName, {
      ...base,
      kind: 'loop item',
    });

    extractEnvReferences(state.env, data.envJson, base, 'env');
    extractEnvReferences(state.env, data.envMappingJson, base, 'env mapping');

    if (Array.isArray(data.parameters)) {
      data.parameters.forEach((parameter) => {
        addReference(state.variables, parameter.name, {
          ...base,
          kind: 'trigger parameter',
        });
      });
    }
  });

  Object.keys(state).forEach((key) => {
    state[key] = uniqueReferences(state[key]);
  });

  return state;
}

function extractEnvReferences(target, value, base, kind) {
  const parsed = parseMaybeJSON(value, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

  Object.entries(parsed).forEach(([key, entryValue]) => {
    const shownValue =
      typeof entryValue === 'string' && entryValue.startsWith('[[')
        ? entryValue
        : formatSafeValue(key, entryValue);
    addReference(target, key, {
      ...base,
      kind,
      value: shownValue,
    });
  });
}

function addReference(target, name, meta) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return;
  target.push({
    name: normalizedName,
    ...meta,
  });
}

function uniqueReferences(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.name}:${item.kind}:${item.nodeId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseMaybeJSON(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  return parseJSON(value, fallback);
}

function blockName(label) {
  return blocks[label]?.name || humanize(label);
}

function humanize(value) {
  return String(value || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferBridgeBaseUrl(workflow) {
  const rawGraph = normalizeGraph(workflow, props.isPackage);
  const nodeWithBridge = flattenNodes(rawGraph.nodes).find((node) =>
    String(node.data?.bridgeUrl || '').startsWith('http')
  );
  const bridgeUrl = nodeWithBridge?.data?.bridgeUrl || 'http://127.0.0.1:8765';
  try {
    return new URL(bridgeUrl).origin;
  } catch (error) {
    return 'http://127.0.0.1:8765';
  }
}

async function refreshBridgeState() {
  bridgeState.loading = true;
  bridgeState.error = '';
  try {
    const [resources, variables, schemas, plans] = await Promise.all([
      callMcp('resources.list'),
      callMcp('variables.list'),
      callMcp('resources.schema.list'),
      callMcp('parallel.plan.list'),
    ]);

    bridgeState.resources = normalizeList(resources);
    bridgeState.variables = normalizeList(variables);
    bridgeState.schemas = normalizeList(schemas);
    bridgeState.plans = normalizeList(plans);
    bridgeState.lastLoaded = new Date().toLocaleTimeString();
  } catch (error) {
    bridgeState.error = `Bridge storage недоступен: ${error.message}`;
  } finally {
    bridgeState.loading = false;
  }
}

async function callMcp(name, args = {}) {
  const response = await fetch(`${bridgeBaseUrl.value}/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args }),
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `${name} failed`);
  }
  return payload;
}

function normalizeList(payload) {
  const result = payload?.result ?? payload;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.resources)) return result.resources;
  if (Array.isArray(result?.variables)) return result.variables;
  if (Array.isArray(result?.schemas)) return result.schemas;
  if (Array.isArray(result?.plans)) return result.plans;
  return [];
}

function formatSafeValue(name, value) {
  if (sensitiveRe.test(String(name))) {
    return value === undefined || value === null || value === '' ? '' : '***';
  }

  let text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text === undefined) text = '';
  if (text.length > 140) return `${text.slice(0, 137)}...`;
  return text;
}

watch(
  () => props.workflow?.id,
  () => {
    bridgeBaseUrl.value = inferBridgeBaseUrl(props.workflow);
    refreshBridgeState();
  }
);

onMounted(refreshBridgeState);
</script>

<style scoped>
.silverback-project-state {
  min-height: 100%;
  padding: 96px 24px 36px;
  color: var(--silverback-text, #f7f2ff);
  background: var(--silverback-bg, #08060d);
}

.state-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto 18px;
}

.state-title {
  max-width: 760px;
}

.eyebrow,
.panel-heading span,
.metric-card span,
.metric-card small,
.reference-card small,
.storage-card small,
.muted {
  color: var(--silverback-muted, #c8bdd8);
}

.eyebrow {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.state-title p {
  margin-top: 8px;
  color: var(--silverback-muted, #c8bdd8);
}

.bridge-controls {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.bridge-controls label {
  display: grid;
  gap: 5px;
  font-size: 12px;
  color: var(--silverback-muted, #c8bdd8);
}

.bridge-controls input {
  width: 260px;
  border: 1px solid var(--silverback-border, #35224f);
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--silverback-text, #f7f2ff);
  background: var(--silverback-surface, #12081f);
}

.bridge-controls button {
  min-height: 37px;
  border-radius: 8px;
  padding: 0 14px;
  color: white;
  background: var(--silverback-accent, #7c3aed);
}

.bridge-controls button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.metric-grid,
.state-panel {
  max-width: 1280px;
  margin-right: auto;
  margin-left: auto;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.metric-card,
.state-panel,
.bas-group,
.reference-card,
.storage-card,
.mini-card {
  border: 1px solid var(--silverback-border, #35224f);
  border-radius: 8px;
  background: var(--silverback-surface, #12081f);
}

.metric-card {
  display: grid;
  gap: 4px;
  padding: 14px;
}

.metric-card strong {
  font-size: 26px;
}

.state-panel {
  margin-bottom: 12px;
  padding: 16px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-heading h2 {
  font-size: 16px;
  font-weight: 700;
}

.bas-grid,
.reference-grid,
.storage-grid,
.native-extra-grid {
  display: grid;
  gap: 12px;
}

.bas-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.reference-grid,
.storage-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.native-extra-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 12px;
}

.bas-group,
.reference-card,
.storage-card,
.mini-card {
  padding: 12px;
  background: var(--silverback-surface-2, #1a1029);
}

.bas-group > div,
.storage-card li > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bas-group span {
  color: var(--silverback-muted, #c8bdd8);
  font-size: 12px;
}

ul {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
}

li {
  display: grid;
  gap: 2px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

li:first-child {
  border-top: 0;
}

.reference-card h3,
.storage-card h3,
.mini-card strong {
  font-size: 14px;
}

.reference-card span {
  color: var(--silverback-muted, #c8bdd8);
  font-size: 12px;
}

.empty-state,
.bridge-error {
  color: var(--silverback-muted, #c8bdd8);
  font-size: 13px;
}

.bridge-error {
  margin-bottom: 12px;
  color: #fca5a5;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 9px 8px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--silverback-muted, #c8bdd8);
  font-size: 12px;
  font-weight: 600;
}

tr.linked td {
  background: rgba(124, 58, 237, 0.12);
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 7px;
  color: #f7f2ff;
  background: rgba(124, 58, 237, 0.42);
  font-size: 11px;
  white-space: nowrap;
}

.storage-card li.used {
  border-radius: 6px;
  padding-right: 8px;
  padding-left: 8px;
  background: rgba(124, 58, 237, 0.12);
}

.mini-card {
  display: grid;
  gap: 6px;
}

.mini-card span {
  color: var(--silverback-muted, #c8bdd8);
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .metric-grid,
  .bas-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reference-grid,
  .storage-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .silverback-project-state {
    padding: 88px 12px 24px;
  }

  .state-header,
  .bridge-controls {
    display: grid;
  }

  .bridge-controls input {
    width: 100%;
  }

  .metric-grid,
  .bas-grid,
  .native-extra-grid {
    grid-template-columns: 1fr;
  }
}
</style>

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const babel = require('@babel/core');
const { parse } = require('@vue/compiler-sfc');

const root = path.resolve(__dirname, '..');
const filename = 'src/newtab/pages/workflows/[id].vue';
// Check a historical version without replacing the working editor source.
const source = process.env.EDITOR_IDENTITY_REF
  ? execFileSync('git', ['show', `${process.env.EDITOR_IDENTITY_REF}:${filename}`], {
      cwd: root, encoding: 'utf8',
    })
  : fs.readFileSync(path.join(root, filename), 'utf8');
const { descriptor, errors } = parse(source, { filename });
assert.deepEqual(errors, []);
const script = descriptor.scriptSetup.content;
const ast = babel.parseSync(script, {
  sourceType: 'module', babelrc: false, configFile: false,
});
const declarations = ast.program.body
  .filter((node) => node.type === 'VariableDeclaration')
  .flatMap((node) => node.declarations);
function initializer(name) {
  const node = declarations.find((item) => item.id.name === name);
  assert.ok(node, `Missing declaration: ${name}`);
  return node.init;
}
function evaluate(node, context) {
  assert.ok(node, 'Missing source AST node');
  return vm.runInContext(`(${script.slice(node.start, node.end)})`, context, { filename });
}
function harness(overrides = {}) {
  const route = { params: { id: 'origin' } };
  return vm.createContext({
    route, workflowId: route.params.id, isPackage: false, isTeamWorkflow: false,
    workflowPayload: { data: {}, isUpdating: false },
    console: { error(error) { throw error; } },
    ...overrides,
  });
}

test('saved updateWorkflow callback cannot overwrite the newly selected graph', async () => {
  const graphs = {
    origin: { nodes: [{ id: 'origin-node' }], edges: [] },
    destination: { nodes: [{ id: 'destination-node' }], edges: [] },
  };
  const destination = structuredClone(graphs.destination);
  const writes = [];
  const context = harness({
    workflowStore: { async update({ id, data }) {
      writes.push(id);
      graphs[id] = structuredClone(data.drawflow);
    } },
    updateHostedWorkflow: async () => {},
  });
  const node = ast.program.body.find(
    (item) => item.type === 'FunctionDeclaration' && item.id.name === 'updateWorkflow'
  );
  assert.ok(node?.async, 'Extract the actual async updateWorkflow function');
  const savedCallback = evaluate(node, context);
  context.route.params.id = 'destination';
  const changed = { nodes: [{ id: 'edited-origin-node' }], edges: [] };
  await savedCallback({ drawflow: changed });
  assert.deepEqual(writes, ['origin']);
  assert.deepEqual(graphs.origin, changed);
  assert.deepEqual(graphs.destination, destination);
});

test('cached workflow-editor template keeps its original store ID after navigation', () => {
  const editors = [];
  function visit(node) {
    if (node.tag === 'workflow-editor') editors.push(node);
    node.children?.forEach(visit);
  }
  visit(descriptor.template.ast);
  assert.equal(editors.length, 1);
  const binding = editors[0].props.find(
    (prop) => prop.name === 'bind' && prop.arg?.content === 'id'
  );
  assert.ok(binding?.exp, 'workflow-editor must have an ID binding');
  const context = harness();
  const editorId = () => vm.runInContext(binding.exp.content, context);
  assert.equal(editorId(), 'origin');
  context.route.params = { id: 'destination' };
  assert.equal(editorId(), 'origin');
});

test('cached workflow states remain scoped to the originating workflow', () => {
  const context = harness({
    computed: (callback) => ({ get value() { return callback(); } }),
    workflowStore: { getWorkflowStates: (id) => [id] },
  });
  const states = evaluate(initializer('workflowStates'), context);
  assert.deepEqual(states.value, ['origin']);
  context.route.params.id = 'destination';
  assert.deepEqual(states.value, ['origin']);
});

test('block edits are synchronous so rapid fields and Save cannot lose values', () => {
  const nodes = { first: { data: { url: 'old', headersJson: '{}' } }, second: { data: { url: 'untouched' } } };
  const context = harness({
    haveEditAccess: { value: true },
    editor: { value: { getNode: { value: (id) => nodes[id] } } },
    editState: { blockData: { blockId: 'first', data: nodes.first.data } },
    autocompleteState: { blocks: {} }, state: { dataChanged: false },
  });
  const update = evaluate(initializer('updateBlockData'), context);
  update({ ...context.editState.blockData.data, url: 'new' });
  update({ ...context.editState.blockData.data, headersJson: '{"Accept":"text/html"}' });
  assert.equal(nodes.first.data.url, 'new');
  assert.equal(nodes.first.data.headersJson, '{"Accept":"text/html"}');
  context.editState.blockData = { blockId: 'second', data: nodes.second.data };
  assert.equal(nodes.second.data.url, 'untouched');
  assert.equal(context.state.dataChanged, true);
  context.editState.blockData = {};
  assert.doesNotThrow(() => update({ url: 'late' }));
});

for (const kind of ['hosted', 'backup']) {
  for (const originEligible of [true, false]) {
    test(`${kind} callback uses origin eligibility, URL and metadata (eligible=${originEligible})`, async () => {
      const eligibleId = originEligible ? 'origin' : 'destination';
      const requests = [];
      const lookups = [];
      const backups = [];
      const data = { name: 'Origin workflow', drawflow: { nodes: [{ id: 'origin-node' }], edges: [] } };
      const context = harness({
        workflowPayload: { data: structuredClone(data), isUpdating: false },
        userStore: {
          user: { id: 'user' },
          hostedWorkflows: kind === 'hosted' ? { [eligibleId]: true } : {},
          backupIds: kind === 'backup' ? [eligibleId] : [],
        },
        workflowStore: { getById(id) { lookups.push(id); return { id }; } },
        fetchApi: async (url, options) => {
          requests.push({ url, ...options });
          return { ok: true, json: async () => ({ updatedAt: 'origin-backup-time' }) };
        },
        browser: { storage: { local: { async set(value) { backups.push(structuredClone(value)); } } } },
      });
      // Run the actual throttled callback after navigation, without real timers.
      const callback = initializer('updateHostedWorkflow').arguments[0];
      assert.ok(callback.async);
      const savedCallback = evaluate(callback, context);
      context.route.params.id = 'destination';
      await savedCallback();
      assert.deepEqual(lookups, ['origin']);
      assert.equal(requests.length, originEligible ? 1 : 0);
      if (originEligible) {
        assert.equal(requests[0].url, '/me/workflows/origin');
        assert.equal(requests[0].method, 'PUT');
        assert.deepEqual(JSON.parse(requests[0].body), { workflow: data });
      }
      assert.deepEqual(backups, originEligible && kind === 'backup'
        ? [{ lastBackup: 'origin-backup-time' }] : []);
    });
  }
}

test('cached editor never reads a live route.params.id', () => {
  assert.doesNotMatch(source, /\broute\s*\.\s*params\s*\.\s*id\b/);
});

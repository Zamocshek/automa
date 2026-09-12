const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const babel = require('@babel/core');
const { parse } = require('@vue/compiler-sfc');
const { useVueFlow } = require('@vue-flow/core');

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
  const route = { params: { id: 'origin' }, query: {} };
  return vm.createContext({
    route, workflowId: route.params.id, isPackage: false, isTeamWorkflow: false,
    workflowPayload: { data: {}, isUpdating: false },
    hostedWorkflowTimeout: null, setTimeout: () => 1,
    console: { error(error) { throw error; } },
    ...overrides,
  });
}
function functionNode(name) {
  const node = ast.program.body.find(
    (item) => item.type === 'FunctionDeclaration' && item.id.name === name
  );
  assert.ok(node, `Missing function: ${name}`);
  return node;
}
function editorHarness(t) {
  const timers = new Map();
  let timerId = 0;
  const flow = useVueFlow(`regression-${t.name}`);
  flow.setNodes(['first', 'second', 'third'].map((id, index) => ({
    id, label: index === 0 ? 'trigger' : 'http-client',
    position: { x: index * 250, y: 0 }, data: { url: 'old' },
  })));
  t.after(() => flow.$destroy());
  const context = harness({
    editor: { value: flow },
    editState: { blockData: { blockId: 'second', data: flow.findNode('second').data } },
    autocompleteState: { blocks: {} }, state: { dataChanged: false },
    haveEditAccess: { value: true }, workflow: { value: {} },
    updateHostedWorkflow() {}, onNodesChange() {},
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const helper = fs.readFileSync(path.join(root, 'src/utils/helper.js'), 'utf8');
  const helperAst = babel.parseSync(helper, { sourceType: 'module', babelrc: false, configFile: false });
  const debounce = helperAst.program.body.find((node) => node.declaration?.id?.name === 'debounce').declaration;
  context.debounce = vm.runInContext(`(${helper.slice(debounce.start, debounce.end)})`, context);
  context.onEdgesChange = evaluate(initializer('onEdgesChange'), context);
  evaluate(functionNode('onEditorInit'), context)(flow);
  return {
    flow, context,
    flushEdgeChanges() {
      for (const [id, timer] of timers) {
        if (timer.delay > 250) continue;
        timers.delete(id);
        timer.callback();
      }
    },
  };
}
function edgeData(target = 'second') {
  return { id: 'connection', source: 'first', target,
    sourceHandle: 'first-output-1', targetHandle: `${target}-input-1` };
}

for (const action of ['add', 'remove']) {
  test(`edge ${action} followed by selection retains the unsaved change`, (t) => {
    const { flow, context, flushEdgeChanges } = editorHarness(t);
    if (action === 'remove') flow.setEdges([edgeData()]);
    if (action === 'add') flow.addEdges([edgeData()]);
    else flow.removeEdges(['connection']);
    context.onEdgesChange([{ id: 'connection', type: 'select', selected: false }]);
    flushEdgeChanges();
    assert.equal(context.state.dataChanged, true);
    assert.equal(flow.toObject().edges.length, action === 'add' ? 1 : 0);
  });
}

test('connecting then immediately leaving still asks to retain unsaved edits', (t) => {
  const { flow, context } = editorHarness(t);
  let confirmations = 0;
  context.window = { confirm() { confirmations += 1; return false; } };
  context.t = (key) => key;
  flow.addEdges([edgeData()]);
  assert.equal(evaluate(functionNode('onBeforeLeave'), context)(), false);
  assert.equal(confirmations, 1);
});

test('invalid output-to-output connections cannot enter an immediate save', (t) => {
  const { flow, context, flushEdgeChanges } = editorHarness(t);
  flow.addEdges([{ ...edgeData(), targetHandle: 'second-output-1' }]);
  assert.equal(flow.toObject().edges.length, 0);
  context.onEdgesChange([{ id: 'connection', type: 'select', selected: false }]);
  flushEdgeChanges();
  assert.equal(flow.toObject().edges.length, 0);
});

test('selection alone never dirties a clean editor', (t) => {
  const { flow, context, flushEdgeChanges } = editorHarness(t);
  flow.setEdges([edgeData()]);
  flow.addSelectedEdges([flow.findEdge('connection')]);
  flushEdgeChanges();
  assert.equal(context.state.dataChanged, false);
});

test('reconnecting an existing edge marks the changed graph unsaved', async (t) => {
  const { flow, context } = editorHarness(t);
  flow.setEdges([edgeData()]);
  // WorkflowEditor mutates an edge on edgeUpdate without emitting edgesChange.
  const component = parse(fs.readFileSync(path.join(root, 'src/components/newtab/workflow/WorkflowEditor.vue'), 'utf8'));
  const content = component.descriptor.scriptSetup.content;
  const componentAst = babel.parseSync(content, { sourceType: 'module', babelrc: false, configFile: false });
  const callback = componentAst.program.body.find((node) =>
    node.type === 'ExpressionStatement' && node.expression.callee?.property?.name === 'onEdgeUpdate'
  ).expression.arguments[0];
  flow.onEdgeUpdate(vm.runInContext(`(${content.slice(callback.start, callback.end)})`, context));
  await flow.hooks.value.edgeUpdate.trigger({ edge: flow.findEdge('connection'), connection: edgeData('third') });
  assert.equal(flow.toObject().edges[0].target, 'third');
  assert.equal(context.state.dataChanged, true);
});

for (const isPackage of [false, true]) {
  test(`completing a ${isPackage ? 'package' : 'workflow'} save cannot clear newer field edits`, async (t) => {
    const { flow, context } = editorHarness(t);
    context.isPackage = isPackage;
    const update = evaluate(initializer('updateBlockData'), context);
    const completeSave = evaluate(functionNode('onActionUpdated'), context);
    update({ url: 'saved' });
    const savedGraph = flow.toObject();
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; }).then(() => {
      completeSave({ data: { [isPackage ? 'data' : 'drawflow']: savedGraph }, changedIndicator: false });
    });
    update({ url: 'newer unsaved value' });
    finish();
    await pending;
    assert.equal(flow.findNode('second').data.url, 'newer unsaved value');
    assert.equal(context.state.dataChanged, true);
    completeSave({ data: { [isPackage ? 'data' : 'drawflow']: flow.toObject() }, changedIndicator: false });
    assert.equal(context.state.dataChanged, false);
  });
}

test('saving workflow metadata cannot mark the unsaved graph clean', (t) => {
  const { context } = editorHarness(t);
  evaluate(initializer('updateBlockData'), context)({ url: 'unsaved' });
  evaluate(functionNode('onActionUpdated'), context)({ data: { name: 'Renamed' }, changedIndicator: false });
  assert.equal(context.state.dataChanged, true);
});

test('selection highlighting and panning during a save do not count as graph edits', (t) => {
  const { flow, context } = editorHarness(t);
  flow.addEdges([edgeData()]);
  const snapshot = flow.toObject();
  flow.findEdge('connection').class = 'connected-edges';
  flow.addSelectedEdges([flow.findEdge('connection')]);
  flow.viewport.value = { x: 100, y: 200, zoom: 0.8 };
  evaluate(functionNode('onActionUpdated'), context)({ data: { drawflow: snapshot }, changedIndicator: false });
  assert.equal(context.state.dataChanged, false);
});

test('a save does not swallow new edge data or node positions', (t) => {
  const { flow, context } = editorHarness(t);
  const completeSave = evaluate(functionNode('onActionUpdated'), context);
  const snapshot = flow.toObject();
  flow.addEdges([edgeData()]);
  completeSave({ data: { drawflow: snapshot }, changedIndicator: false });
  assert.equal(context.state.dataChanged, true);
  const connected = flow.toObject();
  flow.findNode('second').position.x += 25;
  completeSave({ data: { drawflow: connected }, changedIndicator: false });
  assert.equal(context.state.dataChanged, true);
});

test('edges with implicit handles do not throw away the change notification', (t) => {
  const { flow, context, flushEdgeChanges } = editorHarness(t);
  flow.addEdges([{ id: 'implicit', source: 'first', target: 'second' }]);
  flushEdgeChanges();
  assert.equal(context.state.dataChanged, true);
});

function hostedHarness() {
  const timers = new Map();
  const requests = [];
  const errors = [];
  let timerId = 0;
  let now = 0;
  const context = harness({
    workflowPayload: { data: { name: 'first', description: 'original' }, isUpdating: false },
    userStore: { user: { id: 'user' }, hostedWorkflows: { origin: true }, backupIds: [] },
    workflowStore: { getById: (id) => ({ id }) },
    console: { error: (error) => errors.push(error) },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; },
    fetchApi(url, options) {
      return new Promise((resolve, reject) => {
        requests.push({ url, body: JSON.parse(options.body), resolve, reject });
      });
    },
  });
  const helper = fs.readFileSync(path.join(root, 'src/utils/helper.js'), 'utf8');
  const helperAst = babel.parseSync(helper, { sourceType: 'module', babelrc: false, configFile: false });
  const throttle = helperAst.program.body.find((node) => node.declaration?.id?.name === 'throttle').declaration;
  context.throttle = vm.runInContext(`(${helper.slice(throttle.start, throttle.end)})`, context);
  context.updateHostedWorkflow = evaluate(initializer('updateHostedWorkflow'), context);
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  return {
    context, requests, errors, settle,
    async advance(ms) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at > now) continue;
        timers.delete(id);
        timer.callback();
      }
      await settle();
    },
    queue(data) {
      context.workflowPayload.data = { ...context.workflowPayload.data, ...data };
      context.updateHostedWorkflow();
    },
  };
}

test('hosted upload preserves and drains saves queued during an in-flight request', async () => {
  const { context, requests, queue, advance, settle } = hostedHarness();
  context.updateHostedWorkflow();
  assert.equal(requests.length, 1);
  queue({ name: 'latest', drawflow: { nodes: [{ id: 'latest-node' }], edges: [] } });
  assert.equal(requests.length, 1);
  requests[0].resolve({ ok: true });
  await settle();
  assert.equal(context.workflowPayload.data.name, 'latest');
  await advance(5000);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].body.workflow.name, 'latest');
  assert.equal(requests[1].body.workflow.drawflow.nodes[0].id, 'latest-node');
  requests[1].resolve({ ok: true });
  await settle();
  await advance(5000);
  assert.equal(requests.length, 2, 'an empty queue must not upload again');
});

test('a save during the hosted cooldown is eventually sent without a third edit', async () => {
  const { context, requests, queue, advance, settle } = hostedHarness();
  context.updateHostedWorkflow();
  requests[0].resolve({ ok: true });
  await settle();
  await advance(1000);
  queue({ name: 'last save' });
  assert.equal(requests.length, 1, 'preserve the upload rate limit');
  await advance(4000);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].body.workflow.name, 'last save');
  requests[1].resolve({ ok: true });
  await settle();
});

test('failed hosted uploads preserve queued newer values and allow a retry', async () => {
  const { context, requests, errors, queue, advance, settle } = hostedHarness();
  context.updateHostedWorkflow();
  queue({ name: 'newer', category: 'updated' });
  requests[0].reject(new Error('offline'));
  await settle();
  assert.equal(errors.length, 1);
  assert.equal(context.workflowPayload.isUpdating, false);
  assert.deepEqual(JSON.parse(JSON.stringify(context.workflowPayload.data)), {
    name: 'newer', description: 'original', category: 'updated',
  });
  await advance(5000);
  assert.equal(requests.length, 1, 'do not create an unbounded automatic retry loop');
  context.updateHostedWorkflow();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].body.workflow, { name: 'newer', description: 'original', category: 'updated' });
  requests[1].resolve({ ok: true });
  await settle();
});

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
      const init = initializer('updateHostedWorkflow');
      const callback = init.arguments?.[0] || init;
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

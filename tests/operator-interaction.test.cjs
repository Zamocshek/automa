const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const handlerFile = 'business/dev/blocks/backgroundHandler/index.js';

function harness({ localResult = { value: 'typed', cancelled: false }, bridgeResult, chrome } = {}) {
  const requests = [];
  const timers = new Map();
  const writes = [];
  const sent = [];
  const listeners = new Map();
  const browser = {
    tabs: {
      query: async () => [{ id: 7, url: 'https://example.test', windowId: 9 }],
      update: async () => ({ id: 7, windowId: 9, url: 'https://example.test' }),
      sendMessage: async (...args) => { sent.push(args); return localResult; },
    },
    windows: { update: async () => ({}) },
    notifications: { create: async () => 'notification' },
  };
  const context = vm.createContext({
    console, AbortController, chrome,
    crypto: require('node:crypto').webcrypto,
    setTimeout: (fn, ms) => { const id = {}; timers.set(id, { fn, ms }); return id; },
    clearTimeout: (id) => timers.delete(id),
    fetch: async (_url, options) => {
      const body = JSON.parse(options.body);
      requests.push({ ...body, signal: options.signal, timerMs: [...timers.values()].map(({ ms }) => ms) });
      const result = typeof bridgeResult === 'function' ? await bridgeResult(body) : bridgeResult;
      return { ok: true, json: async () => result || { ok: true, result: body.payload.localResult || {} } };
    },
  });
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
      filename, babelrc: false, configFile: false,
      presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]],
    }).code;
    const resolve = (name) => {
      if (name === '@/service/browser-api/BrowserAPIService') return browser;
      if (name === '@/workflowEngine/templating/renderString') return async (value) => ({ value });
      if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), `${name.replace(/\.js$/, '')}.js`));
      return require(name);
    };
    vm.runInContext(`(function(require, module, exports) { ${source}\n})`, context, { filename })(resolve, module, module.exports);
    return module.exports;
  }
  const worker = {
    engine: {
      isPopup: false, id: 'execution', workflow: { id: 'workflow' },
      states: { on: (name, fn) => listeners.set(name, fn), off: (name) => listeners.delete(name) },
    },
    activeTab: { id: 7, frameId: 0 },
    getBlockConnections: (_id, output) => output === 'fallback' ? ['error-block'] : ['next-block'],
    setVariable: async (name, value) => writes.push({ name, value }),
    _sendMessageToTab: async (...args) => { sent.push(args); return localResult; },
  };
  const handlers = load(handlerFile);
  const run = (name, data) => handlers[name].call(worker, { id: 'block', data }, { refData: { variables: {} } });
  return { run, requests, timers, writes, sent, listeners, worker, browser, load, context };
}

test('offscreen requestInput returns actual text, not default', async () => {
  const h = harness();
  const result = await h.run('userInteraction', {
    mode: 'requestInput', defaultValue: 'default', inputName: 'answer',
    variableName: 'answer', assignVariable: true, returnPath: 'result.value', logToBridge: false,
  });
  assert.equal(result.data, 'typed');
  assert.equal(h.writes[0].value, 'typed');
  assert.equal(h.sent.length, 1);
});

test('browser parallel mode forwards independent counts, repeats, delays and stop limits', async () => {
  const h = harness({ bridgeResult: (body) => body.action === 'browser_swarm_plan'
    ? { ok: true, result: { path: 'runtime/plan.json', plan: { tasks: ['preview-only'] } } }
    : { ok: true, result: { summary: { executed: 6 } } } });
  const result = await h.run('parallelRunner', {
    executionTarget: 'browser', workers: 2, browserCount: 3, repeats: 2,
    pageUrl: 'https://example.test', sleepMinSeconds: 1, sleepMaxSeconds: 3,
    successLimit: 4, failureLimit: 1, tasksJson: '{ignored in browser mode',
    returnPath: 'result.summary', assignVariable: true, variableName: 'runs',
  });
  assert.equal(h.requests[0].action, 'browser_swarm_plan');
  const plan = h.requests[0].payload;
  assert.equal(plan.browserCount, 3);
  assert.equal(plan.concurrency, 2);
  assert.equal(plan.repeats, 2);
  assert.equal(plan.sleepMaxSeconds, 3);
  assert.equal(plan.failureLimit, 1);
  assert.equal(plan.headless, true);
  assert.equal(h.requests[1].payload.path, 'runtime/plan.json');
  assert.equal(h.requests[1].payload.dryRun, false);
  assert.equal(h.requests[1].payload.plan, undefined);
  assert.equal(result.data.executed, 6);
  assert.equal(h.writes[0].value.executed, 6);
  assert.equal(h.timers.size, 0);
});

test('browser parallel dry-run and invalid configurations do not run browsers', async () => {
  const h = harness({ bridgeResult: { ok: true, result: { path: 'plan.json' } } });
  await h.run('parallelRunner', { executionTarget: 'browser', pageUrl: 'https://example.test', dryRun: true });
  assert.equal(h.requests[1].payload.dryRun, true);
  for (const change of [{ workers: 0 }, { browserCount: -1 }, { repeats: 1.5 }, { sleepMinSeconds: 3, sleepMaxSeconds: 1 }, { pageUrl: 'file:///private' }]) {
    const invalid = harness();
    const result = await invalid.run('parallelRunner', { executionTarget: 'browser', pageUrl: 'https://example.test', ...change });
    assert.equal(result.status, 'error');
    assert.equal(invalid.requests.length, 0);
  }
});

test('legacy parallel blocks remain batch actions despite old decorative browser fields', async () => {
  const h = harness();
  await h.run('parallelRunner', { workers: 2, repeats: 3, browserCount: 10, pageUrl: 'https://example.test', tasksJson: '[]' });
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].action, 'batch');
  assert.equal(h.requests[0].payload.workers, 2);
  assert.equal(h.requests[0].payload.repeats, 3);
});

test('cancelled input takes fallback and does not overwrite variable', async () => {
  const h = harness({ localResult: { value: null, cancelled: true } });
  const result = await h.run('userInteraction', {
    mode: 'requestInput', assignVariable: true, variableName: 'answer', logToBridge: false,
  });
  assert.equal(result.status, 'error');
  assert.equal(result.nextBlockId[0], 'error-block');
  assert.equal(h.writes.length, 0);
});

test('hidden invalid JS input does not break a text prompt', async () => {
  const h = harness();
  const result = await h.run('userInteraction', {
    mode: 'requestInput', inputJson: '{broken', logToBridge: false, returnPath: 'result.value',
  });
  assert.equal(result.data, 'typed');
});

test('manual control waits independently of bridge logging and covers operator timeout', async () => {
  const h = harness({ bridgeResult: { ok: true, result: { interventionResponse: { status: 'resolved' } } } });
  await h.run('userInteraction', {
    mode: 'manualControl', wait: true, createIntervention: true, logToBridge: false, timeoutSeconds: 300, timeout: 30000,
  });
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].payload.wait, true);
  assert.ok(Math.max(...h.requests[0].timerMs) > 300000);
});

test('waited bridge input is returned and assigned to the configured variable', async () => {
  const h = harness({ bridgeResult: { ok: true, result: { value: 'remote text' } } });
  const result = await h.run('userInteraction', {
    mode: 'requestInput', createIntervention: true, wait: true, defaultValue: 'default',
    inputName: 'field', variableName: 'answer', assignVariable: true, returnPath: 'result.value',
  });
  assert.equal(result.data, 'remote text');
  assert.equal(h.writes[0].name, 'answer');
  assert.equal(h.writes[0].value, 'remote text');
});

test('Manual Intervention create + wait actually awaits the created ID', async () => {
  const h = harness({ bridgeResult: ({ action }) => ({ ok: true, result: { id: 'gate', status: action.endsWith('wait') ? 'resolved' : 'waiting' } }) });
  await h.run('manualIntervention', { mode: 'create', wait: true, timeoutSeconds: 300, timeout: 30000 });
  assert.deepEqual(h.requests.map(({ action }) => action), ['manual_intervention_create', 'manual_intervention_wait']);
  assert.equal(h.requests[1].payload.id, 'gate');
  assert.ok(Math.max(...h.requests[1].timerMs) > 300000);
});

test('HTTP timeout uses seconds at bridge and milliseconds for transport', async () => {
  const h = harness({ bridgeResult: { ok: true, result: { status: 200 } } });
  await h.run('httpClient', { url: 'https://example.test', timeout: 20 });
  assert.equal(h.requests[0].payload.timeout, 20);
  assert.ok(Math.max(...h.requests[0].timerMs) > 20000);
  assert.equal(h.timers.size, 0);
});

test('HTTP error status is inspectable unless stopAfterError is enabled', async () => {
  for (const stopAfterError of [false, true]) {
    const h = harness({ bridgeResult: { ok: false, result: { status: 404, text: 'Not found' } } });
    const result = await h.run('httpClient', {
      url: 'https://example.test', stopAfterError, returnPath: 'result.status',
      assignVariable: true, variableName: 'http_status',
    });
    if (stopAfterError) {
      assert.equal(result.status, 'error');
      assert.equal(h.writes.length, 0);
    } else {
      assert.equal(result.data, 404);
      assert.equal(result.nextBlockId[0], 'next-block');
      assert.equal(h.writes[0].value, 404);
    }
  }
});

test('HTTP network failure is never treated as an HTTP response', async () => {
  const h = harness({ bridgeResult: { ok: false, error: 'Connection refused' } });
  const result = await h.run('httpClient', { url: 'https://example.test', stopAfterError: false });
  assert.equal(result.status, 'error');
  assert.equal(result.data.error, 'Connection refused');
});

test('new HTTP blocks retain 20-second default after base settings', () => {
  const h = harness();
  assert.equal(h.load('business/dev/blocks/index.js').default()['http-client'].data.timeout, 20);
});

test('input failure never fabricates a value or calls bridge', async () => {
  const h = harness();
  h.worker._sendMessageToTab = async () => { throw new Error('restricted page'); };
  const result = await h.run('userInteraction', {
    mode: 'requestInput', defaultValue: 'default', assignVariable: true, variableName: 'answer',
  });
  assert.equal(result.status, 'error');
  assert.equal(h.writes.length, 0);
  assert.equal(h.requests.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('messageBox uses offscreen content messaging, with notification on unavailable tab', async () => {
  const h = harness({ localResult: { shown: true, acknowledged: true } });
  let result = await h.run('userInteraction', { mode: 'messageBox', logToBridge: false, returnPath: 'result' });
  assert.equal(result.data.acknowledged, true);
  assert.equal(result.data.target, 'activeTab');
  h.worker.activeTab = {};
  h.browser.tabs.query = async () => [];
  result = await h.run('userInteraction', { mode: 'messageBox', logToBridge: false, returnPath: 'result' });
  assert.equal(result.data.target, 'notification');
  assert.equal(result.data.acknowledged, false);
});

test('manual control without a tab fails before creating a checkpoint', async () => {
  const h = harness();
  h.worker.activeTab = {};
  h.browser.tabs.query = async () => [];
  const result = await h.run('userInteraction', { mode: 'manualControl', createIntervention: true, wait: true });
  assert.equal(result.status, 'error');
  assert.equal(h.requests.length, 0);
});

test('bridge rejection and timeout never advance or overwrite input', async () => {
  for (const error of ['timeout', 'manual intervention failed']) {
    const h = harness({ bridgeResult: { ok: false, error, result: { value: null } } });
    const result = await h.run('userInteraction', {
      mode: 'requestInput', createIntervention: true, wait: true, assignVariable: true, variableName: 'answer',
    });
    assert.equal(result.status, 'error');
    assert.equal(result.data.error, error);
    assert.equal(h.writes.length, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.listeners.size, 0);
  }
});

test('requestInput may be answered remotely without a local dialog', async () => {
  const h = harness({ bridgeResult: { ok: true, result: { value: '' } } });
  const result = await h.run('userInteraction', {
    mode: 'requestInput', createIntervention: true, wait: true, logToBridge: false,
    assignVariable: true, inputName: 'answer', returnPath: 'result.value',
  });
  assert.equal(result.data, '');
  assert.equal(h.sent.length, 0);
  assert.equal(h.writes[0].name, 'answer');
  assert.equal(h.requests[0].payload.workflowId, 'workflow');
  assert.equal(h.requests[0].payload.blockId, 'block');
});

test('operator timeout cancels the dialog and releases listeners', async () => {
  const h = harness();
  h.worker._sendMessageToTab = () => new Promise(() => {});
  const pending = h.run('userInteraction', { mode: 'requestInput', timeoutSeconds: 2, logToBridge: false });
  await new Promise(setImmediate);
  const timer = [...h.timers.values()].find(({ ms }) => ms === 2000);
  assert.ok(timer);
  timer.fn();
  const result = await pending;
  assert.equal(result.status, 'error');
  assert.match(result.data.error, /timed out/);
  assert.equal(h.sent[0][1].data.cancel, true);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.timers.size, 0);
});

test('workflow stop aborts manual wait and ignores a late response', async () => {
  let respond;
  const h = harness({ bridgeResult: () => new Promise((resolve) => { respond = resolve; }) });
  const pending = h.run('userInteraction', { mode: 'manualControl', wait: true, assignVariable: true, variableName: 'answer' });
  await new Promise(setImmediate);
  h.worker.engine.isDestroyed = true;
  h.listeners.get('stop')('execution');
  assert.equal(h.requests[0].signal.aborted, true);
  respond({ ok: true, result: {} });
  const result = await pending;
  assert.equal(result.nextBlockId.length, 0);
  assert.equal(h.writes.length, 0);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.timers.size, 0);
});

test('Manual Intervention respond can submit an intentionally empty input', async () => {
  const h = harness();
  await h.run('manualIntervention', { mode: 'respond', interventionId: 'gate', includeInput: true, inputValue: '' });
  assert.equal(h.requests[0].payload.inputValue, '');
  assert.equal(h.requests[0].payload.id, 'gate');
});

test('captcha wait transport includes scan and operator budgets', async () => {
  const h = harness();
  await h.run('manualIntervention', { mode: 'captchaCheck', wait: true, timeoutSeconds: 300, timeout: 30000 });
  assert.equal(h.requests[0].action, 'captcha_manual_check');
  assert.ok(Math.max(...h.requests[0].timerMs) >= 330000);
});

function installDOM(h) {
  const elements = [];
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.events = new Map(); elements.push(this); }
    append(...children) { children.forEach((child) => { child.parent = this; this.children.push(child); }); }
    attachShadow() { this.shadow = new Element('shadow'); return this.shadow; }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(name, fn) { this.events.set(name, fn); }
    removeEventListener(name) { this.events.delete(name); }
    dispatch(name) { this.events.get(name)?.({ preventDefault() {} }); }
    showModal() { this.open = true; }
    focus() { this.focused = true; }
    remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
  }
  const documentElement = new Element('html');
  const window = new Element('window');
  h.context.document = { documentElement, createElement: (tag) => new Element(tag) };
  h.context.window = window;
  return { elements, documentElement, window, find: (tag) => elements.find((el) => el.tag === tag) };
}

test('real content handler captures edited text, including empty string, through block assignment', async () => {
  for (const typed of ['operator text', '']) {
    const h = harness();
    const dom = installDOM(h);
    const content = h.load('business/dev/blocks/contentHandler/index.js').default();
    h.worker._sendMessageToTab = (message) => content.userInteraction(message);
    const pending = h.run('userInteraction', {
      mode: 'requestInput', defaultValue: 'default', inputName: 'answer', variableName: 'answer',
      assignVariable: true, returnPath: 'result.value', logToBridge: false,
    });
    await new Promise(setImmediate);
    assert.equal(dom.find('input').value, 'default');
    assert.equal(dom.find('dialog').open, true);
    dom.find('input').value = typed;
    dom.find('form').dispatch('submit');
    assert.equal((await pending).data, typed);
    assert.equal(h.writes[0].value, typed);
    assert.equal(dom.documentElement.children.length, 0);
    assert.equal(dom.window.events.size, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('content dialog handles Escape, page navigation, cancellation and deadline without leaking UI', async () => {
  for (const action of ['escape', 'pagehide', 'cancel', 'timeout']) {
    const h = harness();
    const dom = installDOM(h);
    const dialog = h.load('business/dev/blocks/contentHandler/operatorDialog.js').default;
    const pending = dialog({ data: { mode: 'requestInput', promptId: action, deadline: Date.now() + 10000 } });
    if (action === 'escape') dom.find('dialog').dispatch('cancel');
    if (action === 'pagehide') dom.window.dispatch('pagehide');
    if (action === 'cancel') dialog({ data: { promptId: action, cancel: true } });
    if (action === 'timeout') [...h.timers.values()][0].fn();
    assert.equal((await pending).cancelled, true);
    assert.equal(dom.documentElement.children.length, 0);
    assert.equal(dom.window.events.size, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('late prompt delivery does not display an expired dialog', () => {
  const h = harness();
  const dom = installDOM(h);
  const result = h.load('business/dev/blocks/contentHandler/operatorDialog.js').default({
    data: { mode: 'messageBox', promptId: 'expired', deadline: Date.now() - 1 },
  });
  assert.equal(result.cancelled, true);
  assert.equal(dom.documentElement.children.length, 0);
});

test('content messageBox waits for acknowledgement and renders operator text literally', async () => {
  const h = harness();
  const dom = installDOM(h);
  const pending = h.load('business/dev/blocks/contentHandler/operatorDialog.js').default({
    data: { mode: 'messageBox', promptId: 'message', deadline: Date.now() + 10000, message: '<script>bad()</script>' },
  });
  assert.equal(dom.find('p').textContent, '<script>bad()</script>');
  dom.find('form').dispatch('submit');
  assert.equal((await pending).acknowledged, true);
});

function loadEditor(file, data = {}) {
  const compiler = require('@vue/compiler-sfc');
  const filename = path.join(root, 'business/dev/blocks/editComponents', file);
  const { descriptor, errors } = compiler.parse(fs.readFileSync(filename, 'utf8'));
  assert.equal(errors.length, 0);
  const script = compiler.compileScript(descriptor, { id: file });
  const template = compiler.compileTemplate({ source: descriptor.template.content, filename, id: file });
  assert.equal(template.errors.length, 0);
  const code = babel.transformSync(script.content, {
    babelrc: false, configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]],
  }).code;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require, module, exports) { ${code}\n})`)(() => ({}), module, module.exports);
  const props = { data };
  return { data, setup: module.exports.default.setup(props, {
    expose() {}, emit: (_name, updated) => Object.assign(data, updated),
  }) };
}

test('editor mode switching resets stale checkpoint flags and return paths', () => {
  const { setup, data } = loadEditor('EditUserInteraction.vue');
  setup.selectMode('manualControl');
  assert.equal(data.wait, true);
  assert.equal(data.createIntervention, true);
  setup.selectMode('requestInput');
  assert.equal(data.wait, false);
  assert.equal(data.createIntervention, false);
  assert.equal(data.returnPath, 'result.value');
  assert.equal(data.variableName, 'user_input');
  setup.updateInputName('new_name');
  assert.equal(data.variableName, 'new_name');
  data.variableName = 'custom_destination';
  setup.updateInputName('field_name');
  assert.equal(data.variableName, 'custom_destination');
});

test('manual Pause preset waits and all edited SFCs compile', () => {
  const { setup, data } = loadEditor('EditManualIntervention.vue');
  setup.selectMode('create');
  assert.equal(data.wait, true);
  loadEditor('EditHttpClient.vue');
});

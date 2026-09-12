const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '../src/content/services/recordWorkflow');

function harness({ rejectAt } = {}) {
  const timers = new Map();
  const pending = [];
  const errors = [];
  const state = { isRecording: true, recording: { flows: [
    { id: 'trigger' }, { id: 'new-tab' },
  ] } };
  let now = 0;
  const setTimeout = (fn, ms) => {
    const id = {};
    timers.set(id, { fn, at: now + ms });
    return id;
  };
  const clearTimeout = (id) => timers.delete(id);
  const delay = async (operation) => {
    await new Promise(setImmediate);
    if (rejectAt === operation) {
      rejectAt = null;
      throw new Error(`storage ${operation} failed`);
    }
  };
  const browser = { storage: { local: {
    async get() {
      // Storage returns isolated snapshots, not a shared mutable recording.
      const snapshot = structuredClone(state);
      await delay('get');
      return snapshot;
    },
    async set(value) {
      const snapshot = structuredClone(value);
      await delay('set');
      Object.assign(state, snapshot);
    },
  } } };
  const context = vm.createContext({
    console: { error: (error) => errors.push(error) },
    setTimeout, clearTimeout,
    document: { body: { hasAttribute: () => false } },
    window: { top: { postMessage() {} } },
  });
  const mocks = {
    'webextension-polyfill': browser,
    nanoid: { nanoid: () => 'group' },
    '@/lib/findSelector': { __esModule: true, default: (target) => `#${target.id}` },
    '@/utils/recordKeys': { recordPressedKey() { throw new Error('Unexpected key event'); } },
    '@/utils/helper': { debounce(callback, ms = 200) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        return new Promise((resolve) => {
          timer = setTimeout(() => { callback(...args); resolve(); }, ms);
        });
      };
    } },
  };
  function load(file, extraExports = '') {
    const filename = path.join(root, file);
    const source = babel.transformSync(fs.readFileSync(filename, 'utf8') + extraExports, {
      filename, babelrc: false, configFile: false,
      presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]],
    }).code;
    const module = { exports: {} };
    const resolve = (name) => {
      assert.ok(Object.hasOwn(mocks, name), `Unexpected import: ${name}`);
      return mocks[name];
    };
    vm.runInContext(`(function(require, module, exports) { ${source}\n})`, context, { filename })(resolve, module, module.exports);
    return module.exports;
  }
  const addBlock = load('addBlock.js').default;
  mocks['./addBlock'] = (...args) => {
    const operation = addBlock(...args);
    pending.push(operation);
    return operation;
  };
  const events = load('recordEvents.js', '\nexport { onInputTextField, onClick, onFocusOut };');
  return {
    addBlock, events,
    flows: () => structuredClone(state.recording.flows),
    async drain() {
      await Promise.all(pending.splice(0));
      assert.deepEqual(errors, []);
    },
    async advance(ms) {
      const end = now + ms;
      while (timers.size) {
        const [id, timer] = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (timer.at > end) break;
        now = timer.at;
        timers.delete(id);
        timer.fn();
      }
      now = end;
      await this.drain();
    },
  };
}

function field(id, value) {
  return {
    id, value, name: id, tagName: 'INPUT',
    dataset: { automaElSelector: `#${id}` },
    removeEventListener() {},
  };
}

const send = { id: 'send', tagName: 'BUTTON', innerText: 'Send' };

test('immediate input then Send records the actual value before the click with no delayed duplicate', async () => {
  const h = harness();
  const target = field('message', 'draft');
  h.events.onInputTextField({ target });
  target.value = 'actual typed value';
  h.events.onInputTextField({ target });
  h.events.onClick({ target: send });
  target.value = '';
  await h.drain();
  const flows = h.flows();
  assert.deepEqual(flows.map(({ id }) => id), ['trigger', 'new-tab', 'forms', 'event-click']);
  assert.equal(flows[2].data.value, 'actual typed value');
  assert.equal(flows[2].data.selector, '#message');
  assert.equal(flows[3].data.selector, '#send');
  await h.advance(1000);
  assert.deepEqual(h.flows(), flows);
});

test('focusout flushes a value snapshot before debounce and does not duplicate it later', async () => {
  const h = harness();
  const target = field('message', 'typed before blur');
  h.events.onInputTextField({ target });
  target.value = 'changed without an input event';
  h.events.onFocusOut({ target });
  await h.drain();
  const flows = h.flows();
  assert.equal(flows.length, 3);
  assert.equal(flows[2].id, 'forms');
  assert.equal(flows[2].data.value, 'typed before blur');
  await h.advance(1000);
  assert.deepEqual(h.flows(), flows);
});

test('switching input fields within debounce preserves both values in order', async () => {
  const h = harness();
  const first = field('first', 'first value');
  const second = field('second', 'second value');
  h.events.onInputTextField({ target: first });
  first.value = '';
  h.events.onInputTextField({ target: second });
  await h.advance(300);
  assert.deepEqual(h.flows().slice(2).map(({ id, data }) => [id, data.selector, data.value]), [
    ['forms', '#first', 'first value'], ['forms', '#second', 'second value'],
  ]);
  const flows = h.flows();
  await h.advance(1000);
  assert.deepEqual(h.flows(), flows);
});

test('debounce retains the latest input snapshot at 300 ms without a click', async () => {
  const h = harness();
  const target = field('message', 'draft');
  h.events.onInputTextField({ target });
  await h.advance(200);
  target.value = 'final text';
  h.events.onInputTextField({ target });
  target.value = '';
  await h.advance(299);
  assert.equal(h.flows().length, 2);
  await h.advance(1);
  assert.equal(h.flows().length, 3);
  assert.equal(h.flows()[2].data.value, 'final text');
});

test('concurrent addBlock calls preserve appends and mutations across delayed get/set', async () => {
  const h = harness();
  await Promise.all([
    h.addBlock({ id: 'forms', data: { selector: '#message', value: 'draft' } }),
    h.addBlock((recording) => {
      recording.flows[0].data = { updated: true };
      recording.flows.at(-1).data.value = 'final text';
    }),
    h.addBlock({ id: 'event-click', data: { selector: '#send' } }),
  ]);
  assert.deepEqual(h.flows(), [
    { id: 'trigger', data: { updated: true } },
    { id: 'new-tab' },
    { id: 'forms', data: { selector: '#message', value: 'final text' } },
    { id: 'event-click', data: { selector: '#send' } },
  ]);
});

for (const rejectAt of ['get', 'set', 'callback']) {
  test(`addBlock ${rejectAt} rejection reaches the caller without poisoning queued or later writes`, async () => {
    const h = harness({ rejectAt });
    const failed = h.addBlock(rejectAt === 'callback' ? () => {
      throw new Error('callback failed');
    } : { id: 'failed' });
    const queued = h.addBlock({ id: 'queued' });
    await assert.rejects(failed, new RegExp(`${rejectAt} failed`));
    const result = await queued;
    assert.equal(result.addedBlock.id, 'queued');
    await h.addBlock({ id: 'later' });
    assert.deepEqual(h.flows().map(({ id }) => id), ['trigger', 'new-tab', 'queued', 'later']);
  });
}

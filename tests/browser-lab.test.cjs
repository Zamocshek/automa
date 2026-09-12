const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const vue = require('vue');
const { parse, compileScript } = require('@vue/compiler-sfc');

const root = path.resolve(__dirname, '..');
const plain = (value) => JSON.parse(JSON.stringify(value));
const tick = () => new Promise((resolve) => setImmediate(resolve));

function event() {
  const listeners = new Set();
  return {
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
    emit: (...args) => [...listeners].forEach((listener) => listener(...args)),
    get size() {
      return listeners.size;
    },
  };
}

function fixture() {
  const calls = [];
  const hooks = {};
  const storage = {};
  const tabs = new Map([
    [
      1,
      { id: 1, windowId: 10, url: 'https://other.test/', status: 'complete' },
    ],
    [
      7,
      {
        id: 7,
        windowId: 70,
        url: 'https://site.test/account',
        status: 'complete',
      },
    ],
  ]);
  const pagehide = event();
  const port = {
    onMessage: event(),
    onDisconnect: event(),
    disconnect() {
      calls.push(['port.disconnect']);
      this.onDisconnect.emit();
    },
  };
  const chrome = {
    runtime: {},
    debugger: { onEvent: event(), onDetach: event() },
  };
  const fail = (message, callback) => {
    chrome.runtime.lastError = { message };
    callback();
    delete chrome.runtime.lastError;
  };
  for (const method of ['attach', 'sendCommand', 'detach']) {
    chrome.debugger[method] = (...args) => {
      const callback = args.pop();
      calls.push([method, ...plain(args)]);
      if (hooks[method]) hooks[method](...args, callback);
      else callback();
    };
  }
  const browser = {
    runtime: { getManifest: () => ({ manifest_version: 3 }) },
    tabs: {
      onUpdated: event(),
      onRemoved: event(),
      async get(id) {
        if (!tabs.has(id)) throw new Error('No tab');
        return { ...tabs.get(id) };
      },
      async getCurrent() {
        return { id: 900, windowId: 9000 };
      },
      async query(query) {
        calls.push(['query', plain(query)]);
        if (query.active) return [await this.get(1)];
        return [...tabs.values()];
      },
      async update(id, update) {
        calls.push(['update', id, plain(update)]);
        if (id === 900) return { id, windowId: 9000 };
        const tab = { ...(await this.get(id)), ...update };
        tabs.set(id, tab);
        if (hooks.update) await hooks.update(id, update);
        return tab;
      },
      async sendMessage(id, message) {
        calls.push(['message', id, plain(message)]);
        if (message.type === 'automa-element-selector')
          throw new Error('Receiving end does not exist');
        return true;
      },
      connect(id, options) {
        calls.push(['connect', id, plain(options)]);
        if (!hooks.pendingSelection) {
          queueMicrotask(() => port.onMessage.emit('#account-button'));
        }
        return port;
      },
    },
    windows: {
      async update(id, update) {
        calls.push(['focus', id, plain(update)]);
      },
      async create(options) {
        calls.push(['create', plain(options)]);
        const tab = {
          id: 100 + tabs.size,
          windowId: 80,
          status: 'complete',
          url: options.url,
          ...hooks.createdTab,
        };
        tabs.set(tab.id, tab);
        return { id: 80, tabs: [tab] };
      },
    },
    storage: {
      local: {
        async get(keys) {
          return structuredClone(
            Object.fromEntries(
              (Array.isArray(keys) ? keys : [keys])
                .filter((key) => key in storage)
                .map((key) => [key, storage[key]])
            )
          );
        },
        async set(value) {
          Object.assign(storage, plain(value));
        },
        async remove(keys) {
          keys.forEach((key) => delete storage[key]);
        },
      },
    },
    action: {
      async setBadgeText(value) {
        calls.push(['badge', plain(value)]);
      },
      async setBadgeBackgroundColor() {},
    },
    scripting: {
      async executeScript(options) {
        calls.push(['inject', plain(options)]);
        if (hooks.inject) await hooks.inject(options);
      },
    },
  };
  const unmount = [];
  const routes = [];
  const context = vm.createContext({
    console: { error() {}, warn() {} },
    URL,
    TextEncoder,
    AbortController,
    setTimeout,
    clearTimeout,
    chrome,
    fetch: async (...args) => {
      assert.ok(hooks.fetch, 'Unexpected network call');
      return hooks.fetch(...args);
    },
    addEventListener: (name, listener) => {
      if (name === 'pagehide') pagehide.addListener(listener);
    },
    removeEventListener: (name, listener) => {
      if (name === 'pagehide') pagehide.removeListener(listener);
    },
  });
  const stubs = {
    vue: { ...vue, onMounted() {}, onBeforeUnmount: (fn) => unmount.push(fn) },
    'webextension-polyfill': { default: browser },
    'vue-router': {
      useRouter: () => ({
        push: async (route) => {
          routes.push(route);
          unmount.forEach((fn) => fn());
        },
      }),
    },
    '@/utils/helper': {
      getActiveTab: () => browser.tabs.get(1),
      sleep: async () => {},
      isXPath: () => false,
      findTriggerBlock: () => null,
    },
    '@/utils/workflowTrigger': { registerWorkflowTrigger() {} },
    '@/stores/workflow': {
      useWorkflowStore: () => ({
        retrieved: true,
        insert: async (workflow) => ({ saved: workflow }),
      }),
    },
  };
  const modules = new Map();
  async function moduleFor(specifier) {
    if (modules.has(specifier)) return modules.get(specifier);
    let mod;
    if (stubs[specifier]) {
      const exports = stubs[specifier];
      mod = new vm.SyntheticModule(
        Object.keys(exports),
        function initialize() {
          Object.entries(exports).forEach(([key, value]) =>
            this.setExport(key, value)
          );
        },
        { context }
      );
    } else {
      const filename = specifier.replace(/^@\//, 'src/');
      const source = await readFile(path.join(root, filename), 'utf8');
      const code = filename.endsWith('.vue')
        ? compileScript(parse(source).descriptor, { id: 'browser-lab-test' })
            .content
        : source;
      mod = new vm.SourceTextModule(code, { context, identifier: specifier });
    }
    modules.set(specifier, mod);
    return mod;
  }
  async function load(specifier) {
    const mod = await moduleFor(specifier);
    if (mod.status === 'unlinked') {
      await mod.link((name) =>
        moduleFor(stubs[name] || /\.[a-z]+$/i.test(name) ? name : `${name}.js`)
      );
    }
    if (mod.status === 'linked') await mod.evaluate();
    return mod.namespace;
  }
  async function session(limits) {
    const mod = await load('@/newtab/utils/browserLabSession.js');
    const lab = limits
      ? mod.createBrowserLabSession(browser, chrome, limits)
      : mod.default;
    lab.state.browserLabTabId = 7;
    return lab;
  }
  function request(id, url, extras = {}, source = { tabId: 7 }) {
    chrome.debugger.onEvent.emit(source, 'Network.requestWillBeSent', {
      requestId: id,
      request: { url, method: 'GET', ...extras },
    });
  }
  async function studio() {
    const mod = await load('src/newtab/pages/VisualCodingStudio.vue');
    return mod.default.setup({}, { expose() {} });
  }
  return {
    calls,
    hooks,
    storage,
    tabs,
    chrome,
    browser,
    pagehide,
    port,
    fail,
    load,
    session,
    request,
    studio,
    routes,
  };
}

test('recording route round trip keeps the tab, URL, selector and active HTTP capture', async () => {
  const f = fixture();
  const lab = await f.session();
  const first = await f.studio();
  first.browserUrl.value = 'https://site.test/';
  first.browserSelector.value = '#saved';
  await first.startHttpSniffRecord();
  f.request('one', 'https://site.test/api/one');
  await first.startBrowserActionRecording();
  assert.deepEqual(f.routes, ['/recording']);
  assert.equal(f.storage.recording.activeTab.id, 7);
  assert.equal(
    f.storage.recording.flows[0].data.url,
    'https://site.test/account'
  );
  const second = await f.studio();
  f.request('two', 'https://site.test/api/two');
  assert.equal(second.browserSelector.value, '#saved');
  assert.equal(second.browserUrl.value, 'https://site.test/');
  assert.equal(second.httpSniffRequests.value.length, 2);
  assert.equal(second.httpSniffActive.value, true);
  assert.equal(f.chrome.debugger.onEvent.size, 1);
  assert.equal(
    f.calls.filter(([name]) => name === 'create' || name === 'detach').length,
    0
  );
  assert.equal(
    f.calls.filter(([name, , options]) => name === 'update' && options.url)
      .length,
    0
  );
  await lab.stopHttpSniff();
});

test('new-tab sniff enables Network before navigating and captures the first request', async () => {
  const f = fixture();
  const lab = await f.session();
  lab.state.browserLabTabId = null;
  f.hooks.update = (id, options) => {
    if (options.url) f.request('document', options.url, {}, { tabId: id });
  };
  await lab.startHttpSniff('https://initial.test');
  const attach = f.calls.findIndex(([name]) => name === 'attach');
  const enable = f.calls.findIndex(([name]) => name === 'sendCommand');
  const navigate = f.calls.findIndex(
    ([name, , options]) => name === 'update' && options.url
  );
  assert.ok(attach < enable && enable < navigate);
  assert.equal(lab.state.httpSniffRequests[0].url, 'https://initial.test/');
  await lab.stopHttpSniff();
});

test('new-tab sniff navigates when Chrome reports pendingUrl about:blank', async () => {
  for (const url of ['', 'about:blank']) {
    const f = fixture();
    const lab = await f.session();
    lab.state.browserLabTabId = null;
    f.hooks.createdTab = { status: 'loading', url, pendingUrl: 'about:blank' };
    f.hooks.update = (id, options) => {
      if (!options.url) return;
      f.tabs.get(id).pendingUrl = options.url;
      f.request('document', options.url, {}, { tabId: id });
    };
    try {
      await lab.startHttpSniff('http://127.0.0.1:8080/browser-lab-fixture');
      const enable = f.calls.findIndex(([name]) => name === 'sendCommand');
      const navigate = f.calls.findIndex(
        ([name, , options]) => name === 'update' && options.url
      );
      assert.ok(
        enable >= 0 && navigate > enable,
        'navigate after Network.enable'
      );
      assert.equal(
        lab.state.httpSniffRequests[0].url,
        'http://127.0.0.1:8080/browser-lab-fixture'
      );
      assert.match(lab.state.browserLabStatus, /browser-lab-fixture/);
    } finally {
      await lab.stopHttpSniff();
    }
  }
});

test('existing tab with a nonblank pendingUrl is not redirected to the initial URL', async () => {
  const f = fixture();
  const lab = await f.session();
  Object.assign(f.tabs.get(7), {
    status: 'loading',
    url: 'about:blank',
    pendingUrl: 'https://site.test/current-page',
  });
  try {
    await lab.startHttpSniff('https://site.test/initial-page');
    assert.equal(
      f.calls.filter(([name, , options]) => name === 'update' && options.url)
        .length,
      0
    );
    assert.equal(lab.state.httpSniffActive, true);
  } finally {
    await lab.stopHttpSniff();
  }
});

test('concurrent starts attach once; Stop during attach cannot leave a live debugger', async () => {
  const f = fixture();
  const lab = await f.session();
  let attached;
  f.hooks.attach = (target, version, callback) => {
    attached = callback;
  };
  const start = lab.startHttpSniff('https://site.test');
  assert.equal(lab.startHttpSniff('https://site.test'), start);
  const failure = assert.rejects(start, /cancelled/);
  await tick();
  const stop = lab.stopHttpSniff();
  attached();
  await failure;
  await stop;
  assert.equal(f.calls.filter(([name]) => name === 'attach').length, 1);
  assert.equal(f.calls.filter(([name]) => name === 'detach').length, 1);
  assert.equal(f.calls.filter(([name]) => name === 'sendCommand').length, 0);
  assert.equal(lab.state.httpSniffBusy, false);
  assert.equal(lab.state.httpSniffActive, false);
  assert.equal(
    f.chrome.debugger.onEvent.size +
      f.chrome.debugger.onDetach.size +
      f.pagehide.size,
    0
  );
});

test('enable failure detaches, preserves the last capture and allows retry', async () => {
  const f = fixture();
  const lab = await f.session();
  await lab.startHttpSniff('https://site.test');
  f.request('saved', 'https://site.test/saved');
  await lab.stopHttpSniff();
  f.hooks.sendCommand = (target, method, params, callback) =>
    f.fail('enable denied', callback);
  await assert.rejects(
    lab.startHttpSniff('https://site.test'),
    /enable denied/
  );
  assert.equal(lab.state.httpSniffRequests[0].url, 'https://site.test/saved');
  assert.equal(f.calls.filter(([name]) => name === 'detach').length, 2);
  assert.equal(
    f.chrome.debugger.onEvent.size + f.chrome.debugger.onDetach.size,
    0
  );
  delete f.hooks.sendCommand;
  await lab.startHttpSniff('https://site.test');
  await lab.stopHttpSniff();
});

test('attach failure does not detach a debugger owned by someone else', async () => {
  const f = fixture();
  const lab = await f.session();
  f.hooks.attach = (target, version, callback) =>
    f.fail('Already attached', callback);
  await assert.rejects(
    lab.startHttpSniff('https://site.test'),
    /Already attached/
  );
  assert.equal(f.calls.filter(([name]) => name === 'detach').length, 0);
  assert.equal(
    f.chrome.debugger.onEvent.size + f.chrome.debugger.onDetach.size,
    0
  );
});

test('external detach clears listeners and active state; detach during enable is not success', async () => {
  const f = fixture();
  const lab = await f.session();
  f.hooks.sendCommand = (target, method, params, callback) => {
    f.chrome.debugger.onDetach.emit({ tabId: 7 }, 'canceled_by_user');
    callback();
  };
  await assert.rejects(lab.startHttpSniff('https://site.test'), /cancelled/);
  assert.equal(lab.state.httpSniffActive, false);
  delete f.hooks.sendCommand;
  await lab.startHttpSniff('https://site.test');
  f.request('saved', 'https://site.test/saved');
  f.chrome.debugger.onDetach.emit({ tabId: 1 }, 'target_closed');
  assert.equal(lab.state.httpSniffActive, true);
  f.chrome.debugger.onDetach.emit({ tabId: 7 }, 'target_closed');
  assert.equal(lab.state.httpSniffActive, false);
  assert.equal(lab.state.browserLabTabId, null);
  assert.equal(lab.state.httpSniffRequests.length, 1);
  assert.equal(
    f.chrome.debugger.onEvent.size + f.chrome.debugger.onDetach.size,
    0
  );
});

test('Stop targets the attached tab, not a subsequently selected Browser Lab tab', async () => {
  const f = fixture();
  const lab = await f.session();
  await lab.startHttpSniff('https://site.test');
  lab.state.browserLabTabId = 1;
  f.request('right', 'https://site.test/right');
  f.request('wrong', 'https://other.test/wrong', {}, { tabId: 1 });
  f.request(
    'child',
    'https://site.test/frame',
    {},
    { tabId: 7, sessionId: 'child-frame' }
  );
  await lab.stopHttpSniff();
  assert.deepEqual(
    f.calls.find(([name]) => name === 'detach'),
    ['detach', { tabId: 7 }]
  );
  assert.equal(lab.state.httpSniffRequests.length, 1);
});

test('detach errors retain ownership for an explicit Stop retry', async () => {
  const f = fixture();
  const lab = await f.session();
  await lab.startHttpSniff('https://site.test');
  f.hooks.detach = (target, callback) => f.fail('detach unavailable', callback);
  await assert.rejects(lab.stopHttpSniff(), /detach unavailable/);
  await assert.rejects(
    lab.startHttpSniff('https://site.test'),
    /still attached/
  );
  assert.equal(lab.state.httpSniffActive, true);
  delete f.hooks.detach;
  await lab.stopHttpSniff();
  assert.equal(lab.state.httpSniffActive, false);
  assert.equal(f.chrome.debugger.onDetach.size, 0);
});

test('redirect hops with the same requestId retain bodies, status and order', async () => {
  const f = fixture();
  const lab = await f.session();
  await lab.startHttpSniff('https://site.test');
  f.request('chain', 'https://site.test/login', {
    method: 'POST',
    postData: 'form=one',
  });
  f.chrome.debugger.onEvent.emit({ tabId: 7 }, 'Network.requestWillBeSent', {
    requestId: 'chain',
    redirectResponse: { status: 302, statusText: 'Found' },
    request: { url: 'https://site.test/account', method: 'GET' },
  });
  f.chrome.debugger.onEvent.emit({ tabId: 7 }, 'Network.responseReceived', {
    requestId: 'chain',
    response: { status: 200, mimeType: 'text/html' },
  });
  await lab.stopHttpSniff();
  assert.deepEqual(
    plain(
      lab.state.httpSniffRequests.map(({ method, url, body, status }) => ({
        method,
        url,
        body,
        status,
      }))
    ),
    [
      {
        method: 'POST',
        url: 'https://site.test/login',
        body: 'form=one',
        status: 302,
      },
      {
        method: 'GET',
        url: 'https://site.test/account',
        body: '',
        status: 200,
      },
    ]
  );
});

test('count and byte limits stop capture explicitly without dropping retained requests', async () => {
  for (const limits of [{ maxRequests: 2 }, { maxBytes: 1024 }]) {
    const f = fixture();
    const lab = await f.session(limits);
    await lab.startHttpSniff('https://site.test');
    f.request('one', 'https://site.test/one');
    f.request('two', 'https://site.test/two');
    f.request('excess', 'https://site.test/excess', {
      postData: 'x'.repeat(2048),
    });
    await tick();
    assert.equal(lab.state.httpSniffRequests.length, 2);
    assert.equal(lab.state.httpSniffActive, false);
    assert.match(lab.state.httpSniffStatus, /capture limit reached/);
    assert.equal(f.chrome.debugger.onEvent.size, 0);
  }
});

test('picker uses the explicit loaded tab, injects without a receiver and releases its port', async () => {
  const f = fixture();
  await f.session();
  const studio = await f.studio();
  await studio.pickBrowserSelector();
  assert.equal(studio.browserSelector.value, '#account-button');
  assert.deepEqual(
    f.calls.find(([name]) => name === 'connect'),
    ['connect', 7, { name: 'silverback-browser-lab-selector', frameId: 0 }]
  );
  assert.equal(f.calls.find(([name]) => name === 'inject')[1].target.tabId, 7);
  assert.equal(f.port.onMessage.size + f.port.onDisconnect.size, 0);
  assert.ok(f.calls.some(([name, id]) => name === 'focus' && id === 9000));
  assert.equal(
    f.calls.filter(([name, , options]) => name === 'update' && options.url)
      .length,
    0
  );
});

test('picker cancellation and route exit release a pending port without stopping HTTP sniff', async () => {
  for (const leaveRoute of [false, true]) {
    const f = fixture();
    const lab = await f.session();
    const studio = await f.studio();
    await lab.startHttpSniff('https://site.test');
    f.hooks.pendingSelection = true;
    const selecting = studio.pickBrowserSelector();
    await tick();
    assert.equal(f.port.onMessage.size, 1);
    if (leaveRoute) await studio.openRecordingPage();
    else await studio.pickBrowserSelector();
    await selecting;
    assert.equal(f.port.onMessage.size + f.port.onDisconnect.size, 0);
    assert.equal(studio.browserLabBusy.value, false);
    assert.equal(studio.browserSelectorPicking.value, false);
    assert.equal(lab.state.httpSniffActive, true);
    await lab.stopHttpSniff();
  }
});

test('recording start failures roll back state and do not navigate to Recording', async () => {
  const f = fixture();
  await f.session();
  const studio = await f.studio();
  f.storage.recording = { flows: [{ id: 'saved' }], name: 'unsaved previous' };
  f.hooks.inject = async (options) => {
    if (options.target.tabId === 7) throw new Error('injection denied');
  };
  await assert.rejects(
    studio.startBrowserActionRecording(),
    /injection denied/
  );
  assert.deepEqual(f.routes, []);
  assert.equal(f.storage.isRecording, undefined);
  assert.equal(f.storage.recording.name, 'unsaved previous');
  assert.ok(
    f.calls.some(
      ([name, id, message]) =>
        name === 'message' && id === 7 && message.type === 'recording:stop'
    )
  );
  assert.ok(
    f.calls.some(([name, badge]) => name === 'badge' && badge.text === '')
  );
  assert.equal(studio.browserLabBusy.value, false);
});

test('an unrelated tab injection error does not abort target recording; second start does not erase it', async () => {
  const f = fixture();
  const { default: start } = await f.load(
    '@/newtab/utils/startRecordWorkflow.js'
  );
  f.hooks.inject = async (options) => {
    if (options.target.tabId === 1) throw new Error('unrelated restricted tab');
  };
  await start({ name: 'target' }, 7);
  assert.equal(f.storage.isRecording, true);
  assert.equal(f.calls.find(([name]) => name === 'inject')[1].target.tabId, 7);
  f.storage.recording.flows.push({ id: 'click' });
  await assert.rejects(
    start({ name: 'replacement' }, 7),
    /already in progress/
  );
  assert.equal(f.storage.recording.flows.at(-1).id, 'click');
});

test('wait-for-load handles completion, tab closure and timeout without leaking listeners', async () => {
  const f = fixture();
  const { waitForBrowserLabTab: wait } = await f.load(
    '@/newtab/utils/browserLabSession.js'
  );
  f.tabs.get(7).status = 'loading';
  const ready = wait(f.browser, 7);
  f.tabs.get(7).status = 'complete';
  f.browser.tabs.onUpdated.emit(7, { status: 'complete' });
  assert.equal((await ready).url, 'https://site.test/account');
  f.tabs.get(7).status = 'loading';
  const closed = wait(f.browser, 7);
  f.browser.tabs.onRemoved.emit(7);
  await assert.rejects(closed, /closed/);
  await assert.rejects(wait(f.browser, 7, 1), /still loading/);
  assert.equal(
    f.browser.tabs.onUpdated.size + f.browser.tabs.onRemoved.size,
    0
  );
});

test('HTTP import sends the full bounded capture, caps blocks at 200 and retains actual counts across routes', async () => {
  const f = fixture();
  const lab = await f.session();
  const studio = await f.studio();
  lab.state.httpSniffRequests = Array.from({ length: 201 }, (_, index) => ({
    url: `https://site.test/${index}`,
  }));
  let payload;
  f.hooks.fetch = async (url, options) => {
    payload = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          importedCount: 200,
          skippedCount: 0,
          truncated: true,
          workflow: { name: 'HTTP', drawflow: { nodes: [], edges: [] } },
        },
      }),
    };
  };
  await studio.buildWorkflowFromHttpSniff();
  assert.equal(payload.arguments.requests.length, 201);
  assert.equal(payload.arguments.limit, 200);
  assert.deepEqual(f.routes, ['/workflows/saved']);
  const remount = await f.studio();
  assert.equal(remount.httpSniffRequests.value.length, 201);
  assert.equal(
    remount.httpSniffImportStatus.value,
    '200 imported, 0 skipped, truncated at 200'
  );
});

test('empty capture or omitted POST body cannot silently create a lossy workflow', async () => {
  const f = fixture();
  const lab = await f.session();
  const studio = await f.studio();
  await assert.rejects(studio.buildWorkflowFromHttpSniff(), /No HTTP requests/);
  await lab.startHttpSniff('https://site.test');
  f.request('post', 'https://site.test/post', {
    method: 'POST',
    hasPostData: true,
  });
  await assert.rejects(
    studio.buildWorkflowFromHttpSniff(),
    /bodies were not captured/
  );
  assert.deepEqual(f.routes, []);
});

test('page unload releases the debugger; route changes do not register extra unload handlers', async () => {
  const f = fixture();
  const lab = await f.session();
  await lab.startHttpSniff('https://site.test');
  await f.studio();
  await f.studio();
  assert.equal(f.pagehide.size, 1);
  f.pagehide.emit();
  await tick();
  assert.equal(lab.state.httpSniffActive, false);
  assert.equal(f.pagehide.size, 0);
});

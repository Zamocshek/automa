<template>
  <div class="visual-coding-page">
    <header class="vc-header">
      <div>
        <p class="vc-kicker">Automa-native development environment</p>
        <h1>Visual Coding</h1>
        <p class="vc-subtitle">
          Bridge runner, MCP control plane, Python/Node libraries and app builder inside Automa.
        </p>
      </div>
      <div class="vc-header-actions">
        <ui-button @click="safeRun(refreshAll)">Refresh</ui-button>
        <ui-button variant="accent" @click="safeRun(runFullDemo)">Run full demo</ui-button>
      </div>
    </header>

    <section class="vc-status-grid">
      <div class="vc-status-card">
        <span class="vc-dot" :class="bridgeState"></span>
        <div>
          <p>Bridge</p>
          <strong>{{ bridgeLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot" :class="mcpState"></span>
        <div>
          <p>MCP tools</p>
          <strong>{{ mcpLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot" :class="skillState"></span>
        <div>
          <p>Skill</p>
          <strong>{{ skillLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot ok"></span>
        <div>
          <p>Editor</p>
          <strong>Automa dashboard</strong>
        </div>
      </div>
    </section>

    <section class="vc-grid">
      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Bridge Action Runner</h2>
          <span>/run</span>
        </div>
        <div class="vc-form-grid">
          <ui-select
            :model-value="selectedAction"
            label="Action"
            block
            @change="selectAction"
          >
            <option
              v-for="action in actions"
              :key="action"
              :value="action"
            >
              {{ action }}
            </option>
          </ui-select>
          <label>
            Payload JSON
            <ui-textarea
              :model-value="actionPayload"
              spellcheck="false"
              class="vc-code-input"
              @change="actionPayload = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runAction)">Run action</ui-button>
          <ui-button @click="selectAction('echo')">Echo</ui-button>
          <ui-button @click="selectAction('json_get')">JSON get</ui-button>
          <ui-button @click="selectAction('build_app')">Build app payload</ui-button>
          <ui-button @click="selectAction('python_script_exec')">Python library</ui-button>
          <ui-button @click="selectAction('node_script_exec')">Node library</ui-button>
          <ui-button @click="selectAction('telegram_bot_build')">Telegram bot</ui-button>
        </div>
      </article>

      <article class="vc-panel">
        <div class="vc-panel-head">
          <h2>Python Exec</h2>
          <span>process</span>
        </div>
        <label>
          Code
          <ui-textarea
            :model-value="pythonCode"
            spellcheck="false"
            class="vc-code-input"
            @change="pythonCode = $event"
          />
        </label>
        <label>
          Input JSON
          <ui-textarea
            :model-value="pythonInput"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="pythonInput = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(runPython)">Run Python</ui-button>
      </article>

      <article class="vc-panel">
        <div class="vc-panel-head">
          <h2>Parallel Runner</h2>
          <span>thread/process</span>
        </div>
        <div class="vc-inline">
          <ui-select
            :model-value="batchMode"
            label="Mode"
            block
            @change="batchMode = $event"
          >
            <option value="thread">thread</option>
            <option value="process">process</option>
          </ui-select>
          <ui-input
            :model-value="batchWorkers"
            label="Workers"
            type="number"
            @change="batchWorkers = Number($event)"
          />
          <ui-input
            :model-value="batchRepeats"
            label="Repeats"
            type="number"
            @change="batchRepeats = Number($event)"
          />
        </div>
        <label>
          Tasks JSON
          <ui-textarea
            :model-value="batchTasks"
            spellcheck="false"
            class="vc-code-input"
            @change="batchTasks = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(runBatch)">Run batch</ui-button>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Build App</h2>
          <span>inside Automa UI</span>
        </div>
        <ui-input
          :model-value="appName"
          label="App name"
          @change="appName = $event"
        />
        <label>
          Actions JSON
          <ui-textarea
            :model-value="appActions"
            spellcheck="false"
            class="vc-code-input"
            @change="appActions = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(buildApp)">Generate app</ui-button>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Library Runtime Builder</h2>
          <span>pip/npm + Telegram</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-select
              :model-value="libraryRuntime"
              label="Runtime"
              block
              @change="switchLibraryRuntime"
            >
              <option value="python">python</option>
              <option value="node">node</option>
            </ui-select>
            <label>
              Packages JSON
              <ui-textarea
                :model-value="libraryPackages"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="libraryPackages = $event"
              />
            </label>
            <label>
              Input JSON
              <ui-textarea
                :model-value="libraryInput"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="libraryInput = $event"
              />
            </label>
          </div>
          <label>
            Code
            <ui-textarea
              :model-value="libraryCode"
              spellcheck="false"
              class="vc-code-input"
              @change="libraryCode = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runLibraryCode)">Run library code</ui-button>
          <ui-button @click="safeRun(buildTelegramBot)">Build Telegram Bot</ui-button>
          <ui-button @click="safeRun(dryRunTelegramMessage)">Dry-run Telegram message</ui-button>
        </div>
        <div class="vc-inline">
          <ui-select
            :model-value="telegramRuntime"
            label="Bot runtime"
            block
            @change="telegramRuntime = $event"
          >
            <option value="python">python</option>
            <option value="node">node</option>
          </ui-select>
          <ui-input
            :model-value="telegramAppName"
            label="Bot app"
            @change="telegramAppName = $event"
          />
          <ui-input
            :model-value="telegramTokenResource"
            label="Token resource"
            @change="telegramTokenResource = $event"
          />
        </div>
        <label>
          Bot command handlers JSON
          <ui-textarea
            :model-value="telegramHandlersJson"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="telegramHandlersJson = $event"
          />
        </label>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>MCP Control Plane</h2>
          <span>/mcp/call</span>
        </div>
        <div class="vc-form-grid">
          <ui-select
            :model-value="selectedMcpTool"
            label="Tool"
            block
            @change="selectMcpTool"
          >
            <option
              v-for="tool in mcpTools"
              :key="tool.name"
              :value="tool.name"
            >
              {{ tool.name }}
            </option>
          </ui-select>
          <label>
            Arguments JSON
            <ui-textarea
              :model-value="mcpArgs"
              spellcheck="false"
              class="vc-code-input"
              @change="mcpArgs = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runMcpTool)">Call tool</ui-button>
          <ui-button @click="selectMcpTool('bridge.health')">Bridge health</ui-button>
          <ui-button @click="selectMcpTool('skill.status')">Skill status</ui-button>
          <ui-button @click="safeRun(loadPatchTemplate)">AI patch template</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>AI Workflow Composer</h2>
          <span>prompt -> patch</span>
        </div>
        <label>
          Intent
          <ui-textarea
            :model-value="composerPrompt"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="composerPrompt = $event"
          />
        </label>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(composeWorkflow)">
            Compose workflow patch
          </ui-button>
          <ui-button @click="composerPrompt = sampleComposerPrompt">
            BAS-style sample
          </ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Workflow Utility Builder</h2>
          <span>save into Automa</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-input
              :model-value="utilityName"
              label="Workflow name"
              @change="utilityName = $event"
            />
            <ui-input
              :model-value="resourceName"
              label="Resource name"
              @change="resourceName = $event"
            />
            <ui-input
              :model-value="resourceType"
              label="Resource type"
              @change="resourceType = $event"
            />
          </div>
          <div class="vc-stack">
            <label>
              Workflow prompt
              <ui-textarea
                :model-value="utilityPrompt"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="utilityPrompt = $event"
              />
            </label>
            <label>
              HTTP requests JSON
              <ui-textarea
                :model-value="httpRequestsJson"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="httpRequestsJson = $event"
              />
            </label>
            <label>
              Resource value JSON
              <ui-textarea
                :model-value="resourceValue"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="resourceValue = $event"
              />
            </label>
          </div>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(buildUtilityWorkflow)">
            Build importable workflow
          </ui-button>
          <ui-button @click="safeRun(buildHttpWorkflow)">HTTP requests workflow</ui-button>
          <ui-button @click="safeRun(saveResource)">Save resource</ui-button>
          <ui-button @click="safeRun(listResources)">List resources</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Browser Scanner</h2>
          <span>engine + selectors</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-select
              :model-value="browserEngine"
              label="Browser engine"
              block
              @change="browserEngine = $event"
            >
              <option value="chromium">chromium</option>
              <option value="firefox">firefox</option>
              <option value="webkit">webkit</option>
              <option value="camoufox">camoufox</option>
            </ui-select>
            <ui-input
              :model-value="browserUrl"
              label="URL"
              @change="browserUrl = $event"
            />
            <ui-input
              :model-value="browserSelector"
              label="CSS / XPath selector"
              @change="browserSelector = $event"
            />
            <ui-input
              :model-value="selectorHint"
              label="Selector hint"
              @change="selectorHint = $event"
            />
          </div>
          <label>
            Inline HTML
            <ui-textarea
              :model-value="browserHtml"
              spellcheck="false"
              class="vc-code-input"
              @change="browserHtml = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(scanBrowserUrl)">
            Scan URL
          </ui-button>
          <ui-button @click="safeRun(scanBrowserHtml)">Scan HTML</ui-button>
          <ui-button @click="safeRun(queryBrowserSelector)">Query selector</ui-button>
          <ui-button @click="safeRun(suggestBrowserSelectors)">Suggest selectors</ui-button>
          <ui-button @click="safeRun(checkBrowserEngines)">Engine status</ui-button>
        </div>
      </article>
    </section>

    <section class="vc-panel vc-output-panel">
      <div class="vc-panel-head">
        <h2>Output</h2>
        <ui-button @click="output = '{}'">Clear</ui-button>
      </div>
      <pre>{{ output }}</pre>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useWorkflowStore } from '@/stores/workflow';
import { findTriggerBlock } from '@/utils/helper';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';

const BRIDGE_URL = 'http://127.0.0.1:8765';
const workflowStore = useWorkflowStore();

const bridgeLabel = ref('checking');
const bridgeState = ref('muted');
const mcpLabel = ref('checking');
const mcpState = ref('muted');
const skillLabel = ref('checking');
const skillState = ref('muted');
const actions = ref([]);
const mcpTools = ref([]);
const output = ref('{}');

const selectedAction = ref('uppercase');
const actionPayload = ref('{}');
const pythonCode = ref('result = input_data["x"] * 2');
const pythonInput = ref('{"x":21}');
const batchMode = ref('thread');
const batchWorkers = ref(2);
const batchRepeats = ref(2);
const batchTasks = ref(`[
  {"action":"uppercase","payload":{"text":"alpha"}},
  {"action":"json_get","payload":{"data":{"user":{"name":"Automa"}},"path":"user.name"}}
]`);
const appName = ref('visual-coding-automa-demo');
const appActions = ref(`[
  {"action":"echo","payload":{"message":"built from Automa UI"}},
  {"action":"uppercase","payload":{"text":"automa"}}
]`);
const libraryRuntime = ref('python');
const libraryPackages = ref('[]');
const libraryCode = ref('result = {"triple": input_data["x"] * 3}');
const libraryInput = ref('{"x":14}');
const telegramRuntime = ref('python');
const telegramAppName = ref('visual-coding-telegram-bot');
const telegramTokenResource = ref('telegram_bot_token');
const telegramHandlersJson = ref(`[
  {"command":"ping","response":"pong"},
  {"command":"status","response":"Visual Coding bot is alive"}
]`);
const selectedMcpTool = ref('bridge.run_action');
const mcpArgs = ref('{}');
const sampleComposerPrompt = 'Scan a page with Playwright, collect CSS selectors, run an HTTP API request, save a resource, run Python and Node libraries, process tasks in parallel with multiprocessing, build a Telegram bot, then build a small app.';
const composerPrompt = ref(sampleComposerPrompt);
const browserEngine = ref('chromium');
const browserUrl = ref('https://example.com');
const browserSelector = ref('button, a, input');
const selectorHint = ref('run');
const browserHtml = ref('<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>');
const utilityName = ref('visual-coding-full-utility');
const utilityPrompt = ref('Scan page with Playwright selectors, run an HTTP request, save a resource, run Python and Node libraries, build a Telegram bot, process tasks in parallel, then build an app.');
const httpRequestsJson = ref(`[
  {"method":"GET","url":"https://example.com/api","resourceType":"fetch"}
]`);
const resourceName = ref('api_url');
const resourceType = ref('url');
const resourceValue = ref('"https://example.com"');

const examples = {
  echo: { message: 'from Automa Visual Coding' },
  uppercase: { text: 'hello visual coding' },
  string_lowercase: { text: 'HELLO VISUAL CODING' },
  string_trim: { text: '  hello visual coding  ' },
  string_replace: { text: 'hello BAS', old: 'BAS', new: 'Automa' },
  string_split: { text: 'one,two,three', separator: ',' },
  string_join: { items: ['one', 'two', 'three'], separator: ', ' },
  string_regex_match: { text: 'user42 order77', pattern: '\\d+' },
  json_get: { data: { user: { name: 'Automa' } }, path: 'user.name' },
  list_length: { items: ['one', 'two', 'three'] },
  list_append: { items: ['one', 'two'], item: 'three' },
  file_write: { path: 'automa-ui/demo.txt', text: 'created from Automa Visual Coding' },
  file_read: { path: 'automa-ui/demo.txt' },
  file_delete: { path: 'automa-ui/demo.txt' },
  path_join: { parts: ['automa-ui', 'demo.txt'] },
  path_basename: { path: 'automa-ui/demo.txt' },
  path_dirname: { path: 'automa-ui/demo.txt' },
  path_ext: { path: 'automa-ui/demo.txt' },
  path_normalize: { path: 'automa-ui/../automa-ui/demo.txt' },
  path_is_absolute: { path: 'automa-ui/demo.txt' },
  http_request: { method: 'GET', url: 'https://example.com', maxChars: 4000 },
  wait_sleep: { seconds: 1 },
  python_install_packages: { packages: ['requests'], timeout: 180 },
  python_script_exec: {
    packages: [],
    code: 'import math\nresult = {"sqrt": math.sqrt(input_data["x"])}',
    input: { x: 81 },
    timeout: 10,
  },
  node_install_packages: { packages: ['axios'], timeout: 180 },
  node_script_exec: {
    packages: [],
    code: 'result = { triple: inputData.x * 3 };',
    input: { x: 14 },
    timeout: 10,
  },
  node_app_build: {
    name: 'visual-coding-node-demo',
    packages: [],
    code: "console.log(JSON.stringify({ ok: true, app: 'visual-coding-node-demo' }));",
  },
  telegram_send_message: {
    tokenResource: 'telegram_bot_token',
    chatId: '123456',
    text: 'Hello from Automa Visual Coding',
    dryRun: true,
  },
  telegram_bot_build: {
    runtime: 'python',
    name: 'visual-coding-telegram-bot',
    tokenResource: 'telegram_bot_token',
    startText: 'Hello from Visual Coding bot',
    commandHandlers: [{ command: 'ping', response: 'pong' }],
  },
  python_exec: { code: 'result = input_data["x"] * 2', input: { x: 21 }, timeout: 5 },
  browser_engine_status: { browserEngine: 'chromium' },
  browser_scan_page: {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    maxElements: 40,
  },
  browser_query_selector: {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    selector: 'button#run',
    limit: 10,
  },
  browser_suggest_selectors: {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    hint: 'run',
    maxElements: 40,
  },
  resource_set: { name: 'api_url', type: 'url', value: 'https://example.com' },
  resource_get: { name: 'api_url' },
  resource_list: {},
  resource_delete: { name: 'api_url' },
  workflow_build_from_prompt: {
    name: 'visual-coding-full-utility',
    prompt: 'Scan page with Playwright selectors, run Python, process tasks in parallel, then build an app.',
  },
  workflow_from_http_requests: {
    name: 'captured-http-utility',
    requests: [{ method: 'GET', url: 'https://example.com/api', resourceType: 'fetch' }],
  },
  batch: {
    mode: 'thread',
    workers: 2,
    repeats: 2,
    tasks: [
      { action: 'uppercase', payload: { text: 'alpha' } },
      { action: 'json_get', payload: { data: { user: { name: 'Automa' } }, path: 'user.name' } },
    ],
  },
  build_app: {
    name: 'visual-coding-automa-demo',
    actions: [
      { action: 'echo', payload: { message: 'built from Automa UI' } },
      { action: 'uppercase', payload: { text: 'automa' } },
    ],
  },
};

const mcpExamples = {
  'bridge.health': {},
  'bridge.actions': {},
  'bridge.run_action': { action: 'uppercase', payload: { text: 'mcp call from Automa' } },
  'project.status': {},
  'project.read_file': { path: 'memory.md' },
  'skill.status': {},
  'workflow.patch_template': { kind: 'python_bridge' },
  'workflow.compose_from_prompt': { prompt: sampleComposerPrompt },
  'browser.engine_status': { browserEngine: 'chromium' },
  'browser.scan_page': {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    maxElements: 40,
  },
  'browser.query_selector': {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    selector: 'button#run',
    limit: 10,
  },
  'browser.suggest_selectors': {
    browserEngine: 'chromium',
    html: '<main><h1>Visual Coding Demo</h1><button id="run">Run</button><input name="email" placeholder="Email"></main>',
    hint: 'run',
    maxElements: 40,
  },
  'http.request': { method: 'GET', url: 'https://example.com', maxChars: 4000 },
  'workflow.build_from_prompt': {
    name: 'visual-coding-full-utility',
    prompt: 'Scan page with Playwright selectors, save resources, run Python, process tasks in parallel, then build an app.',
  },
  'workflow.from_http_requests': {
    name: 'captured-http-utility',
    requests: [{ method: 'GET', url: 'https://example.com/api', resourceType: 'fetch' }],
  },
  'resources.set': { name: 'api_url', type: 'url', value: 'https://example.com' },
  'resources.get': { name: 'api_url' },
  'resources.list': {},
  'python.install_packages': { packages: ['requests'], timeout: 180 },
  'python.run_script': {
    packages: [],
    code: 'import math\nresult = {"sqrt": math.sqrt(input_data["x"])}',
    input: { x: 81 },
    timeout: 10,
  },
  'node.install_packages': { packages: ['axios'], timeout: 180 },
  'node.run_script': {
    packages: [],
    code: 'result = { triple: inputData.x * 3 };',
    input: { x: 14 },
    timeout: 10,
  },
  'node.build_app': {
    name: 'visual-coding-node-demo',
    packages: [],
    code: "console.log(JSON.stringify({ ok: true, app: 'visual-coding-node-demo' }));",
  },
  'telegram.send_message': {
    tokenResource: 'telegram_bot_token',
    chatId: '123456',
    text: 'Hello from Automa Visual Coding',
    dryRun: true,
  },
  'telegram.build_bot': {
    runtime: 'python',
    name: 'visual-coding-telegram-bot',
    tokenResource: 'telegram_bot_token',
    startText: 'Hello from Visual Coding bot',
    commandHandlers: [{ command: 'ping', response: 'pong' }],
  },
  'demo.run': {},
};

const hasBridge = computed(() => bridgeState.value === 'ok');

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value) {
  return JSON.parse(value || '{}');
}

function print(title, data) {
  output.value = `${title}\n${pretty(data)}`;
}

async function getJson(path) {
  const response = await fetch(`${BRIDGE_URL}${path}`);
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || response.statusText);
  return data;
}

async function postJson(path, body) {
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || response.statusText);
    error.data = data;
    throw error;
  }
  return data;
}

async function callMcp(tool, args = {}) {
  return postJson('/mcp/call', { tool, arguments: args });
}

function selectAction(action) {
  selectedAction.value = action;
  actionPayload.value = pretty(examples[action] || {});
}

function selectMcpTool(tool) {
  selectedMcpTool.value = tool;
  mcpArgs.value = pretty(mcpExamples[tool] || {});
}

async function refreshBridge() {
  try {
    const health = await getJson('/health');
    bridgeLabel.value = `${health.service} ${health.version}`;
    bridgeState.value = 'ok';
    const actionData = await getJson('/actions');
    actions.value = actionData.actions;
    if (!actions.value.includes(selectedAction.value)) selectAction(actions.value[0] || 'echo');
  } catch (error) {
    bridgeLabel.value = error.message;
    bridgeState.value = 'bad';
  }
}

async function refreshMcp() {
  try {
    const data = await getJson('/mcp/tools');
    mcpTools.value = data.tools;
    mcpLabel.value = `${data.tools.length} tools`;
    mcpState.value = 'ok';
  } catch (error) {
    mcpLabel.value = error.message;
    mcpState.value = 'bad';
  }
}

async function refreshSkill() {
  try {
    const data = await callMcp('skill.status');
    skillLabel.value = data.installed ? 'installed' : 'packaged only';
    skillState.value = data.ok ? 'ok' : 'bad';
  } catch (error) {
    skillLabel.value = error.message;
    skillState.value = 'bad';
  }
}

async function refreshAll() {
  await refreshBridge();
  await refreshMcp();
  await refreshSkill();
}

async function runAction() {
  const data = await postJson('/run', {
    action: selectedAction.value,
    payload: parseJson(actionPayload.value),
  });
  print(`Action: ${selectedAction.value}`, data);
}

async function runPython() {
  const data = await postJson('/run', {
    action: 'python_exec',
    payload: {
      code: pythonCode.value,
      input: parseJson(pythonInput.value),
      timeout: 5,
    },
  });
  print('Python Exec', data);
}

async function runBatch() {
  const data = await postJson('/run', {
    action: 'batch',
    payload: {
      mode: batchMode.value,
      workers: Number(batchWorkers.value),
      repeats: Number(batchRepeats.value),
      tasks: JSON.parse(batchTasks.value),
    },
  });
  print(`Batch: ${batchMode.value}`, data);
}

async function buildApp() {
  const data = await postJson('/run', {
    action: 'build_app',
    payload: {
      name: appName.value,
      actions: JSON.parse(appActions.value),
    },
  });
  print('Build App', data);
}

function switchLibraryRuntime(runtime) {
  libraryRuntime.value = runtime;
  if (runtime === 'node') {
    libraryCode.value = 'result = { triple: inputData.x * 3 };';
    libraryInput.value = '{"x":14}';
  } else {
    libraryCode.value = 'result = {"triple": input_data["x"] * 3}';
    libraryInput.value = '{"x":14}';
  }
}

async function runLibraryCode() {
  const tool = libraryRuntime.value === 'node' ? 'node.run_script' : 'python.run_script';
  const data = await callMcp(tool, {
    packages: JSON.parse(libraryPackages.value || '[]'),
    code: libraryCode.value,
    input: parseJson(libraryInput.value),
    timeout: 30,
    installTimeout: 180,
  });
  print(`Library Runtime: ${libraryRuntime.value}`, data);
}

async function buildTelegramBot() {
  const data = await callMcp('telegram.build_bot', {
    runtime: telegramRuntime.value,
    name: telegramAppName.value,
    tokenResource: telegramTokenResource.value,
    startText: 'Hello from Visual Coding bot',
    commandHandlers: JSON.parse(telegramHandlersJson.value || '[]'),
  });
  print('Telegram Bot Builder', data);
}

async function dryRunTelegramMessage() {
  const data = await callMcp('telegram.send_message', {
    tokenResource: telegramTokenResource.value,
    chatId: '123456',
    text: 'Hello from Automa Visual Coding',
    dryRun: true,
  });
  print('Telegram Message Dry Run', data);
}

async function runMcpTool() {
  const data = await callMcp(selectedMcpTool.value, parseJson(mcpArgs.value));
  print(`MCP Tool: ${selectedMcpTool.value}`, data);
}

async function loadPatchTemplate() {
  selectMcpTool('workflow.patch_template');
  await runMcpTool();
}

async function composeWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', { prompt: composerPrompt.value });
  print('AI Workflow Composer', data);
}

function browserPayload(useHtml = false) {
  const html = browserHtml.value.trim();
  const base = {
    browserEngine: browserEngine.value,
    headless: true,
    maxElements: 80,
  };
  if (useHtml || !browserUrl.value.trim()) {
    return { ...base, html };
  }

  return { ...base, url: browserUrl.value.trim(), captureNetwork: true };
}

async function scanBrowserUrl() {
  const data = await callMcp('browser.scan_page', browserPayload(false));
  print('Browser Scan URL', data);
}

async function scanBrowserHtml() {
  const data = await callMcp('browser.scan_page', browserPayload(true));
  print('Browser Scan HTML', data);
}

async function queryBrowserSelector() {
  const payload = {
    ...browserPayload(Boolean(browserHtml.value.trim())),
    selector: browserSelector.value,
    limit: 40,
  };
  const data = await callMcp('browser.query_selector', payload);
  print('Browser Query Selector', data);
}

async function suggestBrowserSelectors() {
  const payload = {
    ...browserPayload(Boolean(browserHtml.value.trim())),
    hint: selectorHint.value,
    maxElements: 80,
  };
  const data = await callMcp('browser.suggest_selectors', payload);
  print('Browser Selector Suggestions', data);
}

async function checkBrowserEngines() {
  const data = await callMcp('browser.engine_status', { browserEngine: browserEngine.value });
  print('Browser Engine Status', data);
}

async function saveWorkflowToAutoma(workflow) {
  if (!workflowStore.retrieved) await workflowStore.loadData();
  const inserted = await workflowStore.insert({
    ...workflow,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  Object.entries(inserted).forEach(([id, item]) => {
    const triggerBlock = findTriggerBlock(item.drawflow);
    if (triggerBlock) registerWorkflowTrigger(id, triggerBlock);
  });

  return inserted;
}

async function buildUtilityWorkflow() {
  const data = await callMcp('workflow.build_from_prompt', {
    name: utilityName.value,
    prompt: utilityPrompt.value,
  });
  const inserted = await saveWorkflowToAutoma(data.result.workflow);
  print('Saved Automa Workflow', { ...data, insertedWorkflowIds: Object.keys(inserted) });
}

async function buildHttpWorkflow() {
  const data = await callMcp('workflow.from_http_requests', {
    name: `${utilityName.value}-http`,
    requests: JSON.parse(httpRequestsJson.value),
  });
  const inserted = await saveWorkflowToAutoma(data.result.workflow);
  print('Saved HTTP Workflow', { ...data, insertedWorkflowIds: Object.keys(inserted) });
}

async function saveResource() {
  const data = await callMcp('resources.set', {
    name: resourceName.value,
    type: resourceType.value,
    value: JSON.parse(resourceValue.value),
  });
  print('Resource Saved', data);
}

async function listResources() {
  const data = await callMcp('resources.list');
  print('Resources', data);
}

async function runFullDemo() {
  const data = await callMcp('demo.run');
  print('Full Automa Visual Coding Demo', data);
}

async function safeRun(task) {
  try {
    await task();
  } catch (error) {
    print('Error', error.data || { ok: false, error: error.message });
  }
}

onMounted(async () => {
  selectAction(selectedAction.value);
  selectMcpTool(selectedMcpTool.value);
  await safeRun(refreshAll);
  if (hasBridge.value) await safeRun(runFullDemo);
});
</script>

<style scoped>
.visual-coding-page {
  @apply min-h-screen bg-gray-50 p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100;
}

.vc-header {
  @apply mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-gray-700 lg:flex-row lg:items-end lg:justify-between;
}

.vc-kicker {
  @apply mb-1 text-sm font-semibold uppercase tracking-wide text-accent;
}

.vc-header h1 {
  @apply text-3xl font-semibold tracking-normal;
}

.vc-subtitle {
  @apply mt-2 text-gray-600 dark:text-gray-300;
}

.vc-header-actions,
.vc-actions,
.vc-inline {
  @apply flex flex-wrap items-center gap-3;
}

.vc-status-grid {
  @apply mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4;
}

.vc-status-card,
.vc-panel {
  @apply rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800;
}

.vc-status-card {
  @apply flex items-center gap-3 p-4;
}

.vc-status-card p {
  @apply text-sm text-gray-500 dark:text-gray-300;
}

.vc-status-card strong {
  @apply break-words text-sm font-semibold;
}

.vc-dot {
  @apply h-3 w-3 shrink-0 rounded-full bg-yellow-500;
}

.vc-dot.ok {
  @apply bg-green-500;
}

.vc-dot.bad {
  @apply bg-red-500;
}

.vc-dot.muted {
  @apply bg-gray-400;
}

.vc-grid {
  @apply grid grid-cols-1 gap-4 xl:grid-cols-2;
}

.vc-panel {
  @apply grid gap-4 p-4;
}

.vc-span-2 {
  @apply xl:col-span-2;
}

.vc-panel-head {
  @apply flex items-center justify-between gap-3;
}

.vc-panel-head h2 {
  @apply text-base font-semibold tracking-normal;
}

.vc-panel-head span {
  @apply rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200;
}

.vc-form-grid {
  @apply grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)];
}

.vc-stack {
  @apply grid content-start gap-3;
}

label {
  @apply grid gap-2 text-sm text-gray-600 dark:text-gray-300;
}

.vc-code-input {
  min-height: 140px;
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.45;
}

.vc-small-code {
  min-height: 84px;
}

.vc-output-panel {
  @apply mt-4;
}

pre {
  @apply max-h-[520px] min-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-950 p-4 text-sm text-green-50;
  font-family: Consolas, "Cascadia Code", monospace;
}
</style>

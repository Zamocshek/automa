import objectPath from 'object-path';
import renderString from '@/workflowEngine/templating/renderString';

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765/run';

function stringifyTemplateValue(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function readTemplatePath(source, path) {
  if (!source || !path) return { found: false, value: undefined };
  if (Array.isArray(source)) {
    const item = source.find((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      return entry.name === path || entry.id === path || entry.key === path;
    });
    if (item) {
      return {
        found: true,
        value: Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : item,
      };
    }
  }
  if (typeof source !== 'object') return { found: false, value: undefined };
  if (Object.prototype.hasOwnProperty.call(source, path)) {
    return { found: true, value: source[path] };
  }
  try {
    if (objectPath.has(source, path)) {
      return { found: true, value: objectPath.get(source, path) };
    }
  } catch (_error) {
    return { found: false, value: undefined };
  }
  return { found: false, value: undefined };
}

function lookupTemplateValue(refData, rawName) {
  const name = String(rawName || '').trim();
  if (!name) return { found: false, value: undefined };

  const directSources = [
    refData,
    refData?.variables,
    refData?.globalData,
    refData?.loopData,
    refData?.table,
    refData?.prevBlockData,
    refData?.data,
    refData?.workflow,
  ];

  for (const source of directSources) {
    const direct = readTemplatePath(source, name);
    if (direct.found) return direct;
    const dollarName = readTemplatePath(source, `$$${name}`);
    if (dollarName.found) return dollarName;
  }

  const prefixed = [
    `variables.${name}`,
    `globalData.${name}`,
    `loopData.${name}`,
    `table.${name}`,
    `data.${name}`,
  ];
  for (const path of prefixed) {
    const found = readTemplatePath(refData, path);
    if (found.found) return found;
  }

  return { found: false, value: undefined };
}

function renderLegacyTemplate(value, refData) {
  return String(value ?? '').replace(/\[\[\s*([A-Za-z0-9_$:.-]+)\s*\]\]/g, (match, name) => {
    const result = lookupTemplateValue(refData, name);
    return result.found ? stringifyTemplateValue(result.value) : match;
  });
}

function namedMap(value) {
  if (!value) return {};
  if (!Array.isArray(value)) return value;
  return value.reduce((acc, item) => {
    if (item && typeof item === 'object' && item.name) {
      acc[item.name] = Object.prototype.hasOwnProperty.call(item, 'value') ? item.value : item;
    }
    return acc;
  }, {});
}

function legacyTemplateVariables(refData) {
  return {
    variables: namedMap(refData?.variables),
    globalData: refData?.globalData || {},
    loopData: refData?.loopData || {},
    table: refData?.table || {},
    previous: refData?.prevBlockData || refData?.data || {},
  };
}

async function render(value, refData, isPopup) {
  const rendered = (await renderString(String(value ?? ''), refData, isPopup)).value;
  return renderLegacyTemplate(rendered, refData);
}

function parseJsonObject(value, label) {
  const parsed = JSON.parse(value || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return parsed;
}

function parseJsonArray(value, label) {
  const parsed = JSON.parse(value || '[]');
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array`);
  }
  return parsed;
}

function parseJsonObjectOr(value, fallback) {
  try {
    return parseJsonObject(value, 'json');
  } catch (_error) {
    return fallback;
  }
}

function parseJsonArrayOr(value, fallback) {
  try {
    return parseJsonArray(value, 'json');
  } catch (_error) {
    return fallback;
  }
}

function parseJsonValue(value, label) {
  try {
    return JSON.parse(value || 'null');
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
}

async function callBridge(data, refData, isPopup, body) {
  const bridgeUrl = await render(data.bridgeUrl || DEFAULT_BRIDGE_URL, refData, isPopup);
  const timeout = Number(data.timeout || 30000);
  const controller = timeout > 0 ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeout)
    : null;

  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
    const responseData = await response.json();
    if (!response.ok || responseData.ok === false) {
      const error = new Error(responseData.error || response.statusText);
      error.responseData = responseData;
      throw error;
    }
    return responseData;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function callChromeApi(fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      let settled = false;
      const callback = (result) => {
        if (settled) return;
        settled = true;
        const error = globalThis.chrome?.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      };
      const maybePromise = fn(...args, callback);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(
          (result) => {
            if (!settled) {
              settled = true;
              resolve(result);
            }
          },
          (error) => {
            if (!settled) {
              settled = true;
              reject(error);
            }
          }
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function activeTabId(worker) {
  if (worker.activeTab?.id) return worker.activeTab.id;
  if (!globalThis.chrome?.tabs?.query) return null;
  const tabs = await callChromeApi(
    globalThis.chrome.tabs.query.bind(globalThis.chrome.tabs),
    { active: true, currentWindow: true }
  );
  return Array.isArray(tabs) && tabs[0]?.id ? tabs[0].id : null;
}

async function executeInActiveTab(worker, func, args = []) {
  const tabId = await activeTabId(worker);
  if (!tabId || !globalThis.chrome?.scripting?.executeScript) {
    return { ok: false, error: 'active tab or scripting API is not available' };
  }
  const target = { tabId };
  if (Number.isInteger(worker.activeTab?.frameId) && worker.activeTab.frameId >= 0) {
    target.frameIds = [worker.activeTab.frameId];
  }
  const results = await callChromeApi(
    globalThis.chrome.scripting.executeScript.bind(globalThis.chrome.scripting),
    { target, func, args }
  );
  return { ok: true, tabId, result: Array.isArray(results) ? results[0]?.result : results };
}

async function focusActiveTab(worker) {
  const tabId = await activeTabId(worker);
  if (!tabId || !globalThis.chrome?.tabs?.update) return { ok: false, error: 'active tab is not available' };
  const tab = await callChromeApi(globalThis.chrome.tabs.update.bind(globalThis.chrome.tabs), tabId, { active: true });
  if (tab?.windowId && globalThis.chrome?.windows?.update) {
    await callChromeApi(globalThis.chrome.windows.update.bind(globalThis.chrome.windows), tab.windowId, { focused: true });
  }
  return { ok: true, tabId, url: tab?.url || '' };
}

async function finishBlock(worker, id, data, responseData, fallbackOutput) {
  const nextBlockId = worker.getBlockConnections(id);
  const returnData = data.returnPath
    ? objectPath.get(responseData, data.returnPath, responseData)
    : responseData;

  if (data.assignVariable && data.variableName) {
    await worker.setVariable(data.variableName, returnData);
  }
  if (data.saveData) {
    worker.addDataToColumn(data.dataColumn, returnData);
  }

  return {
    data: returnData,
    nextBlockId,
    ctxData: { response: responseData, fallbackOutput },
  };
}

function fallbackOrThrow(worker, id, error) {
  const fallbackOutput = worker.getBlockConnections(id, 'fallback');
  if (fallbackOutput && fallbackOutput.length > 0) {
    return {
      data: error.responseData || { ok: false, error: error.message },
      nextBlockId: fallbackOutput,
      status: 'error',
      ctxData: { error: error.responseData || error.message },
    };
  }
  throw error;
}

export async function pythonBridge({ id, data }, { refData }) {
  try {
    const action = await render(data.action || 'echo', refData, this.engine.isPopup);
    const payloadText = await render(data.payload || '{}', refData, this.engine.isPopup);
    const payload = parseJsonObject(payloadText, 'payload');
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function parallelRunner({ id, data }, { refData }) {
  try {
    const tasksText = await render(data.tasksJson || '[]', refData, this.engine.isPopup);
    const tasks = parseJsonArray(tasksText, 'tasksJson');
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'batch',
      payload: {
        mode: data.mode || 'thread',
        workers: Number(data.workers || 1),
        repeats: Number(data.repeats || 1),
        tasks,
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function buildApp({ id, data }, { refData }) {
  try {
    const appName = await render(data.appName || 'silverback-coding-demo', refData, this.engine.isPopup);
    const actionsText = await render(data.actionsJson || '[]', refData, this.engine.isPopup);
    const actions = parseJsonArray(actionsText, 'actionsJson');
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'build_app',
      payload: { name: appName, actions },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function projectTemplateBuilder({ id, data }, { refData }) {
  try {
    const projectName = await render(
      data.projectName || 'private-vpn-lab-generated',
      refData,
      this.engine.isPopup
    );
    const brandName = await render(data.brandName || 'GOY VPN', refData, this.engine.isPopup);
    const botUsername = await render(data.botUsername || 'goy_vpn_robot', refData, this.engine.isPopup);
    const supportUsername = await render(data.supportUsername || '@support', refData, this.engine.isPopup);
    const domain = await render(data.domain || 'vpn.example.com', refData, this.engine.isPopup);
    const routePrefix = await render(data.subscriptionRoutePrefix || 'sub', refData, this.engine.isPopup);
    const template = data.template || 'private-vpn-lab';
    const isBotService = template === 'bot-service';
    const runMode = await render(data.runMode || 'polling', refData, this.engine.isPopup);
    const deploymentProfile = await render(
      data.deploymentProfile || 'startup',
      refData,
      this.engine.isPopup
    );
    const genericEventPath = await render(data.genericEventPath || '/events', refData, this.engine.isPopup);
    const startupEventPath = await render(data.startupEventPath || '/startup', refData, this.engine.isPopup);
    const action = isBotService
      ? data.mode === 'verify'
        ? 'bot_service_verify'
        : 'bot_service_build'
      : data.mode === 'verify'
        ? 'private_vpn_project_verify'
        : 'private_vpn_project_build';
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload: {
        name: projectName,
        template,
        brandName,
        botUsername,
        supportUsername,
        domain,
        publicDomain: domain,
        subscriptionRoutePrefix: routePrefix,
        deviceLimit: Number(data.deviceLimit || 10),
        runMode,
        deploymentProfile,
        httpPort: Number(data.httpPort || 8082),
        genericEventPath,
        startupEventPath,
        includeNginx: data.includeNginx !== false,
        overwrite: data.overwrite !== false,
        verify: true,
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function browserScanner({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'scan';
    const source = data.source || 'html';
    const browserEngine = await render(
      data.browserEngine || 'chromium',
      refData,
      this.engine.isPopup
    );
    const profileName = await render(
      data.profileName || '',
      refData,
      this.engine.isPopup
    );
    const payload = {
      browserEngine,
      autoCreateProfile: data.autoCreateProfile !== false,
      headless: data.headless !== false,
      maxElements: Number(data.maxElements || 80),
      captureNetwork: Boolean(data.captureNetwork),
    };
    if (profileName) payload.profileName = profileName;

    if (source === 'url') {
      payload.url = await render(data.url || '', refData, this.engine.isPopup);
    } else {
      payload.html = await render(data.html || '', refData, this.engine.isPopup);
    }

    let action = 'browser_scan_page';
    if (mode === 'query') {
      action = 'browser_query_selector';
      payload.selector = await render(data.selector || '', refData, this.engine.isPopup);
    } else if (mode === 'suggest') {
      action = 'browser_suggest_selectors';
      payload.hint = await render(data.hint || '', refData, this.engine.isPopup);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function resourceStore({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'get';
    const resourceName = await render(data.resourceName || '', refData, this.engine.isPopup);
    let action = 'resource_get';
    const payload = { name: resourceName };

    if (mode === 'set') {
      action = 'resource_set';
      payload.type = data.resourceType || 'string';
      payload.description = await render(data.resourceDescription || '', refData, this.engine.isPopup);
      const valueText = await render(data.resourceValue || 'null', refData, this.engine.isPopup);
      payload.value = JSON.parse(valueText);
    } else if (mode === 'list') {
      action = 'resource_list';
      delete payload.name;
    } else if (mode === 'delete') {
      action = 'resource_delete';
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function resourceDesignBuilder({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'schemaBuild';
    const schemaName = await render(data.schemaName || 'startup-intake-fields', refData, this.engine.isPopup);
    const schemaTitle = await render(data.schemaTitle || schemaName, refData, this.engine.isPopup);
    const appName = await render(data.appName || 'silverback-designed-app', refData, this.engine.isPopup);
    const appTitle = await render(data.appTitle || appName, refData, this.engine.isPopup);
    const planName = await render(data.planName || 'silverback-parallel-plan', refData, this.engine.isPopup);
    const projectPath = await render(data.projectPath || '', refData, this.engine.isPopup);

    const actions = {
      schemaBuild: 'resource_schema_build',
      schemaGet: 'resource_schema_get',
      schemaList: 'resource_schema_list',
      schemaValidate: 'resource_schema_validate',
      parallelPlanBuild: 'parallel_plan_build',
      parallelPlanRun: 'parallel_plan_run',
      parallelPlanList: 'parallel_plan_list',
      designAppBuild: 'design_app_build',
      designAppVerify: 'design_app_verify',
      runtimeFormBuild: 'runtime_form_build',
      runtimeFormVerify: 'runtime_form_verify',
    };
    const action = actions[mode] || 'resource_schema_build';
    let payload = {};

    if (mode === 'schemaBuild') {
      const fields = parseJsonArray(await render(data.fieldsJson || '[]', refData, this.engine.isPopup), 'fieldsJson');
      const tokens = parseJsonObject(await render(data.tokensJson || '{}', refData, this.engine.isPopup), 'tokensJson');
      payload = {
        name: schemaName,
        title: schemaTitle,
        fields,
        tokens,
        layout: 'two-column',
      };
    } else if (mode === 'schemaGet') {
      payload = { name: schemaName, path: projectPath };
    } else if (mode === 'schemaValidate') {
      const values = parseJsonObject(await render(data.valuesJson || '{}', refData, this.engine.isPopup), 'valuesJson');
      payload = { name: schemaName, values };
    } else if (mode === 'parallelPlanBuild') {
      const tasks = parseJsonArray(await render(data.tasksJson || '[]', refData, this.engine.isPopup), 'tasksJson');
      payload = {
        name: planName,
        mode: data.planMode || 'thread',
        workers: Number(data.workers || 4),
        repeats: Number(data.repeats || 1),
        tasks,
        resourceSchema: schemaName,
      };
    } else if (mode === 'parallelPlanRun') {
      const tasks = parseJsonArray(await render(data.tasksJson || '[]', refData, this.engine.isPopup), 'tasksJson');
      payload = {
        name: planName,
        mode: data.planMode || 'thread',
        workers: Number(data.workers || 4),
        repeats: Number(data.repeats || 1),
        saveResult: data.saveResult !== false,
      };
      if (tasks.length) payload.tasks = tasks;
    } else if (mode === 'designAppBuild') {
      const fields = parseJsonArray(await render(data.fieldsJson || '[]', refData, this.engine.isPopup), 'fieldsJson');
      const tokens = parseJsonObject(await render(data.tokensJson || '{}', refData, this.engine.isPopup), 'tokensJson');
      payload = {
        name: appName,
        title: appTitle,
        schemaName,
        resourceSchemaName: schemaName,
        fields,
        tokens,
        overwrite: data.overwrite !== false,
        verify: data.verify !== false,
      };
    } else if (mode === 'designAppVerify') {
      payload = { name: appName, path: projectPath };
    } else if (mode === 'runtimeFormBuild') {
      const fields = parseJsonArray(await render(data.fieldsJson || '[]', refData, this.engine.isPopup), 'fieldsJson');
      const tokens = parseJsonObject(await render(data.tokensJson || '{}', refData, this.engine.isPopup), 'tokensJson');
      const env = parseJsonObject(await render(data.envJson || '{}', refData, this.engine.isPopup), 'envJson');
      const envMapping = parseJsonObject(await render(data.envMappingJson || '{}', refData, this.engine.isPopup), 'envMappingJson');
      const input = parseJsonValue(await render(data.inputJson || '{}', refData, this.engine.isPopup), 'inputJson');
      const packages = parseJsonArray(await render(data.packagesJson || '[]', refData, this.engine.isPopup), 'packagesJson');
      const androidDevices = parseJsonArray(await render(data.androidDevicesJson || '[]', refData, this.engine.isPopup), 'androidDevicesJson');
      const androidTasks = parseJsonArray(await render(data.androidTasksJson || '[]', refData, this.engine.isPopup), 'androidTasksJson');
      payload = {
        name: appName,
        title: appTitle,
        schemaName,
        resourceSchemaName: schemaName,
        fields,
        tokens,
        runtime: data.runtime || 'system',
        shell: data.shell || 'powershell',
        command: await render(data.command || '', refData, this.engine.isPopup),
        cwd: await render(data.cwd || '.', refData, this.engine.isPopup),
        code: await render(data.code || 'result = {"ok": True, "input": input_data}', refData, this.engine.isPopup),
        input,
        packages,
        env,
        envMapping,
        workers: Number(data.workers || 4),
        repeats: Number(data.repeats || 1),
        batchMode: data.planMode || 'thread',
        dryRun: Boolean(data.dryRun),
        androidDevices,
        androidTasks,
        overwrite: data.overwrite !== false,
        verify: data.verify !== false,
      };
    } else if (mode === 'runtimeFormVerify') {
      payload = { name: appName, path: projectPath };
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function jsonTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'get';
    const modeToAction = {
      create: 'json_create',
      get: 'json_get',
      keys: 'json_keys',
      values: 'json_values',
      count: 'json_count',
      set: 'json_set',
      delete: 'json_delete',
      parse: 'json_parse',
      stringify: 'json_stringify',
      valid: 'json_is_valid',
    };
    const action = modeToAction[mode] || 'json_get';
    const payload = {};

    if (['parse', 'valid'].includes(mode)) {
      payload.text = await render(data.text || '', refData, this.engine.isPopup);
    } else {
      const dataJson = await render(data.dataJson || '{}', refData, this.engine.isPopup);
      payload.data = parseJsonValue(dataJson, 'dataJson');
      payload.path = await render(data.path || '', refData, this.engine.isPopup);
    }

    if (mode === 'set') {
      const valueJson = await render(data.valueJson || 'null', refData, this.engine.isPopup);
      payload.value = parseJsonValue(valueJson, 'valueJson');
    } else if (mode === 'stringify') {
      payload.indent = Number(data.indent || 2);
    } else if (mode === 'create') {
      payload.shape = data.shape || 'object';
      payload.items = Array.isArray(payload.data) ? payload.data : [];
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function listTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'length';
    const modeToAction = {
      create: 'list_create',
      length: 'list_length',
      append: 'list_append',
      get: 'list_get',
      first: 'list_first',
      last: 'list_last',
      random: 'list_random',
      insert: 'list_insert',
      set: 'list_set',
      remove: 'list_remove',
      contains: 'list_contains',
      slice: 'list_slice',
      removeRange: 'list_remove_range',
      join: 'list_join',
      parse: 'list_parse',
      index: 'list_index',
      copy: 'list_copy',
      sort: 'list_sort',
      dedupe: 'list_dedupe',
      shuffle: 'list_shuffle',
      merge: 'list_merge',
      compare: 'list_compare',
      filterContains: 'list_filter_contains',
    };
    const action = modeToAction[mode] || 'list_length';
    const payload = {};

    const itemsText = await render(data.itemsJson || '[]', refData, this.engine.isPopup);
    payload.items = parseJsonArray(itemsText, 'itemsJson');

    if (['append', 'insert', 'set', 'remove', 'contains', 'index'].includes(mode)) {
      const itemText = await render(data.itemJson || 'null', refData, this.engine.isPopup);
      payload.item = parseJsonValue(itemText, 'itemJson');
    }
    if (['get', 'insert', 'set', 'remove'].includes(mode)) payload.index = Number(data.index || 0);
    if (['slice', 'removeRange'].includes(mode)) {
      payload.start = Number(data.start || 0);
      if (mode === 'slice' && data.end !== '') payload.end = Number(data.end);
      if (mode === 'removeRange') payload.count = Number(data.count || 1);
    }
    if (['join', 'parse'].includes(mode)) {
      payload.separator = await render(data.separator || ',', refData, this.engine.isPopup);
    }
    if (mode === 'parse') {
      payload.text = await render(data.text || '', refData, this.engine.isPopup);
    }
    if (mode === 'sort') {
      payload.key = await render(data.key || '', refData, this.engine.isPopup);
      payload.reverse = Boolean(data.reverse);
    }
    if (mode === 'merge') {
      payload.lists = parseJsonArray(await render(data.listsJson || '[]', refData, this.engine.isPopup), 'listsJson');
    }
    if (mode === 'compare') {
      payload.right = parseJsonArray(await render(data.rightJson || '[]', refData, this.engine.isPopup), 'rightJson');
      payload.mode = data.compareMode || 'equals';
    }
    if (mode === 'filterContains') {
      payload.text = await render(data.text || '', refData, this.engine.isPopup);
      payload.key = await render(data.key || '', refData, this.engine.isPopup);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function logicTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'compare';
    const modeToAction = {
      compare: 'logic_compare',
      truthy: 'logic_truthy',
      boolean: 'logic_boolean',
      choose: 'logic_choose',
    };
    const action = modeToAction[mode] || 'logic_compare';
    const leftJson = await render(data.leftJson || 'null', refData, this.engine.isPopup);
    const payload = {
      left: parseJsonValue(leftJson, 'leftJson'),
      operator: data.operator || 'eq',
    };

    if (mode === 'truthy') {
      payload.value = payload.left;
      delete payload.left;
      delete payload.operator;
    } else if (mode === 'boolean') {
      payload.operator = ['and', 'or', 'not'].includes(data.operator) ? data.operator : 'and';
      payload.values = parseJsonArray(await render(data.valuesJson || '[]', refData, this.engine.isPopup), 'valuesJson');
    } else {
      payload.right = parseJsonValue(await render(data.rightJson || 'null', refData, this.engine.isPopup), 'rightJson');
    }

    if (mode === 'choose') {
      payload.whenTrue = parseJsonValue(await render(data.whenTrueJson || 'true', refData, this.engine.isPopup), 'whenTrueJson');
      payload.whenFalse = parseJsonValue(await render(data.whenFalseJson || 'false', refData, this.engine.isPopup), 'whenFalseJson');
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function variableStore({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'get';
    const name = await render(data.variableStoreName || '', refData, this.engine.isPopup);
    let action = 'variable_get';
    const payload = { name };

    if (mode === 'set') {
      action = 'variable_set';
      payload.type = data.variableType || 'any';
      payload.scope = data.variableScope || 'project';
      payload.description = await render(data.variableDescription || '', refData, this.engine.isPopup);
      payload.value = parseJsonValue(await render(data.valueJson || 'null', refData, this.engine.isPopup), 'valueJson');
    } else if (mode === 'list') {
      action = 'variable_list';
      delete payload.name;
      payload.scope = await render(data.variableScope || '', refData, this.engine.isPopup);
    } else if (mode === 'delete') {
      action = 'variable_delete';
    } else if (mode === 'increment') {
      action = 'variable_increment';
      payload.delta = Number(data.delta || 1);
      payload.scope = data.variableScope || 'project';
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function automaCoreTools({ id, data }, { refData, prevBlockData }) {
  try {
    const mode = data.mode || 'setVariable';
    const name = await render(data.coreName || '', refData, this.engine.isPopup);
    const path = await render(data.corePath || '', refData, this.engine.isPopup);
    const value = parseJsonValue(
      await render(data.valueJson || 'null', refData, this.engine.isPopup),
      'valueJson'
    );
    const defaultValue = parseJsonValue(
      await render(data.defaultJson || 'null', refData, this.engine.isPopup),
      'defaultJson'
    );
    const variables = this.engine.referenceData.variables || {};
    const table = Array.isArray(this.engine.referenceData.table)
      ? this.engine.referenceData.table
      : [];
    const globalData =
      this.engine.referenceData.globalData &&
      typeof this.engine.referenceData.globalData === 'object' &&
      !Array.isArray(this.engine.referenceData.globalData)
        ? this.engine.referenceData.globalData
        : {};
    let result;

    if (mode === 'getVariable') {
      result = objectPath.get(variables, name, defaultValue);
    } else if (mode === 'setVariable') {
      await this.setVariable(name, value);
      result = { name, value };
    } else if (mode === 'pushVariable') {
      await this.setVariable(`$push:${name}`, value);
      result = { name, value: objectPath.get(this.engine.referenceData.variables, name) };
    } else if (mode === 'incrementVariable') {
      const currentValue = Number(objectPath.get(variables, name, 0) || 0);
      const nextValue = currentValue + Number(data.delta || 1);
      await this.setVariable(name, nextValue);
      result = { name, previous: currentValue, value: nextValue };
    } else if (mode === 'setTableColumn') {
      this.addDataToColumn(name, value);
      result = { column: name, value, rows: table.length };
    } else if (mode === 'getTable') {
      result = path ? objectPath.get(table, path, defaultValue) : table;
    } else if (mode === 'setGlobalData') {
      objectPath.set(globalData, path || name, value);
      this.engine.referenceData.globalData = globalData;
      result = { path: path || name, value };
    } else if (mode === 'getGlobalData') {
      result = objectPath.get(globalData, path || name, defaultValue);
    } else if (mode === 'getPrevBlockData') {
      result = path ? objectPath.get(prevBlockData, path, defaultValue) : prevBlockData;
    } else {
      result = {
        variables,
        table,
        globalData,
        loopData: this.engine.referenceData.loopData,
        workflow: this.engine.referenceData.workflow,
      };
    }

    const responseData = {
      ok: true,
      action: 'automa_core_tools',
      result: { mode, name, path, value: result },
    };
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function loopHelper({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'range';
    const modeToAction = {
      range: 'loop_range',
      repeat: 'loop_repeat',
      chunk: 'loop_chunk',
      enumerate: 'loop_enumerate',
    };
    const action = modeToAction[mode] || 'loop_range';
    const payload = {};

    if (mode === 'range') {
      payload.start = Number(data.start || 0);
      payload.end = Number(data.end || 0);
      payload.step = Number(data.step || 1);
      payload.inclusive = Boolean(data.inclusive);
    } else if (mode === 'repeat') {
      payload.item = parseJsonValue(await render(data.itemJson || 'null', refData, this.engine.isPopup), 'itemJson');
      payload.times = Number(data.times || 1);
    } else {
      payload.items = parseJsonArray(await render(data.itemsJson || '[]', refData, this.engine.isPopup), 'itemsJson');
      if (mode === 'chunk') payload.size = Number(data.size || 1);
      if (mode === 'enumerate') payload.start = Number(data.start || 0);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function basForLoop({ id, data }, { refData }) {
  try {
    const indexName = await render(data.indexName || 'i', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'loop_for',
      payload: {
        start: Number(data.start || 0),
        end: Number(data.end || 0),
        step: Number(data.step || 1),
        inclusive: Boolean(data.inclusive),
        indexName,
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function basForeachLoop({ id, data }, { refData }) {
  try {
    const items = parseJsonArray(
      await render(data.itemsJson || '[]', refData, this.engine.isPopup),
      'itemsJson'
    );
    const indexName = await render(data.indexName || 'index', refData, this.engine.isPopup);
    const itemName = await render(data.itemName || 'item', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'loop_foreach',
      payload: {
        items,
        start: Number(data.start || 0),
        indexName,
        itemName,
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function filePathTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'write';
    const modeToAction = {
      read: 'file_read',
      write: 'file_write',
      list: 'file_list',
      delete: 'file_delete',
      exists: 'file_exists',
      mkdir: 'file_mkdir',
      copy: 'file_copy',
      move: 'file_move',
      join: 'path_join',
      dirname: 'path_dirname',
      basename: 'path_basename',
      ext: 'path_ext',
      normalize: 'path_normalize',
      relative: 'path_relative',
      isAbsolute: 'path_is_absolute',
    };
    const action = modeToAction[mode] || 'file_write';
    const payload = {
      path: await render(data.path || '', refData, this.engine.isPopup),
    };

    if (mode === 'write') payload.text = await render(data.text || '', refData, this.engine.isPopup);
    if (['copy', 'move'].includes(mode)) {
      payload.source = await render(data.source || '', refData, this.engine.isPopup);
      payload.target = await render(data.target || '', refData, this.engine.isPopup);
    }
    if (mode === 'join') {
      payload.parts = parseJsonArray(await render(data.partsJson || '[]', refData, this.engine.isPopup), 'partsJson');
    }
    if (mode === 'relative') {
      payload.base = await render(data.base || '.', refData, this.engine.isPopup);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function waitTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'sleep';
    const modeToAction = {
      sleep: 'wait_sleep',
      file: 'wait_file',
      http: 'wait_http',
      selector: 'wait_selector',
      text: 'wait_text',
      try: 'try_action',
      retry: 'retry_action',
    };
    const action = modeToAction[mode] || 'wait_sleep';
    const payload = {
      seconds: Number(data.seconds || 1),
      timeout: Number(data.timeoutSeconds || data.timeout || 10),
      interval: Number(data.interval || 0.5),
    };

    if (mode === 'file') {
      payload.path = await render(data.path || '', refData, this.engine.isPopup);
      payload.mode = data.fileMode || 'exists';
      payload.contains = await render(data.text || '', refData, this.engine.isPopup);
    } else if (mode === 'http') {
      payload.url = await render(data.url || '', refData, this.engine.isPopup);
      payload.status = Number(data.status || 200);
      payload.contains = await render(data.text || '', refData, this.engine.isPopup);
    } else if (['selector', 'text'].includes(mode)) {
      payload.browserEngine = data.browserEngine || 'chromium';
      payload.url = await render(data.url || '', refData, this.engine.isPopup);
      payload.selector = await render(data.selector || '', refData, this.engine.isPopup);
      payload.text = await render(data.text || '', refData, this.engine.isPopup);
      payload.state = data.state || 'visible';
      payload.headless = data.headless !== false;
    } else if (['try', 'retry'].includes(mode)) {
      payload.action = await render(data.retryAction || 'echo', refData, this.engine.isPopup);
      payload.payload = parseJsonObject(await render(data.actionPayloadJson || '{}', refData, this.engine.isPopup), 'actionPayloadJson');
      payload.attempts = Number(data.attempts || 3);
      payload.delaySeconds = Number(data.delaySeconds || 1);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function profileAction({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'create';
    const modeToAction = {
      create: 'browser_profile_create',
      list: 'browser_profile_list',
      get: 'browser_profile_get',
      delete: 'browser_profile_delete',
      lock: 'browser_profile_lock',
      release: 'browser_profile_release',
      copy: 'browser_profile_copy',
      metadata: 'browser_profile_set_metadata',
      importCookies: 'browser_profile_import_cookies',
      exportCookies: 'browser_profile_export_cookies',
    };
    const action = modeToAction[mode] || 'browser_profile_create';
    const profileName = await render(data.profileName || '', refData, this.engine.isPopup);
    const payload = {
      name: profileName,
      browserEngine: data.browserEngine || 'chromium',
      description: await render(data.profileDescription || '', refData, this.engine.isPopup),
      force: Boolean(data.force),
      overwrite: Boolean(data.overwrite),
    };
    if (mode === 'release') {
      payload.token = await render(data.lockToken || '', refData, this.engine.isPopup);
    }
    if (mode === 'copy') {
      payload.source = profileName;
      payload.target = await render(data.targetProfileName || '', refData, this.engine.isPopup);
    }
    if (mode === 'metadata') {
      Object.assign(payload, parseJsonObject(await render(data.metadataJson || '{}', refData, this.engine.isPopup), 'metadataJson'));
    }
    if (mode === 'importCookies') {
      payload.cookies = parseJsonArray(await render(data.cookiesJson || '[]', refData, this.engine.isPopup), 'cookiesJson');
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function networkRecorderImport({ id, data }, { refData }) {
  try {
    const payload = {
      name: await render(data.workflowName || 'captured-http-workflow', refData, this.engine.isPopup),
      browserEngine: data.browserEngine || 'chromium',
      profileName: await render(data.profileName || '', refData, this.engine.isPopup),
      limit: Number(data.limit || 12),
      headless: data.headless !== false,
    };
    if (data.source === 'html') {
      payload.html = await render(data.html || '', refData, this.engine.isPopup);
    } else {
      payload.url = await render(data.url || '', refData, this.engine.isPopup);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'network_recorder_import',
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function manualIntervention({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'captchaCheck';
    const payload = {
      title: await render(data.title || 'Captcha or manual check', refData, this.engine.isPopup),
      reason: await render(data.reason || 'manual_checkpoint', refData, this.engine.isPopup),
      instructions: await render(data.instructions || '', refData, this.engine.isPopup),
      workflowId: this.engine?.workflow?.id || '',
      blockId: id,
      timeoutSeconds: Number(data.timeoutSeconds || 300),
    };

    let action = 'manual_intervention_create';
    if (mode === 'captchaCheck') {
      action = 'captcha_manual_check';
      payload.browserEngine = data.browserEngine || 'chromium';
      payload.profileName = await render(data.profileName || '', refData, this.engine.isPopup);
      payload.text = await render(data.text || '', refData, this.engine.isPopup);
      payload.screenshot = data.screenshot !== false;
      payload.force = Boolean(data.force);
      payload.wait = Boolean(data.wait);
      payload.createIntervention = true;
      if (data.source === 'url') {
        payload.url = await render(data.url || '', refData, this.engine.isPopup);
      } else {
        payload.html = await render(data.html || '', refData, this.engine.isPopup);
      }
    } else if (mode === 'wait') {
      action = 'manual_intervention_wait';
      payload.id = await render(data.interventionId || '', refData, this.engine.isPopup);
    } else if (mode === 'respond') {
      action = 'manual_intervention_respond';
      payload.id = await render(data.interventionId || '', refData, this.engine.isPopup);
      payload.decision = data.decision || 'resume';
      payload.note = await render(data.note || '', refData, this.engine.isPopup);
    } else if (mode === 'list') {
      action = 'manual_intervention_list';
      payload.status = data.status || '';
      payload.limit = Number(data.limit || 20);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function userInteraction({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'messageBox';
    const title = await render(data.title || 'Silverback Coding', refData, this.engine.isPopup);
    const message = await render(data.message || '', refData, this.engine.isPopup);
    const defaultValue = await render(data.defaultValue || '', refData, this.engine.isPopup);
    const inputName = await render(data.inputName || 'user_input', refData, this.engine.isPopup);
    const code = await render(data.code || 'result = input.message;', refData, this.engine.isPopup);
    const inputJson = parseJsonValue(
      await render(data.inputJson || '{}', refData, this.engine.isPopup),
      'inputJson'
    );
    let localResult = { mode, title, message };

    if (mode === 'messageBox') {
      const injected = await executeInActiveTab(this, (alertMessage) => {
        window.alert(alertMessage);
        return { shown: true };
      }, [message || title]);
      localResult = injected.ok
        ? { ...localResult, shown: true, target: 'activeTab', tabId: injected.tabId }
        : { ...localResult, shown: false, error: injected.error };
      if (!localResult.shown && globalThis.chrome?.notifications?.create) {
        await globalThis.chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icon-128.png',
          title,
          message: message || title,
        });
        localResult = { ...localResult, shown: true, target: 'notification' };
      }
    } else if (mode === 'requestInput') {
      const injected = await executeInActiveTab(this, (promptMessage, promptDefault) => {
        return window.prompt(promptMessage, promptDefault);
      }, [message || title, defaultValue]);
      const value = injected.ok ? injected.result : defaultValue;
      localResult = {
        ...localResult,
        inputName,
        value,
        cancelled: value === null,
        target: injected.ok ? 'activeTab' : 'defaultValue',
        tabId: injected.tabId,
      };
    } else if (mode === 'playSound') {
      const injected = await executeInActiveTab(this, (frequency, durationMs, volume) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return { played: false, error: 'Web Audio API is not available' };
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = volume;
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start();
        window.setTimeout(() => {
          oscillator.stop();
          audio.close();
        }, durationMs);
        return { played: true, frequency, durationMs };
      }, [Number(data.frequency || 880), Number(data.durationMs || 240), Number(data.volume || 0.18)]);
      localResult = {
        ...localResult,
        played: Boolean(injected.result?.played),
        target: injected.ok ? 'activeTab' : 'none',
        tabId: injected.tabId,
        error: injected.result?.error || injected.error,
      };
    } else if (mode === 'executeUiJs') {
      const injected = await executeInActiveTab(this, (userCode, input) => {
        const fn = new Function('input', `${userCode}\n; return typeof result !== 'undefined' ? result : undefined;`);
        return fn(input);
      }, [code, { ...inputJson, message, title }]);
      localResult = injected.ok
        ? { ...localResult, value: injected.result, target: 'activeTab', tabId: injected.tabId }
        : { ...localResult, error: injected.error, target: 'none' };
    } else if (mode === 'manualControl') {
      const focused = await focusActiveTab(this);
      localResult = {
        ...localResult,
        focused: Boolean(focused.ok),
        tabId: focused.tabId,
        url: focused.url,
        instructions: await render(data.instructions || message, refData, this.engine.isPopup),
      };
    }

    let responseData = {
      ok: true,
      action: 'user_interaction_local',
      result: localResult,
    };

    if (data.logToBridge !== false) {
      const bridgeResponse = await callBridge(data, refData, this.engine.isPopup, {
        action: 'user_interaction',
        payload: {
          mode,
          title,
          message,
          defaultValue,
          inputName,
          responseValue: localResult.value,
          instructions: localResult.instructions,
          createIntervention: mode === 'manualControl' ? data.createIntervention !== false : Boolean(data.createIntervention),
          wait: Boolean(data.wait),
          timeoutSeconds: Number(data.timeoutSeconds || 300),
          localResult,
          templateVariables: legacyTemplateVariables(refData),
        },
      });
      responseData = {
        ok: bridgeResponse.ok !== false,
        action: 'user_interaction',
        result: { ...localResult, bridge: bridgeResponse.result || bridgeResponse },
      };
    }

    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function resultTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'log';
    const action = mode === 'random' ? 'random_number' : ['message', 'messageBox'].includes(mode) ? 'result_message' : 'result_log';
    const payload = {
      level: data.level || 'info',
      message: await render(data.message || '', refData, this.engine.isPopup),
      data: parseJsonValue(await render(data.dataJson || 'null', refData, this.engine.isPopup), 'dataJson'),
      min: Number(data.min || 0),
      max: Number(data.max || 100),
      integer: data.integer !== false,
    };
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload,
    });
    if (mode === 'messageBox') {
      const message = payload.message || JSON.stringify(responseData.result || responseData);
      let shown = false;
      if (typeof globalThis.alert === 'function') {
        globalThis.alert(message);
        shown = true;
      } else if (globalThis.chrome?.notifications?.create) {
        await globalThis.chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icon-128.png',
          title: 'Silverback Coding',
          message,
        });
        shown = true;
      }
      responseData.result = { ...(responseData.result || {}), messageBoxShown: shown };
    }
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function httpClient({ id, data }, { refData }) {
  try {
    const url = await render(data.url || '', refData, this.engine.isPopup);
    const headersText = await render(data.headersJson || '{}', refData, this.engine.isPopup);
    const payload = {
      method: data.method || 'GET',
      url,
      headers: parseJsonObject(headersText, 'headersJson'),
      timeout: Number(data.timeout || 20),
      maxChars: Number(data.maxChars || 200000),
    };

    if (data.bodyMode === 'json') {
      const jsonBody = await render(data.jsonBody || '{}', refData, this.engine.isPopup);
      payload.json = JSON.parse(jsonBody);
    } else if (data.bodyMode === 'text') {
      payload.body = await render(data.body || '', refData, this.engine.isPopup);
    }

    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'http_request',
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function systemCommand({ id, data }, { refData }) {
  try {
    const envText = await render(data.envJson || '{}', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'system_command_exec',
      payload: {
        shell: data.shell || 'cmd',
        command: await render(data.command || '', refData, this.engine.isPopup),
        cwd: await render(data.cwd || '.', refData, this.engine.isPopup),
        inputText: await render(data.inputText || '', refData, this.engine.isPopup),
        env: parseJsonObject(envText, 'envJson'),
        dryRun: Boolean(data.dryRun),
        timeout: Number(data.executionTimeout || 30),
        maxOutputChars: Number(data.maxOutputChars || 200000),
        templateVariables: legacyTemplateVariables(refData),
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function androidAutomation({ id, data }, { refData }) {
  try {
    const selectorText = await render(data.selectorJson || '{}', refData, this.engine.isPopup);
    const tasksText = await render(data.tasksJson || '[]', refData, this.engine.isPopup);
    const devicesText = await render(data.devicesJson || '[]', refData, this.engine.isPopup);
    const stepsText = await render(data.stepsJson || '[]', refData, this.engine.isPopup);
    const extrasText = await render(data.extrasJson || '{}', refData, this.engine.isPopup);
    const mode = data.mode || 'devices';
    const actionMap = {
      devices: 'android_adb_devices',
      connect: 'android_adb_connect',
      state: 'android_state',
      uiTree: 'android_ui_tree',
      analyze: 'android_ui_analyze',
      findElement: 'android_find_element',
      waitElement: 'android_wait_element',
      elementAt: 'android_element_at',
      xpath: 'android_xpath',
      tap: 'android_tap',
      longClick: 'android_long_click',
      inputText: 'android_input_text',
      swipe: 'android_swipe',
      drag: 'android_drag',
      press: 'android_press',
      wait: 'android_wait',
      shell: 'android_shell',
      screenshot: 'android_screenshot',
      notifications: 'android_notifications',
      app: 'android_app',
      packages: 'android_packages',
      intent: 'android_intent',
      proxy: 'android_proxy',
      location: 'android_location',
      permissions: 'android_permissions',
      files: 'android_files',
      screenRecord: 'android_screen_record',
      imageFind: 'android_image_find',
      pixel: 'android_pixel',
      deviceProfile: 'android_device_profile',
      monkey: 'android_monkey',
      buildAirtestScript: 'android_script_build',
      parallelRun: 'android_parallel_run',
    };
    const payload = {
      adbPath: await render(data.adbPath || 'adb', refData, this.engine.isPopup),
      deviceId: await render(data.deviceId || '', refData, this.engine.isPopup),
      connection: data.connection || 'auto',
      host: await render(data.host || '', refData, this.engine.isPopup),
      wifi: Boolean(data.wifi),
      packageName: await render(data.packageName || '', refData, this.engine.isPopup),
      query: await render(data.packageName || '', refData, this.engine.isPopup),
      activity: await render(data.activity || '', refData, this.engine.isPopup),
      apkPath: await render(data.apkPath || '', refData, this.engine.isPopup),
      selector: parseJsonObjectOr(selectorText, {}),
      xpath: await render(data.xpath || '', refData, this.engine.isPopup),
      text: await render(data.text || '', refData, this.engine.isPopup),
      key: await render(data.key || 'BACK', refData, this.engine.isPopup),
      command: await render(data.shellCommand || '', refData, this.engine.isPopup),
      intentAction: await render(data.intentAction || 'android.intent.action.VIEW', refData, this.engine.isPopup),
      dataUri: await render(data.dataUri || '', refData, this.engine.isPopup),
      component: await render(data.component || '', refData, this.engine.isPopup),
      extras: parseJsonObjectOr(extrasText, {}),
      proxy: await render(data.proxy || '', refData, this.engine.isPopup),
      latitude: Number(data.latitude || 0),
      longitude: Number(data.longitude || 0),
      permission: await render(data.permission || '', refData, this.engine.isPopup),
      remotePath: await render(data.remotePath || '/sdcard/Download', refData, this.engine.isPopup),
      localPath: await render(data.localPath || '', refData, this.engine.isPopup),
      templatePath: await render(data.templatePath || '', refData, this.engine.isPopup),
      color: await render(data.color || '', refData, this.engine.isPopup),
      profileName: await render(data.profileName || 'default-android-profile', refData, this.engine.isPopup),
      name: await render(data.scriptName || data.profileName || 'silverback-android-script', refData, this.engine.isPopup),
      brand: await render(data.brand || 'Google', refData, this.engine.isPopup),
      manufacturer: await render(data.manufacturer || 'Google', refData, this.engine.isPopup),
      model: await render(data.model || 'Pixel 7', refData, this.engine.isPopup),
      imei: await render(data.imei || '', refData, this.engine.isPopup),
      phoneNumber: await render(data.phoneNumber || '', refData, this.engine.isPopup),
      wifiSsid: await render(data.wifiSsid || '', refData, this.engine.isPopup),
      x: Number(data.x || 0),
      y: Number(data.y || 0),
      x1: Number(data.x1 || 0),
      y1: Number(data.y1 || 0),
      x2: Number(data.x2 || 0),
      y2: Number(data.y2 || 0),
      durationMs: Number(data.durationMs || 400),
      seconds: Number(data.seconds || 1),
      clear: Boolean(data.clear),
      tapBefore: data.tapBefore !== false,
      includeXml: Boolean(data.includeXml),
      maxElements: Number(data.maxElements || 200),
      operation: data.appOperation || 'current',
      fileOperation: data.fileOperation || 'list',
      permissionOperation: data.permissionOperation || 'list',
      profileOperation: data.profileOperation || 'build',
      events: Number(data.events || 100),
      threshold: Number(data.threshold || 0.86),
      steps: parseJsonArrayOr(stepsText, []),
      devices: parseJsonArrayOr(devicesText, []),
      tasks: parseJsonArrayOr(tasksText, []),
      workers: Number(data.workers || 4),
      dryRun: Boolean(data.dryRun),
      timeout: Number(data.executionTimeout || 30),
      templateVariables: legacyTemplateVariables(refData),
    };
    if (mode === 'files') payload.operation = payload.fileOperation;
    if (mode === 'permissions') payload.operation = payload.permissionOperation;
    if (mode === 'deviceProfile') {
      payload.operation = payload.profileOperation;
      payload.name = payload.profileName;
    }
    if (mode === 'proxy') payload.operation = data.proxyOperation || 'set';
    if (mode === 'buildAirtestScript') payload.name = await render(data.scriptName || 'silverback-android-script', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: actionMap[mode] || 'android_adb_devices',
      payload,
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function libraryRunner({ id, data }, { refData }) {
  try {
    const runtime = data.runtime === 'node' ? 'node' : 'python';
    const packagesText = await render(data.packagesJson || '[]', refData, this.engine.isPopup);
    const inputText = await render(data.inputJson || '{}', refData, this.engine.isPopup);
    const code = await render(data.code || '', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: runtime === 'node' ? 'node_script_exec' : 'python_script_exec',
      payload: {
        packages: parseJsonArray(packagesText, 'packagesJson'),
        code,
        input: JSON.parse(inputText || 'null'),
        timeout: Number(data.executionTimeout || 30),
        installTimeout: Number(data.installTimeout || 180),
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function telegramMessage({ id, data }, { refData }) {
  try {
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'telegram_send_message',
      payload: {
        valueToken: await render(data.valueToken || '', refData, this.engine.isPopup),
        token: await render(data.valueToken || '', refData, this.engine.isPopup),
        tokenResource: await render(data.tokenResource || 'telegram_bot_token', refData, this.engine.isPopup),
        chatId: await render(data.chatId || '', refData, this.engine.isPopup),
        text: await render(data.text || '', refData, this.engine.isPopup),
        parseMode: data.parseMode || '',
        dryRun: data.dryRun !== false,
        timeout: Number(data.requestTimeout || 20),
        templateVariables: legacyTemplateVariables(refData),
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export async function telegramBotBuilder({ id, data }, { refData }) {
  try {
    const appName = await render(data.appName || 'silverback-telegram-bot', refData, this.engine.isPopup);
    const tokenResource = await render(data.tokenResource || 'telegram_bot_token', refData, this.engine.isPopup);
    const startText = await render(data.startText || 'Hello from Silverback Coding bot', refData, this.engine.isPopup);
    const handlersText = await render(data.commandHandlersJson || '[]', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'telegram_bot_build',
      payload: {
        runtime: data.runtime === 'node' ? 'node' : 'python',
        name: appName,
        tokenResource,
        startText,
        commandHandlers: parseJsonArray(handlersText, 'commandHandlersJson'),
        templateVariables: legacyTemplateVariables(refData),
      },
    });
    return finishBlock(this, id, data, responseData);
  } catch (error) {
    return fallbackOrThrow(this, id, error);
  }
}

export default function () {
  return {
    pythonBridge,
    parallelRunner,
    buildApp,
    projectTemplateBuilder,
    browserScanner,
    resourceStore,
    resourceDesignBuilder,
    jsonTools,
    listTools,
    logicTools,
    variableStore,
    automaCoreTools,
    loopHelper,
    basForLoop,
    basForeachLoop,
    filePathTools,
    waitTools,
    profileAction,
    networkRecorderImport,
    manualIntervention,
    userInteraction,
    resultTools,
    httpClient,
    systemCommand,
    androidAutomation,
    androidDevices: androidAutomation,
    androidConnect: androidAutomation,
    androidState: androidAutomation,
    androidUiTree: androidAutomation,
    androidAnalyze: androidAutomation,
    androidFindElement: androidAutomation,
    androidWaitElement: androidAutomation,
    androidElementAt: androidAutomation,
    androidXpath: androidAutomation,
    androidTap: androidAutomation,
    androidLongClick: androidAutomation,
    androidInputText: androidAutomation,
    androidSwipe: androidAutomation,
    androidDrag: androidAutomation,
    androidPress: androidAutomation,
    androidWait: androidAutomation,
    androidShell: androidAutomation,
    androidScreenshot: androidAutomation,
    androidNotifications: androidAutomation,
    androidApp: androidAutomation,
    androidPackages: androidAutomation,
    androidIntent: androidAutomation,
    androidProxy: androidAutomation,
    androidLocation: androidAutomation,
    androidPermissions: androidAutomation,
    androidFiles: androidAutomation,
    androidScreenRecord: androidAutomation,
    androidImageFind: androidAutomation,
    androidPixel: androidAutomation,
    androidDeviceProfile: androidAutomation,
    androidMonkey: androidAutomation,
    androidParallelRun: androidAutomation,
    androidAirtestScript: androidAutomation,
    libraryRunner,
    telegramMessage,
    telegramBotBuilder,
  };
}

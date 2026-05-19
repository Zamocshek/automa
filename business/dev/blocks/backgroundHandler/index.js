import objectPath from 'object-path';
import renderString from '@/workflowEngine/templating/renderString';

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8765/run';

async function render(value, refData, isPopup) {
  return (await renderString(String(value ?? ''), refData, isPopup)).value;
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
    const appName = await render(data.appName || 'visual-coding-demo', refData, this.engine.isPopup);
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
    const action = data.mode === 'verify' ? 'private_vpn_project_verify' : 'private_vpn_project_build';
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action,
      payload: {
        name: projectName,
        template: data.template || 'private-vpn-lab',
        brandName,
        botUsername,
        supportUsername,
        domain,
        subscriptionRoutePrefix: routePrefix,
        deviceLimit: Number(data.deviceLimit || 10),
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

export async function resultTools({ id, data }, { refData }) {
  try {
    const mode = data.mode || 'log';
    const action = mode === 'random' ? 'random_number' : mode === 'message' ? 'result_message' : 'result_log';
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

export async function telegramBotBuilder({ id, data }, { refData }) {
  try {
    const appName = await render(data.appName || 'visual-coding-telegram-bot', refData, this.engine.isPopup);
    const tokenResource = await render(data.tokenResource || 'telegram_bot_token', refData, this.engine.isPopup);
    const startText = await render(data.startText || 'Hello from Visual Coding bot', refData, this.engine.isPopup);
    const handlersText = await render(data.commandHandlersJson || '[]', refData, this.engine.isPopup);
    const responseData = await callBridge(data, refData, this.engine.isPopup, {
      action: 'telegram_bot_build',
      payload: {
        runtime: data.runtime === 'node' ? 'node' : 'python',
        name: appName,
        tokenResource,
        startText,
        commandHandlers: parseJsonArray(handlersText, 'commandHandlersJson'),
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
    jsonTools,
    listTools,
    logicTools,
    variableStore,
    loopHelper,
    filePathTools,
    waitTools,
    profileAction,
    networkRecorderImport,
    resultTools,
    httpClient,
    libraryRunner,
    telegramBotBuilder,
  };
}

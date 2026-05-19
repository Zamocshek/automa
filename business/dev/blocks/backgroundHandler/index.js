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
    browserScanner,
    resourceStore,
    httpClient,
    libraryRunner,
    telegramBotBuilder,
  };
}

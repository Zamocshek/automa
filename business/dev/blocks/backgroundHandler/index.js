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

export default function () {
  return {
    pythonBridge,
    parallelRunner,
    buildApp,
  };
}

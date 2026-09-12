/* global globalThis */
/* eslint no-use-before-define: ["error", { "functions": false }] */
import { reactive } from 'vue';
import browser from 'webextension-polyfill';

export const HTTP_SNIFF_IMPORT_LIMIT = 200;
const CAPTURE_LIMIT = 1000;
const CAPTURE_BYTES_LIMIT = 10 * 1024 * 1024;

export function normalizeBrowserLabUrl(value) {
  const raw = String(value || '').trim() || 'https://example.com';
  const url = new URL(
    /^(https?|file):\/\//i.test(raw) ? raw : `https://${raw}`
  );
  return url.href;
}

export function waitForBrowserLabTab(browserApi, tabId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let timer;
    let finished = false;
    function finish(error, tab) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      browserApi.tabs.onUpdated.removeListener(onUpdated);
      browserApi.tabs.onRemoved.removeListener(onRemoved);
      if (error) reject(error);
      else resolve(tab);
    }
    function check() {
      browserApi.tabs.get(tabId).then(
        (tab) => {
          if (tab.status === 'complete') finish(null, tab);
        },
        (error) => finish(error)
      );
    }
    function onUpdated(id, change) {
      if (id === tabId && change.status === 'complete') check();
    }
    function onRemoved(id) {
      if (id === tabId) finish(new Error('Browser Lab tab was closed'));
    }
    browserApi.tabs.onUpdated.addListener(onUpdated);
    browserApi.tabs.onRemoved.addListener(onRemoved);
    timer = setTimeout(
      () => finish(new Error('Browser Lab tab is still loading')),
      timeoutMs
    );
    check();
  });
}

export function createBrowserLabSession(browserApi, chromeApi, limits = {}) {
  const state = reactive({
    browserUrl: 'https://example.com',
    browserSelector: 'button, a, input',
    browserLabTabId: null,
    browserLabWindowId: null,
    browserLabStatus: 'браузер не открыт',
    browserLabBusy: false,
    httpSniffStatus: 'запись остановлена',
    httpSniffActive: false,
    httpSniffBusy: false,
    httpSniffRequests: [],
    httpSniffImportStatus: '',
  });
  let tabOperation = Promise.resolve();
  let startOperation = null;
  let stopOperation = null;
  let capture = null;
  const maxRequests = limits.maxRequests ?? CAPTURE_LIMIT;
  const maxBytes = limits.maxBytes ?? CAPTURE_BYTES_LIMIT;
  const updateBusy = () => {
    state.httpSniffBusy = Boolean(startOperation || stopOperation);
  };

  function debuggerCall(method, ...args) {
    return new Promise((resolve, reject) => {
      if (!chromeApi?.debugger?.[method]) {
        reject(new Error('chrome.debugger API is not available'));
        return;
      }
      chromeApi.debugger[method](...args, (result) => {
        const error = chromeApi.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }

  async function getTab() {
    if (state.browserLabTabId === null) return null;
    try {
      return await browserApi.tabs.get(state.browserLabTabId);
    } catch {
      state.browserLabTabId = null;
      state.browserLabWindowId = null;
      state.browserLabStatus = 'вкладка браузера закрыта';
      return null;
    }
  }

  function openTab(url, { navigate = false } = {}) {
    const operation = tabOperation.then(async () => {
      let tab = await getTab();
      if (tab) {
        tab = await browserApi.tabs.update(tab.id, {
          active: true,
          ...(navigate ? { url } : {}),
        });
        await browserApi.windows.update(tab.windowId, { focused: true });
      } else {
        const win = await browserApi.windows.create({
          url,
          type: 'normal',
          focused: true,
          width: 1280,
          height: 900,
        });
        [tab] = win.tabs?.length
          ? win.tabs
          : await browserApi.tabs.query({ windowId: win.id });
      }
      if (tab?.id === undefined)
        throw new Error('Browser Lab tab was not opened');
      state.browserLabTabId = tab.id;
      state.browserLabWindowId = tab.windowId;
      state.browserLabStatus = `вкладка ${tab.id}: ${
        tab.pendingUrl || tab.url || url
      }`;
      return tab;
    });
    tabOperation = operation.catch(() => {});
    return operation;
  }

  function removeListeners() {
    chromeApi?.debugger?.onEvent?.removeListener(onDebugEvent);
    chromeApi?.debugger?.onDetach?.removeListener(onDetach);
    globalThis.removeEventListener?.('pagehide', onPageHide);
  }

  async function detach(current) {
    if (current.attached) {
      await debuggerCall('detach', { tabId: current.tabId });
      current.attached = false;
    }
    removeListeners();
    if (capture === current) capture = null;
  }

  function onDetach(source, reason) {
    if (!capture || source?.tabId !== capture.tabId) return;
    const current = capture;
    current.attached = false;
    current.detached = true;
    current.cancelled = true;
    removeListeners();
    state.httpSniffActive = false;
    state.httpSniffStatus = `отключено (${reason}), запросов: ${state.httpSniffRequests.length}`;
    if (reason === 'target_closed' && state.browserLabTabId === current.tabId) {
      state.browserLabTabId = null;
      state.browserLabWindowId = null;
      state.browserLabStatus = 'вкладка браузера закрыта';
    }
    if (current.ready) capture = null;
  }

  function publish(current) {
    if (!current.ready) return;
    state.httpSniffRequests = current.requests.slice();
    state.httpSniffStatus = `запись вкладки ${current.tabId}, запросов: ${current.requests.length}`;
  }

  function onDebugEvent(source, method, params = {}) {
    const current = capture;
    if (
      !current?.attached ||
      current.cancelled ||
      source?.tabId !== current.tabId ||
      source.sessionId
    )
      return;
    const existing = current.requestMap.get(params.requestId);
    const setResponse = (response) => {
      if (!existing || !response) return;
      existing.status = response.status;
      existing.statusText = response.statusText;
      existing.mimeType = response.mimeType;
    };
    if (method === 'Network.requestWillBeSent') {
      // CDP reuses requestId for every hop in a redirect chain.
      setResponse(params.redirectResponse);
      current.requestMap.delete(params.requestId);
      const request = params.request || {};
      if (!/^https?:\/\//i.test(request.url || '')) return;
      const item = {
        event: 'request',
        requestId: params.requestId,
        method: request.method || 'GET',
        url: request.url,
        headers: request.headers || {},
        body: request.postData || '',
        bodyUnavailable: Boolean(
          request.hasPostData && request.postData === undefined
        ),
        resourceType: params.type || '',
        documentUrl: params.documentURL || '',
        initiator: params.initiator?.type || '',
        timestamp: Date.now(),
      };
      const size = new TextEncoder().encode(JSON.stringify(item)).byteLength;
      if (
        current.limitReason ||
        current.requests.length >= maxRequests ||
        current.bytes + size > maxBytes
      ) {
        current.limitReason = 'достигнут лимит записи';
        if (current.ready)
          stopHttpSniff(current.limitReason).catch(console.error);
        return;
      }
      current.bytes += size;
      current.requests.push(item);
      current.requestMap.set(params.requestId, item);
    } else if (method === 'Network.responseReceived') {
      setResponse(params.response);
    } else {
      return;
    }
    publish(current);
  }

  function startHttpSniff(url) {
    if (startOperation) return startOperation;
    if (stopOperation) return stopOperation.then(() => startHttpSniff(url));
    if (state.httpSniffActive) {
      return capture?.cancelled
        ? Promise.reject(
            new Error('Debugger is still attached; stop sniff first')
          )
        : Promise.resolve();
    }
    const current = {
      tabId: null,
      attached: false,
      cancelled: false,
      ready: false,
      requests: [],
      requestMap: new Map(),
      bytes: 0,
    };
    capture = current;
    const checkCancelled = () => {
      if (current.cancelled) throw new Error('HTTP sniff start was cancelled');
    };
    startOperation = (async () => {
      try {
        if (!chromeApi?.debugger?.onEvent || !chromeApi?.debugger?.onDetach) {
          throw new Error('chrome.debugger API is not available');
        }
        const targetUrl = normalizeBrowserLabUrl(url);
        // Attach to a new blank tab before loading the initial URL.
        const tab = await openTab('about:blank');
        current.tabId = tab.id;
        checkCancelled();
        chromeApi.debugger.onEvent.addListener(onDebugEvent);
        chromeApi.debugger.onDetach.addListener(onDetach);
        globalThis.addEventListener?.('pagehide', onPageHide);
        await debuggerCall('attach', { tabId: tab.id }, '1.3');
        current.attached = !current.detached;
        checkCancelled();
        await debuggerCall('sendCommand', { tabId: tab.id }, 'Network.enable', {
          maxPostDataSize: 1024 * 1024,
        });
        checkCancelled();
        const effectiveUrl = tab.pendingUrl || tab.url;
        if (!effectiveUrl || effectiveUrl === 'about:blank') {
          const navigated = await browserApi.tabs.update(tab.id, {
            url: targetUrl,
          });
          state.browserLabStatus = `вкладка ${tab.id}: ${
            navigated.pendingUrl || navigated.url || targetUrl
          }`;
          checkCancelled();
        }
        current.ready = true;
        state.httpSniffActive = true;
        publish(current);
        if (current.limitReason)
          stopHttpSniff(current.limitReason).catch(console.error);
        return tab;
      } catch (error) {
        current.cancelled = true;
        let startError = error;
        try {
          await detach(current);
        } catch (cleanupError) {
          startError = new Error(
            `${error.message}; detach failed: ${cleanupError.message}`
          );
        }
        state.httpSniffActive = current.attached;
        state.httpSniffStatus = `ошибка запуска: ${startError.message}`;
        throw startError;
      }
    })().finally(() => {
      startOperation = null;
      updateBusy();
    });
    updateBusy();
    return startOperation;
  }

  function stopHttpSniff(reason = 'запись остановлена') {
    if (stopOperation) return stopOperation;
    const current = capture;
    if (!current) return Promise.resolve(state.httpSniffRequests);
    current.cancelled = true;
    stopOperation = (async () => {
      if (startOperation) await startOperation.catch(() => {});
      try {
        await detach(current);
        state.httpSniffActive = false;
        state.httpSniffStatus = `${reason}, запросов: ${state.httpSniffRequests.length}`;
        return state.httpSniffRequests;
      } catch (error) {
        state.httpSniffActive = current.attached;
        state.httpSniffStatus = `ошибка отключения: ${error.message}`;
        throw error;
      }
    })().finally(() => {
      stopOperation = null;
      updateBusy();
    });
    updateBusy();
    return stopOperation;
  }

  function onPageHide() {
    stopHttpSniff().catch(console.error);
  }

  return {
    state,
    getTab,
    openTab,
    startHttpSniff,
    stopHttpSniff,
  };
}

// A route change must not discard the tab, captures or debugger ownership.
export default createBrowserLabSession(browser, globalThis.chrome);

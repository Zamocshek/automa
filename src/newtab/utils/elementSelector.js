import browser from 'webextension-polyfill';
import { isXPath, sleep, getActiveTab } from '@/utils/helper';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;

async function makeDashboardFocus() {
  const currentTab = await browser.tabs.getCurrent();
  if (!currentTab) return;
  await browser.tabs.update(currentTab.id, { active: true });
  await browser.windows.update(currentTab.windowId, {
    focused: true,
  });
}

export async function initElementSelector(tab = null) {
  let activeTab = tab;

  if (!tab) {
    activeTab = await getActiveTab();
  }
  if (!activeTab?.id)
    throw new Error('No tab available for the element selector');

  // A new tab has no receiving content script yet: inject on rejection too.
  const result = await browser.tabs
    .sendMessage(activeTab.id, {
      type: 'automa-element-selector',
    })
    .catch(() => false);

  if (!result) {
    if (isMV2) {
      await browser.tabs.executeScript(activeTab.id, {
        allFrames: true,
        runAt: 'document_start',
        file: './elementSelector.bundle.js',
      });
    } else {
      await browser.scripting.executeScript({
        target: {
          allFrames: true,
          tabId: activeTab.id,
        },
        files: ['./elementSelector.bundle.js'],
      });
    }
  }

  await browser.tabs.update(activeTab.id, { active: true });
  await browser.windows.update(activeTab.windowId, { focused: true });
}

async function verifySelector(data) {
  try {
    const activeTab = await getActiveTab();

    if (!data.findBy) {
      data.findBy = isXPath(data.selector) ? 'xpath' : 'cssSelector';
    }

    await browser.tabs.update(activeTab.id, { active: true });
    await browser.windows.update(activeTab.windowId, { focused: true });

    const result = await browser.tabs.sendMessage(
      activeTab.id,
      {
        data,
        isBlock: true,
        label: 'verify-selector',
      },
      { frameId: 0 }
    );

    return result;
  } catch (error) {
    console.error(error);
    await sleep(1000);

    return { notFound: true };
  } finally {
    await makeDashboardFocus();
  }
}

async function selectElement(name, targetTab = null, { signal } = {}) {
  const tab = targetTab || (await getActiveTab());
  const cancelled = () => new Error('Element selection cancelled');
  if (signal?.aborted) throw cancelled();

  await initElementSelector(tab);
  if (signal?.aborted) throw cancelled();

  const port = browser.tabs.connect(tab.id, { name, frameId: 0 });
  let onDisconnect;
  let onMessage;
  let onAbort;
  try {
    const selector = await new Promise((resolve, reject) => {
      onAbort = () => reject(cancelled());
      onDisconnect = () => {
        reject(new Error('Port closed'));
      };
      onMessage = resolve;
      port.onDisconnect.addListener(onDisconnect);
      port.onMessage.addListener(onMessage);
      signal?.addEventListener('abort', onAbort, { once: true });
      if (signal?.aborted) onAbort();
    });
    await makeDashboardFocus().catch(console.error);
    return selector;
  } finally {
    port.onDisconnect.removeListener(onDisconnect);
    port.onMessage.removeListener(onMessage);
    signal?.removeEventListener('abort', onAbort);
    port.disconnect();
  }
}

export default {
  selectElement,
  verifySelector,
};

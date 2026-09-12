import browser from 'webextension-polyfill';

const isMV2 = browser.runtime.getManifest().manifest_version === 2;
let starting = false;

const canRecord = (tab) =>
  /^https?:\/\//i.test(tab?.url || '') &&
  !/^https?:\/\/(chrome\.google\.com|chromewebstore\.google\.com)\//i.test(
    tab.url
  );

export default async function (options = {}, targetTabId = null) {
  if (starting) throw new Error('Recording is already starting');
  starting = true;
  let previous;
  let stateWritten = false;
  const injectedTabs = [];
  try {
    previous = await browser.storage.local.get(['isRecording', 'recording']);
    if (previous.isRecording)
      throw new Error('A recording is already in progress');
    const flows = [];
    const activeTab =
      targetTabId !== null
        ? await browser.tabs.get(targetTabId)
        : (
            await browser.tabs.query({
              active: true,
              lastFocusedWindow: true,
              url: '*://*/*',
            })
          )[0];

    if (targetTabId !== null && !canRecord(activeTab)) {
      throw new Error(
        'Browser Lab recording requires an accessible HTTP(S) tab'
      );
    }

    if (canRecord(activeTab)) {
      flows.push({
        id: 'new-tab',
        description: activeTab.url,
        data: { url: activeTab.url },
      });

      await browser.windows.update(activeTab.windowId, { focused: true });
    }

    await browser.storage.local.set({
      isRecording: true,
      recording: {
        flows,
        name: 'unnamed',
        activeTab: {
          id: activeTab?.id,
          url: activeTab?.url,
        },
        ...options,
      },
    });
    stateWritten = true;

    const action = browser.action || browser.browserAction;
    await action.setBadgeBackgroundColor({ color: '#ef4444' });
    await action.setBadgeText({ text: 'rec' });

    // Start on the requested tab before best-effort injection into other tabs.
    const tabs = [
      ...(activeTab ? [activeTab] : []),
      ...(await browser.tabs.query({})).filter(
        (tab) => tab.id !== activeTab?.id
      ),
    ];
    for (const tab of tabs.filter(canRecord)) {
      injectedTabs.push(tab.id);
      try {
        if (isMV2) {
          await browser.tabs.executeScript(tab.id, {
            allFrames: true,
            runAt: 'document_start',
            file: './recordWorkflow.bundle.js',
          });
        } else {
          await browser.scripting.executeScript({
            target: {
              tabId: tab.id,
              allFrames: true,
            },
            files: ['recordWorkflow.bundle.js'],
          });
        }
      } catch (error) {
        if (tab.id === activeTab?.id) throw error;
        console.warn(error);
      }
    }
  } catch (error) {
    if (stateWritten) {
      await browser.storage.local.remove(['isRecording', 'recording']);
      await browser.storage.local.set(previous);
      await (browser.action || browser.browserAction).setBadgeText({
        text: '',
      });
      await Promise.allSettled(
        injectedTabs.map((id) =>
          browser.tabs.sendMessage(id, { type: 'recording:stop' })
        )
      );
    }
    console.error(error);
    throw error;
  } finally {
    starting = false;
  }
}

import browser from 'webextension-polyfill';

let writes = Promise.resolve();

async function appendBlock(detail, save) {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return null;

  let addedBlock = detail;

  if (typeof detail === 'function') addedBlock = detail(recording);
  else recording.flows.push(detail);

  if (save) await browser.storage.local.set({ recording });

  return { recording, addedBlock };
}

export default function (detail, save = true) {
  const operation = writes.then(() => appendBlock(detail, save));
  writes = operation.catch(() => {});
  return operation;
}

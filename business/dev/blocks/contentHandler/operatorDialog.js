const pendingDialogs = new Map();

export default function operatorDialog({ data }) {
  const { promptId, mode } = data;
  if (data.cancel) {
    pendingDialogs.get(promptId)?.({ cancelled: true, value: null });
    return { cancelled: true };
  }
  if (!['messageBox', 'requestInput'].includes(mode) || !promptId) {
    throw new Error('Invalid operator dialog request');
  }
  if (pendingDialogs.has(promptId)) throw new Error('Operator dialog is already open');
  const remaining = Number(data.deadline) - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return { error: 'Operator interaction timed out', cancelled: true };
  }

  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      dialog { box-sizing: border-box; width: 440px; max-width: calc(100vw - 32px);
        max-height: calc(100vh - 32px); overflow: auto; border: 1px solid #777;
        border-radius: 8px; padding: 24px; background: #fff; color: #171717;
        font: 16px/1.5 system-ui, sans-serif; letter-spacing: 0; }
      dialog::backdrop { background: #0006; }
      h2 { margin: 0 0 12px; font-size: 20px; overflow-wrap: anywhere; }
      p { margin: 0 0 16px; white-space: pre-wrap; overflow-wrap: anywhere; }
      label { display: block; overflow-wrap: anywhere; }
      input { box-sizing: border-box; display: block; width: 100%; margin-top: 8px;
        padding: 8px; font: inherit; border: 1px solid #777; border-radius: 4px; }
      footer { display: flex; flex-wrap: wrap; justify-content: end; gap: 8px; margin-top: 20px; }
      button { padding: 8px 16px; font: inherit; cursor: pointer; border: 1px solid #777;
        border-radius: 4px; background: #f5f5f5; color: #171717; }
      button[type=submit] { background: #087c59; color: #fff; border-color: #087c59; }
    `;
    const dialog = document.createElement('dialog');
    const form = document.createElement('form');
    const title = document.createElement('h2');
    title.id = 'operator-title';
    title.textContent = data.title || 'Silverback Coding';
    dialog.setAttribute('aria-labelledby', title.id);
    const message = document.createElement('p');
    message.textContent = data.message || '';
    form.append(title, message);
    const input = document.createElement('input');
    if (mode === 'requestInput') {
      const label = document.createElement('label');
      label.textContent = data.inputName || 'Input';
      input.type = 'text';
      input.value = String(data.defaultValue ?? '');
      label.append(input);
      form.append(label);
    }
    const footer = document.createElement('footer');
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Continue';
    footer.append(cancel, submit);
    form.append(footer);
    dialog.append(form);
    shadow.append(style, dialog);

    let settled = false;
    let timer;
    let onCancel;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pendingDialogs.delete(promptId);
      window.removeEventListener('pagehide', onCancel);
      host.remove();
      resolve(result);
    };
    onCancel = () => finish({ cancelled: true, value: null });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      finish(mode === 'requestInput'
        ? { value: input.value, cancelled: false }
        : { shown: true, acknowledged: true });
    });
    cancel.addEventListener('click', onCancel);
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      onCancel();
    });
    dialog.addEventListener('close', onCancel);
    window.addEventListener('pagehide', onCancel);
    pendingDialogs.set(promptId, finish);
    timer = setTimeout(() => finish({ error: 'Operator interaction timed out', cancelled: true }), remaining);
    try {
      document.documentElement.append(host);
      dialog.showModal();
      (mode === 'requestInput' ? input : submit).focus();
    } catch (error) {
      clearTimeout(timer);
      pendingDialogs.delete(promptId);
      window.removeEventListener('pagehide', onCancel);
      host.remove();
      reject(error);
    }
  });
}

import { createModal } from './ui/components.js';
import { getRoot } from './root.ts';
import { saveDataToBackground } from './storage/index.ts';
import { t } from '../i18n.js';

declare const chrome: any;

const KEY = 'hermes_schedule_settings_ext';

interface ScheduleSettings {
  selected: string[];
  date: string;
  time: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
}

let settings: ScheduleSettings = {
  selected: [],
  date: '',
  time: '',
  recurrence: 'once'
};

let panel: HTMLElement | null = null;
let listDiv: HTMLElement | null = null;
let dateInput: HTMLInputElement | null = null;
let timeInput: HTMLInputElement | null = null;

export async function initSchedule() {
  const data = await new Promise<any>(res => chrome.storage.local.get([KEY], res));
  try {
    settings = data[KEY] ? JSON.parse(data[KEY]) : settings;
  } catch {
    settings = { selected: [], date: '', time: '', recurrence: 'once' };
  }
}

function persist() {
  const json = JSON.stringify(settings);
  chrome.storage.local.set({ [KEY]: json });
  chrome.storage.sync.set({ [KEY]: json }, () => {});
  saveDataToBackground(KEY, settings).catch(e => console.error('BG save fail', e));
}

function applySaved(repeatRadios: NodeListOf<HTMLInputElement>) {
  if (dateInput) dateInput.value = settings.date;
  if (timeInput) timeInput.value = settings.time;
  repeatRadios.forEach(r => r.checked = r.value === settings.recurrence);
}

function createPanel(root: HTMLElement | ShadowRoot): HTMLElement {
  const html = `
    <form id="hermes-schedule-form">
      <fieldset style="margin-bottom:10px;">
        <legend>${t('SELECT_MACROS')}</legend>
        <div id="hermes-schedule-list" style="max-height:30vh;overflow-y:auto;"></div>
      </fieldset>
      <div style="margin-bottom:8px;"><label>${t('DATE')} <input type="date" id="hermes-schedule-date" required></label></div>
      <div style="margin-bottom:8px;"><label>${t('TIME')} <input type="time" id="hermes-schedule-time" required></label></div>
      <fieldset style="margin-bottom:8px;">
        <legend>${t('REPEAT')}</legend>
        <label><input type="radio" name="hermes-schedule-repeat" value="once"> ${t('ONCE')}</label>
        <label><input type="radio" name="hermes-schedule-repeat" value="daily"> ${t('DAILY')}</label>
        <label><input type="radio" name="hermes-schedule-repeat" value="weekly"> ${t('WEEKLY')}</label>
        <label><input type="radio" name="hermes-schedule-repeat" value="monthly"> ${t('MONTHLY')}</label>
      </fieldset>
    </form>`;
  const btnHtml = `<button id="hermes-schedule-submit" class="hermes-button" style="background:var(--hermes-success-text);color:var(--hermes-panel-bg);">${t('SCHEDULE')}</button>`;
  const container = createModal(root, 'hermes-schedule-panel', t('SCHEDULE_MACROS'), html, '600px', btnHtml);
  panel = container;
  listDiv = container.querySelector('#hermes-schedule-list') as HTMLElement;
  dateInput = container.querySelector('#hermes-schedule-date') as HTMLInputElement;
  timeInput = container.querySelector('#hermes-schedule-time') as HTMLInputElement;
  const submitBtn = container.querySelector('#hermes-schedule-submit') as HTMLButtonElement;
  const repeatRadios = container.querySelectorAll('input[name="hermes-schedule-repeat"]') as NodeListOf<HTMLInputElement>;

  fetch('/api/macros').then(r => r.json()).then(list => {
    listDiv!.innerHTML = '';
    list.forEach((m: any) => {
      const label = document.createElement('label');
      label.style.display = 'block';
      label.innerHTML = `<input type="checkbox" value="${m.id}"> ${m.name}`;
      const cb = label.querySelector('input') as HTMLInputElement;
      if (settings.selected.includes(m.id)) cb.checked = true;
      listDiv!.appendChild(label);
    });
  }).catch(() => { listDiv!.textContent = t('LOAD_ERROR'); })
    .finally(() => applySaved(repeatRadios));

  if (submitBtn) submitBtn.onclick = async e => {
    e.preventDefault();
    const ids = Array.from(listDiv!.querySelectorAll('input:checked')).map(el => (el as HTMLInputElement).value);
    const recurrenceEl = container.querySelector('input[name="hermes-schedule-repeat"]:checked') as HTMLInputElement;
    settings = {
      selected: ids,
      date: dateInput!.value,
      time: timeInput!.value,
      recurrence: recurrenceEl ? recurrenceEl.value as any : 'once'
    };
    persist();
    for (const id of ids) {
      try {
        await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, date: settings.date, time: settings.time, recurrence: settings.recurrence })
        });
      } catch (err) {
        console.error('Hermes schedule error', err);
      }
    }
    if (panel) panel.style.display = 'none';
  };
  return container;
}

export function toggleSchedule(show: boolean) {
  const root = getRoot();
  if (!panel && show) panel = createPanel(root instanceof ShadowRoot ? root : document.body);
  if (panel) panel.style.display = show ? 'block' : 'none';
}

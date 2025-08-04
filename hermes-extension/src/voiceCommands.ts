import { fillForm, getInitialData } from './localCore.ts';

interface VoiceCommand {
  phrase: string;
  action: VoiceAction;
}

type VoiceAction = 'newTicket' | 'fillForm' | 'highPriority' | 'technicalSupport';

const DEFAULT_COMMANDS: VoiceCommand[] = [
  { phrase: 'new ticket', action: 'newTicket' },
  { phrase: 'fill form', action: 'fillForm' },
  { phrase: 'high priority', action: 'highPriority' },
  { phrase: 'technical support', action: 'technicalSupport' }
];

const STORAGE_KEY = 'hermes_voice_commands_ext';

let commands: VoiceCommand[] = [];

function loadCommands() {
  chrome.storage.local.get([STORAGE_KEY], data => {
    try {
      const stored = data[STORAGE_KEY] ? JSON.parse(data[STORAGE_KEY]) : null;
      commands = Array.isArray(stored) && stored.length ? stored : [...DEFAULT_COMMANDS];
    } catch {
      commands = [...DEFAULT_COMMANDS];
    }
  });
}

chrome.storage.onChanged.addListener(changes => {
  if (changes[STORAGE_KEY]) loadCommands();
});

function execute(action: VoiceAction) {
  switch (action) {
    case 'newTicket':
      newTicket();
      break;
    case 'fillForm':
      fillFormCommand();
      break;
    case 'highPriority':
      setHighPriority();
      break;
    case 'technicalSupport':
      setTechnicalSupport();
      break;
  }
}

function newTicket() {
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(f => {
    f.value = '';
  });
  const customer = document.querySelector<HTMLInputElement>(
    'input[name*="customer" i], input[id*="customer" i]'
  );
  if (customer) customer.focus();
}

async function fillFormCommand() {
  const data = await getInitialData();
  if (data && data.profileData) {
    await fillForm(data.profileData, { overwriteExisting: true });
  }
}

function setHighPriority() {
  const priority = document.querySelector<HTMLInputElement | HTMLSelectElement>(
    'select[name*="priority" i], input[name*="priority" i]'
  );
  if (priority) {
    if (priority.tagName === 'SELECT') {
      (priority as HTMLSelectElement).value = 'High';
    } else {
      (priority as HTMLInputElement).value = 'High';
    }
    priority.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function setTechnicalSupport() {
  const category = document.querySelector<HTMLInputElement | HTMLSelectElement>(
    'select[name*="category" i], input[name*="category" i]'
  );
  if (category) {
    if (category.tagName === 'SELECT') {
      (category as HTMLSelectElement).value = 'Technical support';
    } else {
      (category as HTMLInputElement).value = 'Technical support';
    }
    category.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

export function initVoiceCommands() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Hermes: Voice recognition not supported.');
    const msg = document.createElement('div');
    msg.textContent = 'Voice recognition unavailable in this browser.';
    msg.style.cssText =
      'position:fixed;bottom:10px;right:10px;background:rgba(0,0,0,0.6);color:#fff;padding:8px;z-index:2147483647;';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 5000);
    return;
  }

  loadCommands();

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const transcript = e.results[i][0].transcript.trim().toLowerCase();
        const cmd = commands.find(c => c.phrase.toLowerCase() === transcript);
        if (cmd) execute(cmd.action);
      }
    }
  };

  recognition.start();
}

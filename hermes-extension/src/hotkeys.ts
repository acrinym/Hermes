import { startRecording, stopRecording, playSelectedMacro, recording } from './macros.ts';
import { getSettings } from './settings.ts';

interface Hotkey {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

let recordHotkey: Hotkey | null = null;
let playHotkey: Hotkey | null = null;

function parseHotkey(str: string): Hotkey {
  const h: Hotkey = { key: '', ctrl: false, shift: false, alt: false, meta: false };
  str.split('+').map(p => p.trim().toLowerCase()).forEach(part => {
    if (part === 'ctrl' || part === 'control') h.ctrl = true;
    else if (part === 'shift') h.shift = true;
    else if (part === 'alt') h.alt = true;
    else if (part === 'meta' || part === 'cmd' || part === 'command') h.meta = true;
    else if (part) h.key = part;
  });
  return h;
}

function matches(e: KeyboardEvent, hotkey: Hotkey | null): boolean {
  if (!hotkey || !hotkey.key) return false;
  return e.key.toLowerCase() === hotkey.key &&
    !!e.ctrlKey === hotkey.ctrl &&
    !!e.shiftKey === hotkey.shift &&
    !!e.altKey === hotkey.alt &&
    !!e.metaKey === hotkey.meta;
}

function handle(e: KeyboardEvent) {
  if (matches(e, recordHotkey)) {
    e.preventDefault();
    e.stopPropagation();
    recording() ? stopRecording() : startRecording();
  } else if (matches(e, playHotkey)) {
    e.preventDefault();
    e.stopPropagation();
    playSelectedMacro();
  }
}

function updateFromSettings() {
  const s = getSettings();
  recordHotkey = parseHotkey(String(s.recordHotkey || 'Ctrl+Shift+R'));
  playHotkey = parseHotkey(String(s.playMacroHotkey || 'Ctrl+Shift+P'));
}

export function initHotkeys() {
  updateFromSettings();
  document.addEventListener('keydown', handle, true);
}

export function refreshHotkeys() {
  updateFromSettings();
}

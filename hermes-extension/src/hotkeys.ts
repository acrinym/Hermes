import { startRecording, stopRecording, playSelectedMacro, recording } from './macros.ts';
import { getSettings } from './settings.ts';

// Legacy -> new hotkey setting names 🎹
// Allows us to keep supporting older stored settings while
// moving toward the new structured `hotkeys` block.
export const legacyHotkeyNameMap: Record<string, string> = {
  recordHotkey: 'record',
  playMacroHotkey: 'play',
} as const;

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
  const hotkeyBlock = (s as any).hotkeys || {};

  // Read new names first, fall back to legacy ones 😊
  const record = hotkeyBlock[legacyHotkeyNameMap.recordHotkey] || s.recordHotkey;
  const play = hotkeyBlock[legacyHotkeyNameMap.playMacroHotkey] || s.playMacroHotkey;

  recordHotkey = parseHotkey(String(record || 'Ctrl+Shift+R'));
  playHotkey = parseHotkey(String(play || 'Ctrl+Shift+P'));
}

export function initHotkeys() {
  updateFromSettings();
  document.addEventListener('keydown', handle, true);
}

export function refreshHotkeys() {
  updateFromSettings();
}

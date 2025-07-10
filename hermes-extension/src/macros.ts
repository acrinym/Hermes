import { macroEngine } from './macroEngine.ts';
import { saveDataToBackground } from './storage/index.ts';

declare const chrome: any;

const SELECTED_KEY = 'hermes_selected_macro_ext';
let selectedMacro = '';
let isRecording = false;

export async function initMacros() {
  const data = await new Promise<any>(res => chrome.storage.local.get([SELECTED_KEY], res));
  selectedMacro = data[SELECTED_KEY] || '';
  await macroEngine.init();
}

export const startRecording = () => { isRecording = true; macroEngine.startRecording(); };
export const stopRecording = () => { isRecording = false; macroEngine.stopRecording(); };
export const recording = () => isRecording;

function persistSelected() {
  chrome.storage.local.set({ [SELECTED_KEY]: selectedMacro });
  chrome.storage.sync.set({ [SELECTED_KEY]: selectedMacro }, () => {});
  saveDataToBackground(SELECTED_KEY, selectedMacro).catch(e => console.error('Selected macro save fail', e));
}

export const playMacro = (name: string, instant = false) => {
  selectedMacro = name;
  persistSelected();
  macroEngine.play(name, instant);
};
export const playSelectedMacro = (instant = false) => {
  if (selectedMacro) macroEngine.play(selectedMacro, instant);
};
export const listMacros = () => macroEngine.list();
export const deleteMacro = (name: string) => macroEngine.delete(name);
export const setMacro = (name: string, events: any[]) => macroEngine.set(name, events);
export const getMacros = () => macroEngine.getAll();
export const getMacro = (name: string) => macroEngine.get(name);
export const renameMacro = (oldName: string, newName: string) => macroEngine.rename(oldName, newName);
export const importMacros = (obj: Record<string, any[]>) => macroEngine.import(obj);
export const importMacrosFromString = (data: string) => macroEngine.importFromString(data);
export const exportMacros = (format: 'json' | 'xml' = 'json', names?: string[]) =>
  macroEngine.exportMacros(format, names);
export const updateMacroSettings = (s: Partial<{
  recordMouseMoves: boolean;
  mouseMoveInterval: number;
  useCoordinateFallback: boolean;
  relativeCoordinates: boolean;
}>) => macroEngine.updateSettings(s);

export { selectedMacro };

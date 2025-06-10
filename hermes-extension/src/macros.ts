import { macroEngine } from './macroEngine.ts';

export async function initMacros() {
    await macroEngine.init();
}

export const startRecording = () => macroEngine.startRecording();
export const stopRecording = () => macroEngine.stopRecording();
export const playMacro = (name: string) => macroEngine.play(name);
export const listMacros = () => macroEngine.list();
export const deleteMacro = (name: string) => macroEngine.delete(name);
export const setMacro = (name: string, events: any[]) => macroEngine.set(name, events);
export const importMacros = (obj: Record<string, any[]>) => macroEngine.import(obj);
export const getMacros = () => macroEngine.getAll();
export const renameMacro = (oldName: string, newName: string) => macroEngine.rename(oldName, newName);
export const importMacrosFromString = (data: string) => macroEngine.importFromString(data);
export const exportMacros = (format: 'json' | 'xml' = 'json') => macroEngine.exportMacros(format);
export const updateMacroSettings = (s: Partial<{ recordMouseMoves: boolean; mouseMoveInterval: number; useCoordinateFallback: boolean; relativeCoordinates: boolean }>) => macroEngine.updateSettings(s);

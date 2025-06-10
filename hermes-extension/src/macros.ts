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

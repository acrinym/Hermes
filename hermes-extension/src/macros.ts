import { macroEngine } from './macroEngine.ts';

export async function initMacros() {
    await macroEngine.init();
}

export const startRecording = () => macroEngine.startRecording();
export const stopRecording = () => macroEngine.stopRecording();
export const playMacro = (name: string) => macroEngine.play(name);

let recording = false;
let events: any[] = [];

export function initMacros() {
  console.log('Hermes: macros initialized');
}

export function startRecording() {
  events = [];
  recording = true;
  console.log('Hermes: recording started');
}

export function stopRecording() {
  recording = false;
  console.log('Hermes: recording stopped', events);
}

export function playMacro() {
  console.log('Hermes: playing macro', events);
}

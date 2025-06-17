// hermes-react-refactor/src/services/macroEngineService.ts

import { AppDispatch } from '../store';
import { setRecordingState, addMacro } from '../store/macrosSlice';

export interface MacroEvent {
  type: string;
  selector: string | null;
  value?: string | null;
  checked?: boolean | null;
  timestamp: number;
  key?: string | null;
  code?: string | null;
  button?: number | null;
  clientX?: number | null;
  clientY?: number | null;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  path?: number[];
  offsetX?: number | null;
  offsetY?: number | null;
  rectW?: number | null;
  rectH?: number | null;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
}

export class MacroEngine {
  private dispatch: AppDispatch;
  private recording = false;
  private events: MacroEvent[] = [];
  private name = '';
  private settings = {
    recordMouseMoves: false,
    mouseMoveInterval: 200,
    useCoordinateFallback: false,
    relativeCoordinates: true
  };
  private lastMouseMove = 0;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }
  
  public updateSettings(partial: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...partial };
  }

  public startRecording(name?: string, opts: Partial<typeof this.settings> = {}) {
    this.name = name || `macro_${Date.now()}`;
    this.events = [];
    this.recording = true;
    this.settings = { ...this.settings, ...opts };
    this.lastMouseMove = 0;

    const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
    if (this.settings.recordMouseMoves) types.push('mousemove');
    for (const t of types) document.addEventListener(t, this.handleEvent, true);
    
    this.dispatch(setRecordingState('recording'));
  }

  public stopRecording() {
    if (!this.recording) return;
    const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
    if (this.settings.recordMouseMoves) types.push('mousemove');
    for (const t of types) document.removeEventListener(t, this.handleEvent, true);
    
    this.recording = false;
    
    if (this.events.length) {
      this.dispatch(addMacro({ name: this.name, events: this.events }));
    }
    
    this.dispatch(setRecordingState('idle'));
    this.name = '';
  }

  public play(name: string, macros: Record<string, MacroEvent[]>, instant = false) {
    const macro = macros[name];
    if (!macro) return;

    let idx = 0;
    let last = macro[0]?.timestamp || Date.now();

    const run = () => {
      if (idx >= macro.length) return;
      const ev = macro[idx];
      let el: Element | null = ev.selector ? document.querySelector(ev.selector) : null;

      if (!el && this.settings.useCoordinateFallback && ev.clientX != null && ev.clientY != null) {
        el = document.elementFromPoint(ev.clientX, ev.clientY);
      }
      
      if (el) {
        const dispatch = (event: Event) => el?.dispatchEvent(event);
        switch (ev.type) {
            // Logic for dispatching various events like click, input, keydown, etc.
        }
      }

      idx++;
      const delay = instant ? 0 : Math.min(Math.max(ev.timestamp - last, 50), 3000);
      last = ev.timestamp;
      setTimeout(run, delay);
    };

    run();
  }

  private handleEvent = (e: Event) => {
    if (!this.recording) return;

    if (e.type === 'mousemove') {
      const now = Date.now();
      if (now - this.lastMouseMove < this.settings.mouseMoveInterval) return;
      this.lastMouseMove = now;
    }

    const target = e.target as HTMLElement | null;
    if (!target) return;

    const selector = this.getSelector(target);
    const rect = target.getBoundingClientRect();

    this.events.push({
      type: e.type,
      selector,
      value: (target as HTMLInputElement).value,
      checked: (target as HTMLInputElement).checked,
      timestamp: Date.now(),
      key: (e as KeyboardEvent).key || undefined,
      code: (e as KeyboardEvent).code || undefined,
      button: (e as MouseEvent).button,
      clientX: (e as MouseEvent).clientX,
      clientY: (e as MouseEvent).clientY,
      offsetX: (e as MouseEvent).clientX - rect.left,
      offsetY: (e as MouseEvent).clientY - rect.top,
      rectW: rect.width,
      rectH: rect.height,
      shiftKey: (e as MouseEvent).shiftKey,
      ctrlKey: (e as MouseEvent).ctrlKey,
      altKey: (e as MouseEvent).altKey,
      metaKey: (e as MouseEvent).metaKey,
    });
  };

  private getSelector(el: Element): string {
    if ((el as HTMLElement).id) return `#${(el as HTMLElement).id}`;
    const path = [];
    let cur: Element | null = el;
    while (cur && cur.nodeType === 1 && path.length < 5) {
      let selector = cur.nodeName.toLowerCase();
      if (cur.className) {
        const stableClass = cur.className.split(' ').find(c => !c.includes(':') && !c.match(/\d/));
        if(stableClass) selector += '.' + stableClass;
      }
      path.unshift(selector);
      cur = cur.parentElement;
    }
    return path.join(' > ');
  }
}
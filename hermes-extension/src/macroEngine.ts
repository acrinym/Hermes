import { saveDataToBackground, getInitialData } from './storage/index.ts';
import { addDebugLog } from './debug.ts';

interface MacroEvent {
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
}

export class MacroEngine {
    private macros: Record<string, MacroEvent[]> = {};
    private recording = false;
    private events: MacroEvent[] = [];
    private name = '';
    private recordMouseMoves = false;
    private mouseMoveInterval = 200;
    private lastMouseMove = 0;
    private useCoordinateFallback = false;

    async init() {
        const data = await getInitialData();
        if (data && data.macros) {
            this.macros = data.macros;
        }
        if (data && data.settings) {
            this.useCoordinateFallback = !!data.settings.macro?.useCoordinateFallback;
        }
        console.log('Hermes: macro engine ready');
    }

    startRecording(name?: string, opts: { recordMouseMoves?: boolean; mouseMoveInterval?: number } = {}) {
        this.name = name || `macro_${Date.now()}`;
        this.events = [];
        this.recording = true;
        this.recordMouseMoves = !!opts.recordMouseMoves;
        if (opts.mouseMoveInterval !== undefined) this.mouseMoveInterval = opts.mouseMoveInterval;
        this.lastMouseMove = 0;
        addDebugLog('macro_start', null, { name: this.name });
        const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
        if (this.recordMouseMoves) types.push('mousemove');
        for (const t of types) document.addEventListener(t, this.handleEvent, true);
    }

    stopRecording() {
        if (!this.recording) return;
        const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
        if (this.recordMouseMoves) types.push('mousemove');
        for (const t of types) document.removeEventListener(t, this.handleEvent, true);
        this.recording = false;
        if (this.events.length) {
            this.macros[this.name] = this.events;
            this.saveMacros();
        }
        addDebugLog('macro_stop', null, { name: this.name, count: this.events.length });
        this.name = '';
    }

    play(name: string, instant = false) {
        const macro = this.macros[name];
        if (!macro) return;
        let idx = 0;
        let last = macro[0]?.timestamp || Date.now();
        const run = () => {
            if (idx >= macro.length) return;
            const ev = macro[idx];
            let el: Element | null = ev.selector ? document.querySelector(ev.selector) : null;
            if (!el && this.useCoordinateFallback && ev.path) {
                let cur: Element | null = document.body;
                for (const i of ev.path) {
                    if (!cur || !cur.children[i]) { cur = null; break; }
                    cur = cur.children[i];
                }
                el = cur;
            }
            if (!el && this.useCoordinateFallback && ev.clientX !== null && ev.clientY !== null) {
                el = document.elementFromPoint(ev.clientX!, ev.clientY!);
            }
            if (el) {
                if (['click','mousedown','mouseup'].includes(ev.type)) {
                    const me = new MouseEvent(ev.type, { bubbles:true, cancelable:true, clientX:ev.clientX||0, clientY:ev.clientY||0, button:ev.button||0, shiftKey:!!ev.shiftKey, ctrlKey:!!ev.ctrlKey, altKey:!!ev.altKey, metaKey:!!ev.metaKey });
                    el.dispatchEvent(me);
                } else if (ev.type === 'mousemove') {
                    const me = new MouseEvent('mousemove', { bubbles:true, cancelable:true, clientX:ev.clientX||0, clientY:ev.clientY||0 });
                    el.dispatchEvent(me);
                } else if (ev.type === 'input' || ev.type === 'change') {
                    (el as HTMLInputElement).value = ev.value || '';
                    el.dispatchEvent(new Event('input', { bubbles:true }));
                } else if (ev.type.startsWith('key')) {
                    const ke = new KeyboardEvent(ev.type, { bubbles:true, cancelable:true, key:ev.key||'', code:ev.code||'', shiftKey:!!ev.shiftKey, ctrlKey:!!ev.ctrlKey, altKey:!!ev.altKey, metaKey:!!ev.metaKey });
                    el.dispatchEvent(ke);
                } else if (ev.type === 'focusin') {
                    (el as HTMLElement).focus();
                } else if (ev.type === 'focusout') {
                    (el as HTMLElement).blur();
                } else if (ev.type === 'submit') {
                    (el as HTMLFormElement).submit();
                }
                addDebugLog('macro_play', ev.selector || '', { type: ev.type });
            }
            idx++;
            const delay = Math.min(Math.max(ev.timestamp - last, 50), 3000);
            last = ev.timestamp;
            if (instant) {
                run();
            } else {
                setTimeout(run, delay);
            }
        };
        run();
    }

    list(): string[] {
        return Object.keys(this.macros);
    }

    get(name: string): MacroEvent[] | undefined {
        return this.macros[name];
    }

    async set(name: string, events: MacroEvent[]): Promise<boolean> {
        this.macros[name] = events;
        return this.saveMacros();
    }

    async delete(name: string): Promise<boolean> {
        if (!(name in this.macros)) return false;
        delete this.macros[name];
        return this.saveMacros();
    }

    async import(obj: Record<string, MacroEvent[]>): Promise<boolean> {
        this.macros = { ...this.macros, ...obj };
        return this.saveMacros();
    }

    getAll(): Record<string, MacroEvent[]> {
        return { ...this.macros };
    }

    private async saveMacros(): Promise<boolean> {
        try {
            await saveDataToBackground('hermes_macros_ext', this.macros);
            return true;
        } catch (e) {
            console.error('Hermes CS: Failed to save macros', e);
            return false;
        }
    }

    private handleEvent = (e: Event) => {
        if (!this.recording) return;
        if (e.type === 'mousemove') {
            const now = Date.now();
            if (now - this.lastMouseMove < this.mouseMoveInterval) return;
            this.lastMouseMove = now;
        }
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const selector = this.getSelector(target);
        const val = (target as HTMLInputElement).value;
        const checked = (target as HTMLInputElement).checked;
        const path = this.getIndexPath(target);
        this.events.push({
            type: e.type,
            selector,
            value: val,
            checked,
            timestamp: Date.now(),
            key: (e as KeyboardEvent).key || null,
            code: (e as KeyboardEvent).code || null,
            button: (e as MouseEvent).button !== undefined ? (e as MouseEvent).button : null,
            clientX: (e as MouseEvent).clientX !== undefined ? (e as MouseEvent).clientX : null,
            clientY: (e as MouseEvent).clientY !== undefined ? (e as MouseEvent).clientY : null,
            shiftKey: (e as MouseEvent).shiftKey || (e as KeyboardEvent).shiftKey || false,
            ctrlKey: (e as MouseEvent).ctrlKey || (e as KeyboardEvent).ctrlKey || false,
            altKey: (e as MouseEvent).altKey || (e as KeyboardEvent).altKey || false,
            metaKey: (e as MouseEvent).metaKey || (e as KeyboardEvent).metaKey || false,
            path
        });
        addDebugLog('macro_record', selector, { type: e.type });
    };

    private getSelector(el: Element): string {
        if ((el as HTMLElement).id) return `#${(el as HTMLElement).id}`;
        const path = [] as string[];
        let cur: Element | null = el;
        while (cur && cur.nodeType === 1 && path.length < 4) {
            let selector = cur.nodeName.toLowerCase();
            if (cur.className) selector += '.' + cur.className.split(' ')[0];
            path.unshift(selector);
            cur = cur.parentElement;
        }
        return path.join('>');
    }

    private getIndexPath(el: Element): number[] {
        const path: number[] = [];
        let cur: Element | null = el;
        while (cur && cur !== document.body) {
            const parent = cur.parentElement;
            if (!parent) break;
            path.unshift(Array.from(parent.children).indexOf(cur));
            cur = parent;
        }
        return path;
    }
}

export const macroEngine = new MacroEngine();

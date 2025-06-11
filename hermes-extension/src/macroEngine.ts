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
    offsetX?: number | null;
    offsetY?: number | null;
    rectW?: number | null;
    rectH?: number | null;
}

export class MacroEngine {
    private macros: Record<string, MacroEvent[]> = {};
    private recording = false;
    private events: MacroEvent[] = [];
    private name = '';
    private settings = {
        recordMouseMoves: false,
        mouseMoveInterval: 200,
        useCoordinateFallback: false,
        relativeCoordinates: true
    };
    private recordMouseMoves = false;
    private mouseMoveInterval = 200;
    private lastMouseMove = 0;

    async init() {
        const data = await getInitialData();
        if (data && data.macros) {
            this.macros = data.macros;
        }
        console.log('Hermes: macro engine ready');
    }

    updateSettings(partial: Partial<typeof this.settings>) {
        this.settings = { ...this.settings, ...partial };
    }

    startRecording(name?: string, opts: Partial<typeof this.settings> = {}) {
        this.name = name || `macro_${Date.now()}`;
        this.events = [];
        this.recording = true;
        this.recordMouseMoves = opts.recordMouseMoves ?? this.settings.recordMouseMoves;
        this.mouseMoveInterval = opts.mouseMoveInterval ?? this.settings.mouseMoveInterval;
        this.lastMouseMove = 0;

        const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
        if (this.recordMouseMoves) types.push('mousemove');
        for (const t of types) document.addEventListener(t, this.handleEvent, true);

        addDebugLog('macro_start', null, { name: this.name });
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

            if (!el && this.settings.useCoordinateFallback && ev.path) {
                let cur: Element | null = document.body;
                for (const i of ev.path) {
                    if (!cur?.children[i]) { cur = null; break; }
                    cur = cur.children[i];
                }
                el = cur;
            }

            if (!el && this.settings.useCoordinateFallback && ev.clientX !== null && ev.clientY !== null) {
                el = document.elementFromPoint(ev.clientX!, ev.clientY!);
            }

            if (el) {
                const rect = (el as HTMLElement).getBoundingClientRect();
                const coords = this.settings.relativeCoordinates && ev.offsetX !== null && ev.offsetY !== null
                    ? {
                        x: rect.left + (ev.rectW && rect.width ? ev.offsetX * (rect.width / ev.rectW) : ev.offsetX),
                        y: rect.top + (ev.rectH && rect.height ? ev.offsetY * (rect.height / ev.rectH) : ev.offsetY)
                    }
                    : { x: ev.clientX || rect.left, y: ev.clientY || rect.top };

                const dispatch = (event: Event) => el?.dispatchEvent(event);

                switch (ev.type) {
                    case 'click':
                    case 'mousedown':
                    case 'mouseup':
                        dispatch(new MouseEvent(ev.type, {
                            bubbles: true, cancelable: true,
                            clientX: coords.x, clientY: coords.y,
                            button: ev.button || 0,
                            shiftKey: !!ev.shiftKey, ctrlKey: !!ev.ctrlKey,
                            altKey: !!ev.altKey, metaKey: !!ev.metaKey
                        }));
                        break;
                    case 'mousemove':
                        dispatch(new MouseEvent('mousemove', {
                            bubbles: true, cancelable: true,
                            clientX: coords.x, clientY: coords.y
                        }));
                        break;
                    case 'input':
                    case 'change':
                        (el as HTMLInputElement).value = ev.value || '';
                        dispatch(new Event('input', { bubbles: true }));
                        break;
                    case 'keydown':
                    case 'keyup':
                        dispatch(new KeyboardEvent(ev.type, {
                            bubbles: true, cancelable: true,
                            key: ev.key || '', code: ev.code || '',
                            shiftKey: !!ev.shiftKey, ctrlKey: !!ev.ctrlKey,
                            altKey: !!ev.altKey, metaKey: !!ev.metaKey
                        }));
                        break;
                    case 'focusin': (el as HTMLElement).focus(); break;
                    case 'focusout': (el as HTMLElement).blur(); break;
                    case 'submit': (el as HTMLFormElement).submit(); break;
                }

                addDebugLog('macro_play', ev.selector || '', { type: ev.type });
            }

            idx++;
            const delay = instant ? 0 : Math.min(Math.max(ev.timestamp - last, 50), 3000);
            last = ev.timestamp;
            setTimeout(run, delay);
        };

        run();
    }

    list() { return Object.keys(this.macros); }
    get(name: string) { return this.macros[name]; }
    getAll() { return { ...this.macros }; }

    async set(name: string, events: MacroEvent[]) {
        this.macros[name] = events;
        return this.saveMacros();
    }

    async delete(name: string) {
        if (!(name in this.macros)) return false;
        delete this.macros[name];
        return this.saveMacros();
    }

    async rename(oldName: string, newName: string) {
        if (!(oldName in this.macros)) return false;
        if (oldName === newName) return true;
        this.macros[newName] = this.macros[oldName];
        delete this.macros[oldName];
        return this.saveMacros();
    }

    async import(obj: Record<string, MacroEvent[]>) {
        this.macros = { ...this.macros, ...obj };
        return this.saveMacros();
    }

    exportMacros(format: 'json' | 'xml' = 'json'): string {
        if (format === 'xml') {
            const doc = document.implementation.createDocument('', 'macros', null);
            const root = doc.documentElement;
            for (const [name, events] of Object.entries(this.macros)) {
                const macroEl = doc.createElement('macro');
                macroEl.setAttribute('name', name);
                for (const ev of events) {
                    const evEl = doc.createElement('event');
                    for (const [k, v] of Object.entries(ev)) {
                        if (v === undefined || v === null) continue;
                        evEl.setAttribute(k, Array.isArray(v) ? v.join(',') : String(v));
                    }
                    macroEl.appendChild(evEl);
                }
                root.appendChild(macroEl);
            }
            return new XMLSerializer().serializeToString(doc);
        }
        return JSON.stringify(this.macros, null, 2);
    }

    async importFromString(data: string): Promise<boolean> {
        try {
            data = data.trim();
            if (!data) return false;
            const obj = JSON.parse(data);
            return this.import(obj);
        } catch {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'application/xml');
                const macroNodes = Array.from(doc.querySelectorAll('macro'));
                const obj: Record<string, MacroEvent[]> = {};
                for (const macroNode of macroNodes) {
                    const name = macroNode.getAttribute('name');
                    if (!name) continue;
                    const evs: MacroEvent[] = [];
                    for (const evNode of macroNode.querySelectorAll('event')) {
                        const ev: any = {};
                        for (const attr of evNode.attributes) {
                            let val: any = attr.value;
                            if (['timestamp','clientX','clientY','button'].includes(attr.name)) val = parseInt(val, 10);
                            else if (['checked','shiftKey','ctrlKey','altKey','metaKey'].includes(attr.name)) val = val === 'true';
                            else if (attr.name === 'path') val = val.split(',').map(n => parseInt(n, 10));
                            ev[attr.name] = val;
                        }
                        evs.push(ev);
                    }
                    obj[name] = evs;
                }
                return this.import(obj);
            } catch (err) {
                console.error('Hermes: Failed to import macros from string', err);
                return false;
            }
        }
    }

    private async saveMacros() {
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
        const rect = target.getBoundingClientRect();
        const path = this.getIndexPath(target);

        this.events.push({
            type: e.type,
            selector,
            value: val,
            checked,
            timestamp: Date.now(),
            key: (e as KeyboardEvent).key || null,
            code: (e as KeyboardEvent).code || null,
            button: (e as MouseEvent).button ?? null,
            clientX: (e as MouseEvent).clientX ?? null,
            clientY: (e as MouseEvent).clientY ?? null,
            offsetX: (e as MouseEvent).clientX !== undefined ? (e as MouseEvent).clientX - rect.left : null,
            offsetY: (e as MouseEvent).clientY !== undefined ? (e as MouseEvent).clientY - rect.top : null,
            rectW: rect.width,
            rectH: rect.height,
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
        const path = [];
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
-
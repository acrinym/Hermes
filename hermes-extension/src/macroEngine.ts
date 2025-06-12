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
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
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
    private lastMouseMove = 0;
    private origFetch: typeof window.fetch | null = null;
    private origXhrSend: ((body?: any) => any) | null = null;
    private origXhrOpen: ((method: string, url: string) => any) | null = null;
    private origXhrSetHeader: ((name: string, value: string) => any) | null = null;

    async init() {
        const data = await getInitialData();
        if (data?.macros) this.macros = data.macros;
        if (data?.settings) {
            this.settings.useCoordinateFallback = !!data.settings.macro?.useCoordinateFallback;
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
        this.settings = { ...this.settings, ...opts };
        this.lastMouseMove = 0;

        const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
        if (this.settings.recordMouseMoves) types.push('mousemove');
        for (const t of types) document.addEventListener(t, this.handleEvent, true);

        // monkey patch network requests
        this.origFetch = window.fetch;
        const self = this;
        window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
            if (self.recording) {
                const url = typeof input === 'string' ? input : (input as Request).url;
                const method = init?.method || (input instanceof Request ? input.method : 'GET');
                let body: string | null = null;
                if (init?.body && typeof init.body === 'string') body = init.body;
                const headersObj: Record<string, string> = {};
                const headers = init?.headers || (input instanceof Request ? (input as Request).headers : undefined);
                if (headers instanceof Headers) {
                    headers.forEach((v, k) => { headersObj[k] = v; });
                } else if (headers && typeof headers === 'object') {
                    Object.entries(headers as Record<string, string>).forEach(([k, v]) => { headersObj[k] = v as string; });
                }
                self.events.push({ type: 'fetch', selector: null, timestamp: Date.now(), url, method, body, headers: headersObj });
            }
            return self.origFetch!.apply(this, arguments as any);
        };

        this.origXhrOpen = XMLHttpRequest.prototype.open;
        this.origXhrSend = XMLHttpRequest.prototype.send;
        this.origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;
        XMLHttpRequest.prototype.open = function(method: string, url: string) {
            (this as any).__hermesMethod = method;
            (this as any).__hermesUrl = url;
            (this as any).__hermesHeaders = {};
            return self.origXhrOpen!.apply(this, arguments as any);
        };
        XMLHttpRequest.prototype.setRequestHeader = function(name: string, value: string) {
            (this as any).__hermesHeaders = (this as any).__hermesHeaders || {};
            (this as any).__hermesHeaders[name] = value;
            return self.origXhrSetHeader!.apply(this, arguments as any);
        };
        XMLHttpRequest.prototype.send = function(body?: Document | BodyInit | null) {
            if (self.recording) {
                const url = (this as any).__hermesUrl;
                const method = (this as any).__hermesMethod;
                const headers = (this as any).__hermesHeaders || {};
                const bodyStr = typeof body === 'string' ? body : null;
                self.events.push({ type: 'xhr', selector: null, timestamp: Date.now(), url, method, body: bodyStr, headers });
            }
            return self.origXhrSend!.apply(this, arguments as any);
        };

        addDebugLog('macro_start', null, { name: this.name });
    }

    stopRecording() {
        if (!this.recording) return;
        const types = ['click','input','change','mousedown','mouseup','keydown','keyup','focusin','focusout','submit'];
        if (this.settings.recordMouseMoves) types.push('mousemove');
        for (const t of types) document.removeEventListener(t, this.handleEvent, true);
        if (this.origFetch) {
            window.fetch = this.origFetch;
            this.origFetch = null;
        }
        if (this.origXhrOpen) {
            XMLHttpRequest.prototype.open = this.origXhrOpen;
            this.origXhrOpen = null;
        }
        if (this.origXhrSend) {
            XMLHttpRequest.prototype.send = this.origXhrSend;
            this.origXhrSend = null;
        }
        if (this.origXhrSetHeader) {
            XMLHttpRequest.prototype.setRequestHeader = this.origXhrSetHeader;
            this.origXhrSetHeader = null;
        }
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

            if (ev.type === 'fetch') {
                fetch(ev.url!, { method: ev.method, headers: ev.headers, body: ev.body })
                    .finally(() => {
                        idx++;
                        const delay = instant ? 0 : Math.min(Math.max(ev.timestamp - last, 50), 3000);
                        last = ev.timestamp;
                        setTimeout(run, delay);
                    });
                return;
            }

            if (ev.type === 'xhr') {
                const xhr = new XMLHttpRequest();
                xhr.open(ev.method || 'GET', ev.url || '');
                if (ev.headers) {
                    for (const [k, v] of Object.entries(ev.headers)) {
                        try { xhr.setRequestHeader(k, v); } catch {}
                    }
                }
                xhr.onloadend = () => {
                    idx++;
                    const delay = instant ? 0 : Math.min(Math.max(ev.timestamp - last, 50), 3000);
                    last = ev.timestamp;
                    setTimeout(run, delay);
                };
                xhr.send(ev.body || null);
                return;
            }
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
            if (now - this.lastMouseMove < this.settings.mouseMoveInterval) return;
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

import { saveDataToBackground, getInitialData } from './storage/index.ts';

interface MacroEvent {
    type: string;
    selector: string;
    value?: string | null;
    checked?: boolean | null;
    timestamp: number;
}

export class MacroEngine {
    private macros: Record<string, MacroEvent[]> = {};
    private recording = false;
    private events: MacroEvent[] = [];
    private name = '';

    async init() {
        const data = await getInitialData();
        if (data && data.macros) {
            this.macros = data.macros;
        }
        console.log('Hermes: macro engine ready');
    }

    startRecording(name?: string) {
        this.name = name || `macro_${Date.now()}`;
        this.events = [];
        this.recording = true;
        document.addEventListener('click', this.handleEvent, true);
        document.addEventListener('input', this.handleEvent, true);
    }

    stopRecording() {
        if (!this.recording) return;
        document.removeEventListener('click', this.handleEvent, true);
        document.removeEventListener('input', this.handleEvent, true);
        this.recording = false;
        if (this.events.length) {
            this.macros[this.name] = this.events;
            saveDataToBackground('hermes_macros_ext', this.macros);
        }
        this.name = '';
    }

    play(name: string) {
        const macro = this.macros[name];
        if (!macro) return;
        for (const ev of macro) {
            const el = document.querySelector(ev.selector) as HTMLInputElement | null;
            if (!el) continue;
            if (ev.type === 'click') {
                (el as HTMLElement).click();
            } else if (ev.type === 'input' || ev.type === 'change') {
                el.value = ev.value || '';
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    private handleEvent = (e: Event) => {
        if (!this.recording) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const selector = this.getSelector(target);
        const val = (target as HTMLInputElement).value;
        const checked = (target as HTMLInputElement).checked;
        this.events.push({ type: e.type, selector, value: val, checked, timestamp: Date.now() });
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
}

export const macroEngine = new MacroEngine();

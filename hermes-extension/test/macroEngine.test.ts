import { MacroEngine } from '../src/localCore';

beforeAll(() => {
  (global as any).chrome = {
    runtime: {
      sendMessage: (_: any, cb?: (resp: any) => void) => { if (cb) cb({ success: true }); }
    }
  };
});

afterAll(() => {
  delete (global as any).chrome;
});

describe('MacroEngine', () => {
  test('play applies events to the DOM', async () => {
    const engine = new MacroEngine();
    (engine as any).macros = {
      demo: [
        { type: 'input', selector: '#name', value: 'John', timestamp: 0 },
        { type: 'click', selector: '#btn', timestamp: 0 }
      ]
    } as any;

    document.body.innerHTML = '<input id="name"/><button id="btn"></button>';
    const clickSpy = jest.fn();
    document.getElementById('btn')!.addEventListener('click', clickSpy);

    engine.play('demo', true);
    await new Promise(res => setTimeout(res, 0));

    const input = document.getElementById('name') as HTMLInputElement;
    expect(input.value).toBe('John');
    expect(clickSpy).toHaveBeenCalled();
  });

  test('set, list and delete macros', async () => {
    const engine = new MacroEngine();
    await engine.set('m1', [{ type: 'click', selector: '#a', timestamp: 0 } as any]);
    expect(engine.list()).toContain('m1');
    expect(engine.get('m1')?.length).toBe(1);
    await engine.delete('m1');
    expect(engine.list()).not.toContain('m1');
  });

  test('rename and export/import macros in json and xml', async () => {
    const engine = new MacroEngine();
    await engine.set('m1', [{ type: 'click', selector: '#a', timestamp: 0 } as any]);
    await engine.rename('m1', 'renamed');
    expect(engine.list()).toContain('renamed');
    expect(engine.get('m1')).toBeUndefined();

    const json = engine.exportMacros('json');
    const engineJson = new MacroEngine();
    await engineJson.importFromString(json);
    expect(engineJson.get('renamed')?.length).toBe(1);

    const xml = engine.exportMacros('xml');
    const engineXml = new MacroEngine();
    await engineXml.importFromString(xml);
    expect(engineXml.get('renamed')?.length).toBe(1);
  });

  test('exportMacros can export a subset of macros', async () => {
    const engine = new MacroEngine();
    await engine.set('a', [{ type: 'click', selector: '#a', timestamp: 0 } as any]);
    await engine.set('b', [{ type: 'click', selector: '#b', timestamp: 0 } as any]);
    const json = engine.exportMacros('json', ['b']);
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed)).toEqual(['b']);
  });

  test('relative coordinates adjust to element position', () => {
    const engine = new MacroEngine();
    engine.updateSettings({ useCoordinateFallback: true, relativeCoordinates: true });
    (engine as any).macros = {
      demo: [
        { type: 'click', selector: '#btn', timestamp: 0, offsetX: 10, offsetY: 5, rectW: 100, rectH: 50 }
      ]
    } as any;
    document.body.innerHTML = '<button id="btn" style="position:absolute;left:50px;top:40px;width:100px;height:50px;"></button>';
    const btn = document.getElementById('btn') as HTMLButtonElement;
    btn.getBoundingClientRect = jest.fn(() => ({ left: 50, top: 40, width: 100, height: 50, right: 150, bottom: 90 } as any));
    const spy = jest.fn();
    btn.addEventListener('click', (e: MouseEvent) => spy((e as MouseEvent).clientX, (e as MouseEvent).clientY));
    engine.play('demo', true);
    expect(spy).toHaveBeenCalledWith(60, 45);
  });

});

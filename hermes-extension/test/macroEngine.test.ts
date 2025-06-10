import { MacroEngine } from '../src/macroEngine.ts';

describe('MacroEngine', () => {
  test('play applies events to the DOM', () => {
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
});

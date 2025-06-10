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

    engine.play('demo');

    const input = document.getElementById('name') as HTMLInputElement;
    expect(input.value).toBe('John');
    expect(clickSpy).toHaveBeenCalled();
  });
});

import { checkOnboarding } from '../src/onboarding.ts';
import { setRoot } from '../src/root.ts';

describe('onboarding', () => {
  beforeEach(() => {
    (global as any).chrome = {
      storage: { local: { get: (_: any, cb: (data: any) => void) => cb({}) } }
    };
    document.documentElement.innerHTML = '<body></body>';
    document.body.innerHTML = '';
    setRoot(document as any);
  });

  afterEach(() => {
    delete (global as any).chrome;
  });

  test('shows panel when not onboarded', async () => {
    checkOnboarding();
    await new Promise(res => setTimeout(res, 0));
    const panel = document.getElementById('hermes-onboard-panel');
    expect(panel).not.toBeNull();
    expect(panel?.style.display).toBe('block');
  });
});

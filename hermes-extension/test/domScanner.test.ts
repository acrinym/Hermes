import { scanDOM } from '../src/domScanner.ts';

describe('DOM Scanner', () => {
  test('detects fields and buttons', () => {
    document.body.innerHTML = `
      <form>
        <input id="first" name="first" />
        <textarea id="bio"></textarea>
        <button id="submit">Submit</button>
      </form>`;

    const result = scanDOM();
    expect(result.fields.some(sel => sel.includes('#first'))).toBe(true);
    expect(result.fields.some(sel => sel.includes('#bio'))).toBe(true);
    expect(result.buttons.some(sel => sel.includes('#submit'))).toBe(true);
    expect(result.viewport.width).toBeGreaterThan(0);
  });
});

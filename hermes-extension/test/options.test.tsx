import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { OptionsApp } from '../src/options.tsx';

const THEME_KEY = 'hermes_theme_ext';
const CUSTOM_THEMES_KEY = 'hermes_custom_themes_ext';

describe('OptionsApp', () => {
  beforeEach(() => {
    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
  });

  afterEach(() => {
    delete (global as any).chrome;
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders themes and saves selection', () => {
    const data = {
      [THEME_KEY]: 'dark',
      hermes_built_in_themes: JSON.stringify({ dark: { name: 'Dark', emoji: '\u{1F311}' } }),
      [CUSTOM_THEMES_KEY]: JSON.stringify({ custom: { name: 'Custom', emoji: '\u{1F3A8}' } })
    };
    (global as any).chrome.storage.local.get.mockImplementation((_k, cb) => cb(data));

    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      const root = createRoot(container);
      root.render(React.createElement(OptionsApp as any));
    });

    const select = container.querySelector('#themeSelect') as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.value).toBe('dark');

    act(() => {
      select.value = 'custom';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect((global as any).chrome.storage.local.set).toHaveBeenCalledWith({ [THEME_KEY]: 'custom' });
  });

  test('imports themes from file', () => {
    const data = {
      [THEME_KEY]: 'dark',
      hermes_built_in_themes: '{}',
      [CUSTOM_THEMES_KEY]: '{}'
    };
    (global as any).chrome.storage.local.get.mockImplementation((_k, cb) => cb(data));
    (global as any).chrome.storage.local.set.mockImplementation((_d, cb) => cb && cb());

    class FakeFileReader {
      result: string = '';
      onload: (() => void) | null = null;
      readAsText(_file: File) {
        this.result = JSON.stringify({ newTheme: { name: 'New', emoji: '\u{1F195}' } });
        this.onload && this.onload();
      }
    }
    (global as any).FileReader = FakeFileReader;

    const container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      const root = createRoot(container);
      root.render(React.createElement(OptionsApp as any));
    });

    const input = container.querySelector('#importFile') as HTMLInputElement;
    const file = new File(['dummy'], 'themes.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect((global as any).chrome.storage.local.set).toHaveBeenCalledWith(
      { [CUSTOM_THEMES_KEY]: JSON.stringify({ newTheme: { name: 'New', emoji: '\u{1F195}' } }) },
      expect.any(Function)
    );
  });
});

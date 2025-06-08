// ==UserScript==
// @name         Grok Chat Toolbar
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a floating toolbar to Grok.com and x.com/i/grok for quick message sending.
// @author       YourName
// @match        https://grok.com/*
// @match        https://x.com/i/grok*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const toolbarStyles = `
        #grok-toolbar {
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px;
            border-radius: 4px;
            z-index: 9999;
            font-family: sans-serif;
        }
        #grok-toolbar textarea {
            width: 200px;
            height: 50px;
            resize: vertical;
            margin-bottom: 4px;
        }
        #grok-toolbar button {
            display: block;
            width: 100%;
            margin-top: 4px;
        }
    `;

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = toolbarStyles;
        document.head.appendChild(style);
    }

    function createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'grok-toolbar';

        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Ask Grok...';
        toolbar.appendChild(textarea);

        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send to Grok';
        toolbar.appendChild(sendBtn);

        sendBtn.addEventListener('click', () => {
            sendMessage(textarea.value);
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(textarea.value);
            }
        });

        document.body.appendChild(toolbar);
    }

    function findInputElement() {
        // Heuristics to find the Grok chat input element
        const selectors = [
            'textarea[data-testid="prompt-textarea"]',
            'textarea',
            'div[contenteditable="true"]',
            'input[type="text"]'
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && isVisible(el)) {
                return el;
            }
        }
        return null;
    }

    function isVisible(el) {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function sendMessage(text) {
        const inputEl = findInputElement();
        if (!inputEl) {
            alert('Grok input box not found.');
            return;
        }
        if (inputEl.tagName.toLowerCase() === 'div' && inputEl.contentEditable) {
            inputEl.focus();
            document.execCommand('insertText', false, text);
        } else {
            inputEl.focus();
            inputEl.value = text;
        }

        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter'
        });
        inputEl.dispatchEvent(enterEvent);
    }

    function init() {
        injectStyles();
        createToolbar();
    }

    // Wait for DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();

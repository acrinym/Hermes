import { getAssociatedLabelText } from './heuristics.ts';
import { debug } from './debug.ts';

function getRobustSelector(el: Element): string {
  if (!el || !(el as HTMLElement).tagName) return '';
  if ((el as HTMLElement).id) {
    return `#${(el as HTMLElement).id.replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1')}`;
  }
  const path: string[] = [];
  let current: Element | null = el as HTMLElement;
  while (current && current.parentElement && current.tagName.toLowerCase() !== 'body') {
    let selector = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentElement.children).filter(c => c.tagName === current.tagName);
    if (siblings.length > 1) {
      selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    } else if ((current as HTMLElement).className) {
      const classes = (current as HTMLElement).className.trim().split(/\s+/).filter(c => c).join('.');
      if (classes && current.parentElement.querySelectorAll(selector + '.' + classes.replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1')).length === 1) {
        selector += '.' + classes.replace(/([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
      }
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}

export function sniffForms(): void {
  const forms = document.querySelectorAll('form');
  const data = Array.from(forms).map((form, index) => {
    const fields = form.querySelectorAll('input, select, textarea');
    return {
      formIndex: index,
      action: (form as HTMLFormElement).action || 'N/A',
      method: (form as HTMLFormElement).method || 'N/A',
      fields: Array.from(fields).map(f => ({
        tag: f.tagName,
        type: (f as HTMLInputElement).type || 'N/A',
        name: (f as HTMLInputElement).name || 'N/A',
        id: f.id || 'N/A',
        label: getAssociatedLabelText(f),
        selector: getRobustSelector(f)
      }))
    };
  });
  console.log('Hermes Sniffer:', data);
  debug.log('sniff', 'forms', data);
}

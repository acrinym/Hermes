export interface ProfileData {
  [key: string]: string;
}

export interface MatchResult {
  key: string | null;
  score: number;
  reason: string;
}

export interface SkippedField {
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  label: string;
  guess: string | null;
  score: number;
  reason: string;
}

const stopWords = ['name','first','last','middle','email','phone','address','street','city','state','zip','code','country'];
export function isStopWord(token: string): boolean {
  return stopWords.includes(token.toLowerCase());
}

export function tokenSimilarity(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;
  const minLen = Math.min(a.length, b.length);
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

export function getAssociatedLabelText(field: Element): string {
  const el = field as HTMLElement;
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return (label.textContent || '').trim();
  }
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const label = parent.querySelector('label');
    if (label) {
      if ((label as HTMLLabelElement).htmlFor === el.id) return (label.textContent || '').trim();
      if (!label.getAttribute('for') && label.contains(el)) return (label.textContent || '').trim();
      if (label === parent.firstElementChild && el === parent.children[1]) return (label.textContent || '').trim();
    }
    parent = parent.parentElement;
  }
  return '';
}

export function matchProfileKey(profile: ProfileData, field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): MatchResult {
  let bestKey: string | null = null;
  let bestScore = 0;
  const fieldName = (field.name || field.id || '').toLowerCase();
  const labelText = getAssociatedLabelText(field).toLowerCase();
  const combinedText = `${fieldName} ${labelText}`.trim();
  const tokens = combinedText.split(/\s+/).filter(t => t && !isStopWord(t));

  for (const key in profile) {
    const profileTokens = key.toLowerCase().split(/\s+/);
    let score = 0;
    tokens.forEach(t => {
      profileTokens.forEach(pt => {
        score += tokenSimilarity(t, pt);
      });
    });
    score /= Math.max(tokens.length, profileTokens.length) || 1;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return { key: bestScore >= 0.3 ? bestKey : null, score: bestScore, reason: '' };
}

export const translations = {
  en: {
    HERMES_OPTIONS: 'Hermes Options',
    THEME_LABEL: 'Theme:',
    EXPORT_THEMES: 'Export Themes',
    IMPORT_THEMES: 'Import Themes',
    FILL: 'Fill',
    TRAIN: 'Train',
    REC: 'Rec',
    STOP: 'Stop',
    MACROS_MENU: 'Macros \u25BC',
    THEME_MENU: 'Theme \u25BC',
    FX_MENU: 'FX \u25BC',
    OVERLAY: 'Overlay',
    SETTINGS: 'Settings',
    HELP: '?',
    LOGS: 'Logs',
    ALLOWLIST: 'Allowlist',
    DEBUG: 'Debug',
    LEARN: 'Learn',
    BUNCH: 'Bunch',
    CLOSE: 'Close',
    CLEAR: 'Clear',
    HERMES_LOGS: 'Hermes Logs',
    NO_LOGS: 'No logs',
    NO_MACROS: 'No macros recorded.',
    IMPORT_MACROS: 'Import Macros...',
    EXPORT_MACROS: 'Export Macros...',
    EXPORT_ALL_MACROS: 'Export All Macros...',
    MACRO_EDITOR: 'Macro Editor',
    DELETE_MACRO_PROMPT: 'Delete "{name}"?',
    DELETE: 'Delete',
    ENABLE_AFFIRM: 'Enable Positive Affirmations',
    SCRATCH_PAD: 'Scratch Pad',
    SAVE_TO_DRIVE: 'Save to Drive',
    EXPORT: 'Export',
    INVALID_JSON: 'Invalid JSON',
    OK: 'OK',
    IMPORT_FAILED: 'Import Failed',
    ALLOWED_DOMAINS: 'Allowed Domains',
    ADD: 'Add'
  },
  es: {
    HERMES_OPTIONS: 'Opciones de Hermes',
    THEME_LABEL: 'Tema:',
    EXPORT_THEMES: 'Exportar temas',
    IMPORT_THEMES: 'Importar temas',
    FILL: 'Rellenar',
    TRAIN: 'Entrenar',
    REC: 'Grabar',
    STOP: 'Detener',
    MACROS_MENU: 'Macros \u25BC',
    THEME_MENU: 'Tema \u25BC',
    FX_MENU: 'FX \u25BC',
    OVERLAY: 'Superposici\u00f3n',
    SETTINGS: 'Ajustes',
    HELP: '?',
    LOGS: 'Registros',
    ALLOWLIST: 'Permitir',
    DEBUG: 'Depurar',
    LEARN: 'Aprender',
    BUNCH: 'Agrupar',
    CLOSE: 'Cerrar',
    CLEAR: 'Limpiar',
    HERMES_LOGS: 'Registros de Hermes',
    NO_LOGS: 'Sin registros',
    NO_MACROS: 'No hay macros guardadas.',
    IMPORT_MACROS: 'Importar macros...',
    EXPORT_MACROS: 'Exportar macros...',
    EXPORT_ALL_MACROS: 'Exportar todas...',
    MACRO_EDITOR: 'Editor de Macros',
    DELETE_MACRO_PROMPT: '\u00bfEliminar "{name}"?',
    DELETE: 'Eliminar',
    ENABLE_AFFIRM: 'Activar afirmaciones positivas',
    SCRATCH_PAD: 'Bloc de notas',
    SAVE_TO_DRIVE: 'Guardar en Drive',
    EXPORT: 'Exportar',
    INVALID_JSON: 'JSON inv\u00e1lido',
    OK: 'Aceptar',
    IMPORT_FAILED: 'Fall\u00f3 la importaci\u00f3n',
    ALLOWED_DOMAINS: 'Dominios permitidos',
    ADD: 'A\u00f1adir'
  }
};

const navLang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'en';
const lang = translations[navLang] ? navLang : 'en';

export function t(key, vars = {}) {
  const dict = translations[lang] || translations.en;
  let str = dict[key] || translations.en[key] || key;
  Object.keys(vars).forEach(k => {
    str = str.replace(new RegExp(`{${k}}`, 'g'), vars[k]);
  });
  return str;
}

if (typeof window !== 'undefined') {
  window.t = t;
}

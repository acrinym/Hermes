// Constants for Hermes extension
// Centralizes magic numbers and configuration values

// Z-Index constants for proper layering
export const Z_INDEX = {
  // Maximum z-index for highest priority elements
  MAXIMUM: 2147483647,
  // High z-index for overlays and modals
  OVERLAY: 2147483646,
  // Effects z-index for visual effects
  EFFECTS: 2147483640,
  // Standard UI elements
  UI: 2147483639,
  // Background elements
  BACKGROUND: 2147483638
} as const;

// Animation and timing constants
export const ANIMATION = {
  // Default transition duration in milliseconds
  TRANSITION_DURATION: 300,
  // Affirmation display duration
  AFFIRMATION_DURATION: 4000,
  // Affirmation interval (10 minutes)
  AFFIRMATION_INTERVAL: 600000,
  // Macro playback delay
  MACRO_DELAY: 100,
  // Three.js loading timeout
  THREE_JS_TIMEOUT: 5000
} as const;

// Storage keys for consistency
export const STORAGE_KEYS = {
  SETTINGS: 'hermes_settings_v1_ext',
  PROFILE: 'hermes_profile_ext',
  MACROS: 'hermes_macros_ext',
  THEME: 'hermes_theme_ext',
  TASKS: 'hermes_tasks_ext',
  SNIPPETS: 'hermes_snippets_ext',
  SCRATCH: 'hermes_scratch_ext',
  SCHEDULE: 'hermes_schedule_ext',
  OVERLAY_STATE: 'hermes_overlay_state_ext',
  ONBOARDING: 'hermes_onboarding_ext',
  SELECTED_MACRO: 'hermes_selected_macro_ext',
  DEBUG_CONFIG: 'hermes_debug_config',
  GITHUB_RAW_BASE: 'github_raw_base',
  GITHUB_API_BASE: 'github_api_base',
  GITHUB_TOKEN: 'github_token'
} as const;

// Message types for chrome.runtime communication
export const MESSAGE_TYPES = {
  SAVE_HERMES_DATA: 'SAVE_HERMES_DATA',
  GET_HERMES_INITIAL_DATA: 'GET_HERMES_INITIAL_DATA',
  GET_GITHUB_CONFIG: 'GET_GITHUB_CONFIG',
  UPDATE_GITHUB_CONFIG: 'UPDATE_GITHUB_CONFIG',
  HERMES_PING: 'HERMES_PING'
} as const;

// Effect modes
export const EFFECT_MODES = {
  NONE: 'none',
  SNOW: 'snow',
  LASERS: 'lasers',
  CUBE: 'cube',
  CONFETTI: 'confetti',
  BUBBLES: 'bubbles',
  STROBE: 'strobe',
  LASER_V14: 'laserV14',
  STROBE_V14: 'strobeV14'
} as const;

// Three.js configuration
export const THREE_JS = {
  CDN_URL: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
  CAMERA_POSITION_Z: 5,
  CUBE_ROTATION_SPEED: 0.01,
  RENDERER_ALPHA: true,
  THREE_JS_TIMEOUT: 5000
} as const;

// Error messages
export const ERROR_MESSAGES = {
  THREE_JS_LOAD_FAILED: 'Failed to load Three.js, falling back to laser effect',
  CUBE_INIT_FAILED: 'Error initializing cube effect:',
  CUBE_FALLBACK: 'Cube effect failed, using laser fallback',
  STORAGE_SAVE_FAILED: 'Error saving data to storage:',
  STORAGE_LOAD_FAILED: 'Error loading data from storage:',
  BACKEND_CONNECTION_FAILED: 'Backend connection failed:',
  MACRO_IMPORT_FAILED: 'Failed to import macros from string',
  MACRO_SAVE_FAILED: 'Failed to save macros'
} as const; 
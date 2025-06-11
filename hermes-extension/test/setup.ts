if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    runtime: {
      lastError: null,
      sendMessage: jest.fn((msg, callback) => {
        if (callback) {
          callback({ success: true });
        }
      })
    },
    storage: {
      local: {
        get: jest.fn(async () => ({})),
        set: jest.fn(async () => {}),
        remove: jest.fn(async () => {})
      }
    }
  } as any;
}

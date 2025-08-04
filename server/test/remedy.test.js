const RemedyClient = require('../remedy');

describe('RemedyClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('logs in and creates incident', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('token') })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'INC0001' }) });
    global.fetch = mockFetch;
    const client = new RemedyClient({ baseUrl: 'http://remedy', username: 'u', password: 'p' });
    const res = await client.createIncident({ Description: 'test' });
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://remedy/api/jwt/login', expect.objectContaining({ method: 'POST' }));
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://remedy/api/arsys/v1/entry/HPD:IncidentInterface_Create', expect.objectContaining({ method: 'POST' }));
    expect(res).toEqual({ id: 'INC0001' });
  });
});

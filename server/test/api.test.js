const request = require('supertest');
const app = require('../index');

describe('API endpoints', () => {
  test('GET /api/macros returns list of macros', async () => {
    const res = await request(app).get('/api/macros');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
  });

  test('POST /api/fill requires profile', async () => {
    const res = await request(app).post('/api/fill').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/fill returns fillId when profile provided', async () => {
    const res = await request(app)
      .post('/api/fill')
      .send({ profile: { first: 'Jane' } });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fillId');
    expect(res.body.status).toBe('running');
  });
});

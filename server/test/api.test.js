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

  test('POST /api/schedule creates a schedule entry', async () => {
    const res = await request(app)
      .post('/api/schedule')
      .send({ id: 'demo', date: '2030-01-01', time: '12:00', recurrence: 'once' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('scheduleId');
    const list = await request(app).get('/api/schedule');
    expect(list.body.find(s => s.id === res.body.scheduleId)).toBeTruthy();
  });

  test('profile upload and download', async () => {
    const profile = { first: 'John' };
    const up = await request(app).post('/api/profile').send(profile);
    expect(up.status).toBe(200);
    const res = await request(app).get('/api/profile');
    expect(res.body).toEqual(profile);
  });

  test('macros upload and download', async () => {
    const data = { demo: [{ type: 'click' }] };
    const up = await request(app).post('/api/macros/data').send(data);
    expect(up.status).toBe(200);
    const res = await request(app).get('/api/macros/data');
    expect(res.body).toEqual(data);
  });
});

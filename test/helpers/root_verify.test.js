const request = require('supertest');
const app = require('../app'); 

describe('GET /api/posts', () => {
  test('Deve retornar uma lista de posts com sucesso', async () => {
    const response = await request(app)
      .get('/api/posts')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('posts');
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBeGreaterThan(0);
  });
});

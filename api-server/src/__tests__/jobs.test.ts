import request from 'supertest';
import app from '../app';
import '../services/queue-processors';

describe('Job Routes', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cozinca.com', senha: 'admin123' });

    authToken = loginResponse.body.data?.token;
  });

  it('should enqueue a report job and allow status retrieval', async () => {
    const createResponse = await request(app)
      .post('/api/jobs/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'vendas', query: { periodo: 'ultimo_mes' } });

    expect(createResponse.status).toBe(202);
    expect(createResponse.body).toHaveProperty('data');
    expect(createResponse.body.data).toHaveProperty('jobId');
    expect(createResponse.body.data).toHaveProperty('status', 'queued');

    const jobId = createResponse.body.data.jobId;
    const statusResponse = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.data).toHaveProperty('id', jobId);
    expect(typeof statusResponse.body.data.state).toBe('string');
  });

  it('should return 404 for a missing job', async () => {
    const response = await request(app)
      .get('/api/jobs/does-not-exist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('should enqueue an OS PDF generation job', async () => {
    const response = await request(app)
      .post('/api/os/1/pdf-job')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(response.status).toBe(202);
    expect(response.body.data).toHaveProperty('jobId');
    expect(response.body.data).toHaveProperty('status', 'queued');
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const response = await request(server).post('/auth/login').send({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should validate request body', async () => {
      const response = await request(server).post('/auth/register').send({
        email: 'invalid-email',
        password: '123',
        first_name: '',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without token', async () => {
      const response = await request(server).get('/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

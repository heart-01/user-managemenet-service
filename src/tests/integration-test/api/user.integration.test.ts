import request from 'supertest';
import app from '../../../app';
import { initDB, setupSimpleScenarioFixtures, cleanupData } from '../test-helper';
import { HTTP_RESPONSE_CODE } from '../../../enums/response.enum';
import user1 from '../fixtures/user1';
import { UserType } from '../../../types/users.type';

describe('User Service Test:', () => {
  beforeAll(async () => {
    await initDB();
    await cleanupData();
    await setupSimpleScenarioFixtures();
  });

  describe('GET /users/:id', () => {
    it('should return user when valid ID is provided', async () => {
      const response = await request(app).get(`/api/users/${user1.id}`);
      expect(response.status).toBe(HTTP_RESPONSE_CODE.OK);
      const user: UserType = response.body;
      expect(user).not.toBeNull();
      expect(user.id).toEqual(user1.id);
      expect(user.name).toEqual(user1.name);
      expect(user.phoneNumber).toEqual(user1.phoneNumber);
      expect(user.bio).toEqual(user1.bio);
      expect(user.username).toEqual(user1.username);
      expect(user.email).toEqual(user1.email);
      expect(user.imageUrl).toEqual(user1.imageUrl);
      expect(user.status).toEqual(user1.status);
    });

    it('should return 404 when user is not found', async () => {
      const response = await request(app).get('/api/users/adbe1b9a-562d-4554-bea4-e6ae35f3b001');
      expect(response.status).toBe(HTTP_RESPONSE_CODE.NOT_FOUND);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 when ID is invalid', async () => {
      const response = await request(app).get(`/api/users/1`);
      expect(response.status).toBe(HTTP_RESPONSE_CODE.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', '"id" must be a valid GUID');
    });
  });

  afterAll(async () => {
    await cleanupData();
  });
});

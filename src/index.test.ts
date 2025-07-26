import { describe, it, expect } from 'vitest';
import app from './index';

describe('Hello Hono root route', () => {
  it('should return "Hello Hono!" on GET /', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello Hono!');
  });
});
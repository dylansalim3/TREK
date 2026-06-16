import { Hono } from 'hono';
import type { AppVariables, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.get('/', (c) => {
  return c.json({ defaultLanguage: 'en' });
});

export default app;

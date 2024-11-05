import type { Request, Response } from 'express';
import './config/database';
import express from './config/express';
import router from './routes';

const app = express();

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
  });
});

app.use('/api', router);

export default app;

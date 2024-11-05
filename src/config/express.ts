import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import expressJSDocSwagger from 'express-jsdoc-swagger';

import { PORT } from './dotenv';
import corsOptions from './cors';
import { limiter } from './limiter';
import { swaggerOptions } from './swagger';
import { loggerService } from '../services';

export default () => {
  const app = express();
  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(limiter);
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static('public'));
  expressJSDocSwagger(app)(swaggerOptions);

  app.listen(PORT, () => {
    loggerService.info(`Application is running on port ${PORT}.`);
  });

  return app;
};

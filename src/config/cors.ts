import { CorsOptions } from 'cors';
import { NODE_ENV } from './dotenv';
import { loggerService } from '../services';

const corsOptions: CorsOptions = {
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

export default (): CorsOptions => {
  loggerService.info(`NODE_ENV: ${NODE_ENV}`);
  if (NODE_ENV !== 'local' && NODE_ENV !== 'development') {
    return {
      ...corsOptions,
      credentials: true,
    };
  }

  return {
    ...corsOptions,
    origin: '*',
  };
};

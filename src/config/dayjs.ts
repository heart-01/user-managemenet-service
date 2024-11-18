import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { TIMEZONE } from './dotenv';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.tz.setDefault(TIMEZONE);

export default dayjs;

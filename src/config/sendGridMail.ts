import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from './dotenv';

sgMail.setApiKey(SENDGRID_API_KEY as string);

export default sgMail;

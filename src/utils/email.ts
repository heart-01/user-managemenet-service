import sgMail from '../config/sendGridMail';
import { CLIENT_URL, SENDGRID_SENDER_EMAIL } from '../config/dotenv';

export type SendEmailWithTemplateOptions = {
  to: string;
  subject: string;
  templateId: string;
  dynamicTemplateData?: { [key: string]: any };
};

export const sendEmailWithTemplate = async ({
  to,
  subject,
  templateId,
  dynamicTemplateData,
}: SendEmailWithTemplateOptions): Promise<void> => {
  const msg = {
    to,
    from: SENDGRID_SENDER_EMAIL,
    subject,
    templateId,
    dynamic_template_data: dynamicTemplateData,
  };
  await sgMail.send(msg);
};

export const generateUrlEmailVerifyRegister = (accessToken: string): string =>
  `${CLIENT_URL}/verify/register?token=${accessToken}`;

export const generateUrlEmailVerifyResetPassword = (accessToken: string): string =>
  `${CLIENT_URL}/verify/reset-password?token=${accessToken}`;

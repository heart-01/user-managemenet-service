import sgMail from '../config/sendGridMail';
import { SENDGRID_SENDER_EMAIL } from '../config/dotenv';

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

import nodemailer from 'nodemailer';

type MailOptions = {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
};

export async function sendMail(options: MailOptions) {
  const { from, to, subject, html, text } = options;

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log('[DEV] Mailer disabled (no SMTP configured).');
    console.log('[DEV] Mail recipients:', Array.isArray(to) ? to.join(', ') : to);
    console.log('[DEV] Mail subject:', subject);
    if (html) console.log('[DEV] Mail html:', html);
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  const info = await transporter.sendMail({
    from: from || process.env.BOOKING_EMAIL_FROM || process.env.RESET_EMAIL_FROM || 'CODShield <noreply@codshield.com>',
    to,
    subject,
    html,
    text,
  });

  return { success: true, info };
}

export default sendMail;

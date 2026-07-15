import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { sendMail } from '../../lib/mailer';

@Injectable()
export class BookDemoService {
  private readonly targetEmail = process.env.BOOKING_EMAIL || 'info@veritonaitechnologies.com';
  private readonly fromEmail =
    process.env.BOOKING_EMAIL_FROM || process.env.RESET_EMAIL_FROM || 'CODShield <noreply@codshield.com>';

  async sendBookingRequest(body: any) {
    const { name, email, company, phone, preferredTime, message } = body;

    if (!name?.trim() || !email?.trim() || !preferredTime?.trim()) {
      throw new BadRequestException('Name, email, and preferred time are required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userHtml = `
      <div style="font-family: system-ui, sans-serif; color: #111827; line-height: 1.6;">
        <h2>Your CODShield demo booking is confirmed</h2>
        <p>Hi ${this.escapeHtml(name)},</p>
        <p>Thanks for booking a live demo with CODShield. We’ve received your request and scheduled it for:</p>
        <p style="font-size: 16px; font-weight: 700; margin: 16px 0;">${this.escapeHtml(preferredTime)}</p>
        <p><strong>Company:</strong> ${this.escapeHtml(company || '—')}</p>
        <p><strong>Phone:</strong> ${this.escapeHtml(phone || '—')}</p>
        <p><strong>Notes:</strong> ${this.escapeHtml(message || 'None')}</p>
        <p>Our team will review the slot and contact you if any adjustment is needed.</p>
      </div>
    `;

    const companyHtml = `
      <div style="font-family: system-ui, sans-serif; color: #111827; line-height: 1.6;">
        <h2>New Demo Booking Request</h2>
        <p>A new live demo request has been submitted.</p>
        <p><strong>Name:</strong> ${this.escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(normalizedEmail)}</p>
        <p><strong>Company:</strong> ${this.escapeHtml(company || '—')}</p>
        <p><strong>Phone:</strong> ${this.escapeHtml(phone || '—')}</p>
        <p><strong>Preferred time slot:</strong> ${this.escapeHtml(preferredTime)}</p>
        <p><strong>Notes:</strong> ${this.escapeHtml(message || 'None')}</p>
      </div>
    `;

    try {
      const [userMailResult, companyMailResult] = await Promise.all([
        sendMail({
          from: this.fromEmail,
          to: normalizedEmail,
          subject: `Your CODShield demo is scheduled for ${preferredTime}`,
          html: userHtml,
        }),
        sendMail({
          from: this.fromEmail,
          to: this.targetEmail,
          subject: `Demo booking request from ${name} (${preferredTime})`,
          html: companyHtml,
        }),
      ]);

      const userSuccess = (userMailResult as any)?.success === true;
      const companySuccess = (companyMailResult as any)?.success === true;

      if (!userSuccess || !companySuccess) {
        console.error('Book demo mailer error:', { userMailResult, companyMailResult });
        throw new InternalServerErrorException('Failed to send booking email');
      }

      return {
        success: true,
        message: 'Demo booking request sent successfully.',
      };
    } catch (error) {
      console.error('Book demo service error:', error);
      throw new InternalServerErrorException('Failed to send booking email');
    }
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

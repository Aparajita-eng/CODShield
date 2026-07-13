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
    const recipients = [this.targetEmail, normalizedEmail];

    const html = `
      <div style="font-family: system-ui, sans-serif; color: #111827;">
        <h2>New Demo Booking Request</h2>
        <p><strong>Name:</strong> ${this.escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(normalizedEmail)}</p>
        <p><strong>Company:</strong> ${this.escapeHtml(company || '—')}</p>
        <p><strong>Phone:</strong> ${this.escapeHtml(phone || '—')}</p>
        <p><strong>Preferred time slot:</strong> ${this.escapeHtml(preferredTime)}</p>
        <p><strong>Notes:</strong> ${this.escapeHtml(message || 'None')}</p>
        <p>
          This request was sent to both the customer and ${this.escapeHtml(this.targetEmail)}.
        </p>
      </div>
    `;

    try {
      const mailResult = await sendMail({
        from: this.fromEmail,
        to: recipients,
        subject: `Demo booking request from ${name}`,
        html,
      });

      if (!mailResult || (mailResult as any).success !== true) {
        console.error('Book demo mailer error:', mailResult);
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

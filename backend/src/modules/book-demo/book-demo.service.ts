import { BadRequestException, Injectable } from '@nestjs/common';
import { sendMail } from '../../lib/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { BookDemoDto } from './dto/book-demo.dto';
import * as crypto from 'crypto';

@Injectable()
export class BookDemoService {
  private readonly targetEmails = (
    process.env.BOOKING_EMAILS ||
    process.env.BOOKING_EMAIL ||
    'info@veritonaitechnologies.com'
  )
    .split(',')
    .map(email => email.trim().toLowerCase());

  private readonly fromEmail =
    process.env.BOOKING_EMAIL_FROM || process.env.RESET_EMAIL_FROM || 'CODShield <noreply@codshield.com>';

  constructor(private readonly prisma: PrismaService) {}

  async sendBookingRequest(dto: BookDemoDto) {
    const { name, email, company, phone, date, timeSlot, message, captchaToken, website } = dto;

    // 1. Honeypot check: If the website field is filled out, silently return a success response
    // to deflect and confuse the automated bot.
    if (website && website.trim() !== '') {
      console.warn('Spam submission detected via honeypot (website field populated). Deflecting.');
      return {
        success: true,
        message: 'Demo booking request sent successfully.',
      };
    }

    // 2. Cloudflare Turnstile CAPTCHA Token validation
    const isCaptchaValid = await this.verifyTurnstile(captchaToken);
    if (!isCaptchaValid) {
      throw new BadRequestException('Verification failed. Invalid or expired CAPTCHA token.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Persist the booking record to the database first
    let booking;
    try {
      booking = await this.prisma.demoBooking.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          company: company.trim(),
          phone: phone.trim(),
          date: date.trim(),
          timeSlot: timeSlot.trim(),
          message: message ? message.trim() : null,
          status: 'PENDING',
        },
      });
      console.log(`Demo booking saved to database with ID: ${booking.id}`);
    } catch (dbError) {
      console.error('Failed to persist demo booking to database:', dbError);
      // Fail the request if we can't save to the database (violates transaction integrity)
      throw new BadRequestException('Unable to store booking request. Please try again.');
    }

    // 4. Generate the email HTML/Text and .ics calendar invite
    const icsContent = this.generateIcsFile({
      name: name.trim(),
      email: normalizedEmail,
      company: company.trim(),
      phone: phone.trim(),
      date: date.trim(),
      timeSlot: timeSlot.trim(),
    });

    const userHtml = `
      <div style="font-family: system-ui, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #059669; margin-top: 0;">Your CODShield Demo Booking</h2>
        <p>Hi ${this.escapeHtml(name)},</p>
        <p>Thank you for scheduling a live demo with CODShield. We have received your request and have recorded the details below:</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${this.escapeHtml(date)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Time Slot:</strong> ${this.escapeHtml(timeSlot)} (IST)</p>
          <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${this.escapeHtml(company)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${this.escapeHtml(phone)}</p>
          <p style="margin: 0;"><strong>Notes:</strong> ${this.escapeHtml(message || '—')}</p>
        </div>

        <p>We've attached a calendar invite (.ics) to this email for your convenience.</p>
        <p>Our team will review the slot and reach out with a meeting link or to suggest an alternative time if a conflict arises.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 0;">CODShield Trust Infrastructure • Veriton AI Technologies</p>
      </div>
    `;

    const userText = `
Your CODShield Demo Booking

Hi ${name},

Thank you for scheduling a live demo with CODShield. We have received your request and have recorded the details below:

- Date: ${date}
- Time Slot: ${timeSlot} (IST)
- Company: ${company}
- Phone: ${phone}
- Notes: ${message || '—'}

We have attached a calendar invite (.ics) to this email for your convenience.
Our team will review the slot and reach out with a meeting link or to suggest an alternative time if a conflict arises.

CODShield Trust Infrastructure • Veriton AI Technologies
    `.trim();

    const companyHtml = `
      <div style="font-family: system-ui, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827; margin-top: 0;">New Demo Booking Request</h2>
        <p>A new live demo request has been submitted with the following details:</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${this.escapeHtml(name)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${normalizedEmail}">${this.escapeHtml(normalizedEmail)}</a></p>
          <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${this.escapeHtml(company)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${this.escapeHtml(phone)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Preferred Date:</strong> ${this.escapeHtml(date)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Preferred Time Slot:</strong> ${this.escapeHtml(timeSlot)}</p>
          <p style="margin: 0;"><strong>Notes:</strong> ${this.escapeHtml(message || '—')}</p>
        </div>

        <p>The invite (.ics) is attached to this email.</p>
      </div>
    `;

    const companyText = `
New Demo Booking Request

A new live demo request has been submitted with the following details:

- Name: ${name}
- Email: ${normalizedEmail}
- Company: ${company}
- Phone: ${phone}
- Preferred Date: ${date}
- Preferred Time Slot: ${timeSlot}
- Notes: ${message || '—'}

The calendar invite (.ics) is attached to this email.
    `.trim();

    // 5. Send emails concurrently, but do NOT throw errors if they fail.
    // If SMTP has issues, the database record remains intact and the client receives success.
    try {
      const emailTasks = [
        sendMail({
          from: this.fromEmail,
          to: normalizedEmail,
          subject: `Your CODShield demo is scheduled for ${date} ${timeSlot}`,
          html: userHtml,
          text: userText,
          attachments: [
            {
              filename: 'invite.ics',
              content: icsContent,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ],
        }),
        sendMail({
          from: this.fromEmail,
          to: this.targetEmails,
          subject: `Demo booking request from ${name} (${date} ${timeSlot})`,
          html: companyHtml,
          text: companyText,
          attachments: [
            {
              filename: 'invite.ics',
              content: icsContent,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ],
        }),
      ];

      // Fire the emails and await resolution
      const results = await Promise.all(emailTasks);
      console.log('Book demo email dispatch completed:', results);
    } catch (mailError) {
      console.error(`Failed to send booking emails for booking ID ${booking.id}:`, mailError);
      // We explicitly swallow this error so the API request succeeds. The booking is preserved in DB.
    }

    return {
      success: true,
      message: 'Demo booking request sent successfully.',
      bookingId: booking.id,
    };
  }

  private async verifyTurnstile(token: string): Promise<boolean> {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000UNOFFICIAL';
    if (secretKey === '1x00000000000000000000000000000000UNOFFICIAL') {
      return true;
    }

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
      });

      const data = (await response.json()) as any;
      return !!data.success;
    } catch (error) {
      console.error('Turnstile captcha verification error:', error);
      return false;
    }
  }

  private generateIcsFile(data: {
    name: string;
    email: string;
    company: string;
    phone: string;
    date: string;
    timeSlot: string;
  }) {
    const { name, email, company, phone, date, timeSlot } = data;
    // Generate UUID or generic random string fallback for UID
    const eventId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Parse timeSlot: e.g. "09:00 AM - 10:00 AM" or "Other / Flexible"
    let startHour = 10;
    let startMin = 0;
    let endHour = 11;
    let endMin = 0;

    if (timeSlot !== 'Other / Flexible') {
      const match = timeSlot.match(/(\d{2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let sh = parseInt(match[1], 10);
        const sm = parseInt(match[2], 10);
        const sampm = match[3].toUpperCase();
        let eh = parseInt(match[4], 10);
        const em = parseInt(match[5], 10);
        const eampm = match[6].toUpperCase();

        if (sampm === 'PM' && sh < 12) sh += 12;
        if (sampm === 'AM' && sh === 12) sh = 0;
        if (eampm === 'PM' && eh < 12) eh += 12;
        if (eampm === 'AM' && eh === 12) eh = 0;

        startHour = sh;
        startMin = sm;
        endHour = eh;
        endMin = em;
      }
    }

    // Convert local time in IST (UTC+5:30) to standard UTC date
    const startLocal = new Date(`${date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00+05:30`);
    const endLocal = new Date(`${date}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00+05:30`);

    const formatICSDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const dtstart = formatICSDate(startLocal);
    const dtend = formatICSDate(endLocal);

    const cleanCompany = company.replace(/[,;]/g, '\\$1');
    const cleanName = name.replace(/[,;]/g, '\\$1');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CODShield//Demo Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:CODShield Live Demo - ${cleanCompany}`,
      `DESCRIPTION:Live demo session with CODShield Trust Infrastructure team.\\n\\nName: ${cleanName}\\nCompany: ${cleanCompany}\\nPhone: ${phone}\\nDate: ${date}\\nTime Slot: ${timeSlot}`,
      'LOCATION:Online Meeting (Link to be shared)',
      'ORGANIZER;CN="CODShield Team":MAILTO:info@veritonaitechnologies.com',
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN="${cleanName}":MAILTO:${email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
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


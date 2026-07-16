import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class BookDemoDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  name!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Company is required' })
  @Length(2, 100, { message: 'Company name must be between 2 and 100 characters' })
  company!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^[+0-9\s\-()]{7,25}$/, { message: 'Invalid phone number format' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Date is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @IsString()
  @IsNotEmpty({ message: 'Preferred time slot is required' })
  timeSlot!: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Message must not exceed 1000 characters' })
  message?: string;

  @IsString()
  @IsNotEmpty({ message: 'Captcha token is required' })
  captchaToken!: string;

  // Honeypot field (must be empty or omitted)
  @IsString()
  @IsOptional()
  website?: string;
}

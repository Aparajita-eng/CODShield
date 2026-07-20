import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LinkKeyDto {
  @IsNotEmpty({ message: 'API key is required' })
  @IsString({ message: 'API key must be a string' })
  @Length(20, 100, { message: 'API key must be between 20 and 100 characters' })
  @Matches(/^codshield_live_/, {
    message: 'API key must start with the prefix codshield_live_',
  })
  apiKey!: string;
}

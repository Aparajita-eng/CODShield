import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { MerchantLinkController } from './merchant-link.controller';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MerchantController, MerchantLinkController, IntegrationController],
  providers: [MerchantService, IntegrationService],
  exports: [MerchantService, IntegrationService],
})
export class MerchantModule {}

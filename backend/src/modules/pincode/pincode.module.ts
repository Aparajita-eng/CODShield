import { Module } from '@nestjs/common';
import { PincodeService } from './pincode.service';
import { PincodeController } from './pincode.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PincodeController],
  providers: [PincodeService],
  exports: [PincodeService],
})
export class PincodeModule {}

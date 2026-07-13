import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Dashboard Metrics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('data')
  @ApiOperation({ summary: 'Load unified summary datasets for the active merchant account' })
  async getDashboardData(
    @ReqSession() session: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    return this.dashboardService.getDashboardData(session, queryMerchantId);
  }

  @Post('claim-submit')
  @ApiOperation({ summary: 'Register a new insurance delivery refusal claim log' })
  async submitClaim(
    @ReqSession() session: any,
    @Body() body: any,
  ) {
    return this.dashboardService.submitClaim(session, body);
  }
}

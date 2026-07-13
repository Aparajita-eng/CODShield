import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get performance metrics & trend charts' })
  async getAnalyticsData(
    @ReqSession() session: any,
    @Query('timeline') timeline: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const data = await this.analyticsService.getAnalyticsData(scope.merchantId, timeline);
    return {
      success: true,
      selectedMerchantId: scope.merchantId,
      ...data,
    };
  }
}

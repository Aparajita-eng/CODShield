import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FraudService } from './fraud.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Fraud Prevention')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('events')
  @ApiOperation({ summary: 'List aggregated coordinated fraud events' })
  async listEvents(
    @ReqSession() session: any,
    @Query() query: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const res = await this.fraudService.listEvents(scope.merchantId, query);
    return {
      success: true,
      ...res,
    };
  }

  @Get('trust-graph')
  @ApiOperation({ summary: 'Generate coordinated device/phone trust network graph' })
  async getTrustGraph(
    @ReqSession() session: any,
    @Query() query: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const graph = await this.fraudService.getTrustGraph(scope.merchantId, query);
    return {
      success: true,
      ...graph,
    };
  }
}

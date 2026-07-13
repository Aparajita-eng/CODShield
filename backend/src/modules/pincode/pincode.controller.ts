import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PincodeService } from './pincode.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Pincode Intelligence')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/pincodes')
export class PincodeController {
  constructor(private readonly pincodeService: PincodeService) {}

  @Get('intelligence')
  @ApiOperation({ summary: 'Get summary intelligence analysis for all pincodes' })
  async getPincodeIntelligence(
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

    const res = await this.pincodeService.getPincodeIntelligence(scope.merchantId, query);
    return {
      success: true,
      ...res,
    };
  }

  @Get(':pincode/detail')
  @ApiOperation({ summary: 'Get details for a single pincode' })
  async getPincodeDetail(
    @ReqSession() session: any,
    @Param('pincode') pincode: string,
    @Query() query: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const res = await this.pincodeService.getPincodeDetail(scope.merchantId, pincode, query);
    return {
      success: true,
      ...res,
    };
  }
}

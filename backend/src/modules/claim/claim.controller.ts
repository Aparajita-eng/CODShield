import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ClaimService } from './claim.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Claims')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/claims')
export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  @Get()
  @ApiOperation({ summary: 'List claims for the active merchant profile' })
  async listClaims(
    @ReqSession() session: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const res = await this.claimService.listClaims(scope.merchantId, scope.allowedIds);
    return {
      success: true,
      selectedMerchantId: scope.merchantId,
      ...res,
    };
  }

  @Post(':claimId/notes')
  @ApiOperation({ summary: 'Update merchant notes on a claim' })
  async updateClaimNotes(
    @ReqSession() session: any,
    @Param('claimId') claimId: string,
    @Body() body: any,
  ) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const { notes } = body;
    if (notes === undefined) {
      throw new BadRequestException("Notes content is required");
    }

    await this.claimService.updateNotes(scope.merchantId, claimId, notes);
    return {
      success: true,
      message: 'Merchant notes updated successfully',
      notes,
    };
  }
}

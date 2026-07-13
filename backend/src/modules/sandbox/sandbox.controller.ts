import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SandboxService } from './sandbox.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sandbox Simulations')
@Controller('api/sandbox')
export class SandboxController {
  constructor(private readonly sandboxService: SandboxService) {}

  @Post('trust-graph')
  @ApiOperation({ summary: 'Simulate Trust Graph logic' })
  evaluateTrustGraph(@Body() body: any) {
    const res = this.sandboxService.evaluateTrustGraph(body);
    return {
      success: true,
      ...res,
    };
  }

  @Post('risk-engine')
  @ApiOperation({ summary: 'Simulate Raw Risk Engine calculations' })
  async checkRiskEngine(@Body() body: any) {
    const res = await this.sandboxService.checkRiskEngine(body);
    return {
      success: true,
      ...res,
    };
  }

  @Post('pincode')
  @ApiOperation({ summary: 'Simulate Pincode risk weight rules' })
  async checkPincode(@Body() body: any) {
    const res = await this.sandboxService.checkPincode(body);
    return {
      success: true,
      ...res,
    };
  }

  @Post('fraud-history')
  @ApiOperation({ summary: 'Simulate Phone blacklist fraud triggers' })
  async checkFraudHistory(@Body() body: any) {
    const res = await this.sandboxService.checkFraudHistory(body);
    return {
      success: true,
      ...res,
    };
  }

  @Post('merchant-ratio')
  @ApiOperation({ summary: 'Simulate Merchant threshold ratios' })
  checkMerchantRatio(@Body() body: any) {
    const res = this.sandboxService.checkMerchantRatio(body);
    return {
      success: true,
      ...res,
    };
  }

  @Post('claim')
  @ApiOperation({ summary: 'Simulate Claims automation sequence' })
  processSimulatedClaim(@Body() body: any) {
    const res = this.sandboxService.processSimulatedClaim(body);
    return {
      success: true,
      ...res,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('orders/risk-check')
  @ApiOperation({ summary: 'Simulate checkout logs (Session Protected)' })
  async createSandboxOrderRiskCheck(
    @ReqSession() session: any,
    @Body() body: any,
  ) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const res = await this.sandboxService.createSandboxOrderRiskCheck(scope.merchantId, body);
    return {
      success: true,
      ...res,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Merchant & Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/settings')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Patch('company')
  @ApiOperation({ summary: 'Update company details' })
  async updateCompany(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const merchant = await this.merchantService.updateCompany(scope.merchantId, body);
    return {
      success: true,
      message: 'Company settings updated successfully',
      merchant,
    };
  }

  @Post('api-key/regenerate')
  @ApiOperation({ summary: 'Regenerate merchant API Key' })
  async regenerateApiKey(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const res = await this.merchantService.regenerateApiKey(scope.merchantId);
    return {
      success: true,
      message: 'API key regenerated successfully. Please copy it now as it will not be shown again.',
      ...res,
    };
  }

  @Post('password')
  @ApiOperation({ summary: 'Change current user password' })
  async updatePassword(@ReqSession() session: any, @Body() body: any) {
    await this.merchantService.updatePassword(session, body);
    return {
      success: true,
      message: 'Password updated successfully',
    };
  }

  @Get('team')
  @ApiOperation({ summary: 'List team members' })
  async listTeam(@ReqSession() session: any, @Query('merchantId') queryMerchantId?: string) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const team = await this.merchantService.listTeam(scope.merchantId);
    return {
      success: true,
      team,
    };
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Get webhook configurations' })
  async getWebhook(@ReqSession() session: any, @Query('merchantId') queryMerchantId?: string) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const webhook = this.merchantService.getWebhook(scope.merchantId);
    return {
      success: true,
      webhook,
    };
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Save webhook configurations' })
  async updateWebhook(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const webhook = this.merchantService.updateWebhook(scope.merchantId, body);
    return {
      success: true,
      message: 'Webhook configuration saved successfully',
      webhook,
    };
  }
}

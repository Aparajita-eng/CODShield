/** Integration endpoints — list, connect, sync, disconnect */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { IntegrationService } from './integration.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  @ApiOperation({ summary: 'List all integrations for this merchant' })
  async listIntegrations(
    @ReqSession() session: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const integrations = await this.integrationService.listIntegrations(scope.merchantId);
    return { success: true, integrations };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect a new integration' })
  async connect(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const integration = await this.integrationService.connectIntegration(scope.merchantId, body);
    return {
      success: true,
      message: 'Integration connected successfully',
      integration,
    };
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Trigger a manual sync for an integration' })
  async syncNow(
    @ReqSession() session: any,
    @Param('id') integrationId: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const result = await this.integrationService.syncIntegration(scope.merchantId, integrationId);
    return {
      success: true,
      message: 'Sync completed',
      ...result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Disconnect (soft-delete) an integration' })
  async disconnect(
    @ReqSession() session: any,
    @Param('id') integrationId: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    await this.integrationService.disconnectIntegration(scope.merchantId, integrationId);
    return {
      success: true,
      message: 'Integration disconnected successfully',
    };
  }
}

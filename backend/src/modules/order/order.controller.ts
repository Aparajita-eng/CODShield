import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Headers,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId } from '../../lib/merchantAccess';
import { hashApiKey } from '../../lib/auth';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

import { Roles } from '../auth/roles.decorator';

@ApiTags('Orders')
@Controller()
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('api/orders')
  @ApiOperation({ summary: 'List and search orders' })
  async listOrders(
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

    const result = await this.orderService.listOrders(scope.merchantId, query);

    // Normalise to the shape the frontend Order interface expects
    const orders = result.orders.map((o: any) => ({
      id: o.id,
      merchantId: o.merchantId,
      customerName: o.customerName ?? `Customer ${o.phone?.slice(-4) ?? ''}`,
      phone: o.phone,
      pincode: o.pincode,
      value: o.value,
      riskScore: o.riskScore,
      status: o.fulfillmentStatus ?? o.status ?? 'Pending',
      protectionStatus: o.protectionStatus,
      orderDate: o.createdAt ?? o.orderDate,
      riskFactors: o.riskFactors ?? [],
      otpVerified: o.fulfillmentStatus === 'Verified' || o.otpVerified === true,
      fraudFlagged: o.fraudFlagged ?? false,
      timeline: o.timeline ?? [],
    }));

    return {
      success: true,
      orders,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      selectedMerchantId: scope.merchantId,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('api/orders/:id')
  @ApiOperation({ summary: 'Get details for a single order' })
  async getOrderDetails(
    @ReqSession() session: any,
    @Param('id') id: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const order = await this.orderService.getOrderDetails(scope.merchantId, id);
    return {
      success: true,
      order,
    };
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch('api/orders/bulk')
  @Roles('Owner', 'Administrator')
  @ApiOperation({ summary: 'Bulk verify or cancel orders' })
  async bulkUpdate(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session, body.merchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const orders = await this.orderService.bulkUpdate(scope.merchantId, body);
    return {
      success: true,
      orders,
    };
  }

  @Post('api/v1/orders/risk-check')
  @ApiOperation({ summary: 'Evaluate checkout risk assessment' })
  @ApiHeader({ name: 'x-api-key', description: 'Merchant public API Key', required: true })
  async processRiskCheck(
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() body: any,
  ) {
    if (!apiKey) {
      throw new UnauthorizedException("Authentication required. Provide x-api-key header.");
    }

    const merchant = await this.prisma.merchant.findUnique({
      where: { apiKeyHash: hashApiKey(apiKey) },
    });

    if (!merchant) {
      throw new UnauthorizedException("Invalid API key provided");
    }

    const res = await this.orderService.processRiskCheck(merchant, body);
    return {
      success: true,
      ...res,
    };
  }
}

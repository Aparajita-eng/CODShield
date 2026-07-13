import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { resolveActiveMerchantId, assertSessionMerchantAccess } from '../../lib/merchantAccess';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Customers & Profiles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'List and aggregate customer directories' })
  async listCustomers(
    @ReqSession() session: any,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const customers = await this.customerService.listCustomers(scope.merchantId);
    return {
      success: true,
      customers,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search or autocomplete phone lists' })
  async searchCustomers(
    @ReqSession() session: any,
    @Query('q') queryVal: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const customers = await this.customerService.searchCustomers(scope.merchantId, queryVal);
    return {
      success: true,
      customers,
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile details for a buyer identity' })
  async getCustomerProfile(
    @ReqSession() session: any,
    @Query('phone') phoneQuery: string,
    @Query('merchantId') queryMerchantId?: string,
  ) {
    const scope = await resolveActiveMerchantId(session, queryMerchantId);
    if (!scope.ok) {
      if (scope.status === 403) throw new ForbiddenException(scope.message);
      if (scope.status === 401) throw new UnauthorizedException(scope.message);
      throw new BadRequestException(scope.message);
    }

    const profile = await this.customerService.getCustomerProfile(scope.merchantId, phoneQuery);
    return {
      success: true,
      profile,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { ReqSession } from "../auth/session.decorator";
import { resolveActiveMerchantId, handleMerchantScopeError } from "../../lib/merchantAccess";
import { PrismaService } from "../prisma/prisma.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Rules Management")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/rules")
export class RulesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List all dynamic rules for the merchant" })
  async listRules(@ReqSession() session: any) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    return {
      success: true,
      rules: await this.prisma.rule.findMany({
        where: { merchantId },
        orderBy: { priority: "desc" },
      }),
    };
  }

  @Post()
  @ApiOperation({ summary: "Create a new dynamic rule" })
  async createRule(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const { priority, conditions, action, enabled } = body;

    if (!conditions || !action) {
      throw new BadRequestException("Conditions and Action fields are required");
    }

    const rule = await this.prisma.rule.create({
      data: {
        merchantId,
        priority: priority ?? 0,
        conditions,
        action,
        enabled: enabled ?? true,
      },
    });

    return {
      success: true,
      message: "Rule created successfully",
      rule,
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an existing dynamic rule" })
  async updateRule(
    @ReqSession() session: any,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const rule = await this.prisma.rule.findUnique({ where: { id } });

    if (!rule || rule.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized access to this rule");
    }

    const updated = await this.prisma.rule.update({
      where: { id },
      data: {
        priority: body.priority ?? rule.priority,
        conditions: body.conditions ?? rule.conditions,
        action: body.action ?? rule.action,
        enabled: body.enabled ?? rule.enabled,
      },
    });

    return {
      success: true,
      message: "Rule updated successfully",
      rule: updated,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an existing dynamic rule" })
  async deleteRule(@ReqSession() session: any, @Param("id") id: string) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const rule = await this.prisma.rule.findUnique({ where: { id } });

    if (!rule || rule.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized access to this rule");
    }

    await this.prisma.rule.delete({ where: { id } });

    return {
      success: true,
      message: "Rule deleted successfully",
    };
  }
}

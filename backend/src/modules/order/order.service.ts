import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskEngineService } from '../risk/risk.service';
import { fetchOrders, fetchOrderById, bulkUpdateOrdersByIds } from '../../lib/dataAccess';
import { demoOrders, isDemoDataMode } from '../../lib/demoData';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskEngine: RiskEngineService,
  ) {}

  async listOrders(merchantId: string, query: any) {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 5;
    const skip = (page - 1) * limit;

    const status = query.status as string | undefined;
    const risk = query.risk as string | undefined;
    const search = query.search as string | undefined;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as string) || 'desc';

    const where: any = { merchantId };

    if (status) {
      where.protectionStatus = status;
    }
    if (risk) {
      if (risk === 'HIGH') where.riskScore = { gte: 75 };
      else if (risk === 'MEDIUM') where.riskScore = { gte: 40, lt: 75 };
      else if (risk === 'LOW') where.riskScore = { lt: 40 };
    }
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { phone: { contains: search } },
        { pincode: { contains: search } },
      ];
    }

    if (isDemoDataMode()) {
      let items = [...demoOrders].filter(o => o.merchantId === merchantId);

      if (status) {
        items = items.filter(o => o.protectionStatus === status);
      }
      if (risk) {
        if (risk === 'HIGH') items = items.filter(o => o.riskScore >= 75);
        else if (risk === 'MEDIUM') items = items.filter(o => o.riskScore >= 40 && o.riskScore < 75);
        else if (risk === 'LOW') items = items.filter(o => o.riskScore < 40);
      }
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(o => 
          o.id.toLowerCase().includes(s) || 
          o.phone.includes(s) || 
          o.pincode.includes(s)
        );
      }

      items.sort((a, b) => {
        const valA = (a as any)[sortBy];
        const valB = (b as any)[sortBy];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = items.length;
      const paginated = items.slice(skip, skip + limit);

      return {
        orders: paginated,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderDetails(merchantId: string, id: string) {
    const order = await fetchOrderById(id);
    if (!order || order.merchantId !== merchantId) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async bulkUpdate(merchantId: string, body: any) {
    const { orderIds, action } = body;
    if (!Array.isArray(orderIds) || !orderIds.length) {
      throw new BadRequestException("Order IDs array is required");
    }

    let protectionStatus = "Protected";
    if (action === "verify") {
      protectionStatus = "Protected";
    } else if (action === "cancel") {
      protectionStatus = "Failed";
    } else {
      throw new BadRequestException("Invalid bulk action requested");
    }

    const updated = await bulkUpdateOrdersByIds(orderIds, action as any);
    const scoped = updated.filter((o: any) => o.merchantId === merchantId);

    return scoped;
  }

  async processRiskCheck(merchant: any, body: any) {
    const { phone, pincode, value, address } = body;

    if (!phone || !pincode || value === undefined) {
      throw new BadRequestException("Required fields missing: phone, pincode, and value are required");
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      throw new BadRequestException("Valid numeric order value is required");
    }

    const assessment = await this.riskEngine.calculateRisk(
      phone.trim(),
      pincode.trim(),
      orderValue,
      address,
    );

    let protectionStatus = "Protected";
    if (assessment.action === "OTP_REQUIRED") {
      protectionStatus = "Held";
    } else if (assessment.action === "PREPAID_ONLY" || assessment.action === "REJECT_ORDER") {
      protectionStatus = "Failed";
    }

    let savedOrder: any;
    if (isDemoDataMode()) {
      savedOrder = {
        id: `b0000000-0000-4000-8000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        merchantId: merchant.id,
        phone: phone.trim(),
        pincode: pincode.trim(),
        value: orderValue,
        riskScore: assessment.score,
        protectionStatus,
        fulfillmentStatus: "Pending",
        fraudFlagged: false,
        statusReason: assessment.reasons.slice(0, 3).join(", "),
        createdAt: new Date(),
      };
      demoOrders.unshift(savedOrder);
    } else {
      savedOrder = await this.prisma.order.create({
        data: {
          merchantId: merchant.id,
          phone: phone.trim(),
          pincode: pincode.trim(),
          value: orderValue,
          riskScore: assessment.score,
          protectionStatus,
          statusReason: assessment.reasons.slice(0, 3).join(", "),
        },
      });
    }

    return {
      orderId: savedOrder.id,
      riskAssessment: {
        score: assessment.score,
        action: assessment.action,
        reasons: assessment.reasons,
      },
    };
  }
}

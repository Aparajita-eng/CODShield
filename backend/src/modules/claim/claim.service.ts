import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapClaimsForMerchant } from '../../lib/claimsView';
import { fetchMerchants, fetchClaimsForMerchant } from '../../lib/dataAccess';
import { demoClaims, demoOrders, isDemoDataMode } from '../../lib/demoData';

@Injectable()
export class ClaimService {
  constructor(private readonly prisma: PrismaService) {}

  async listClaims(merchantId: string, allowedIds: string[]) {
    const allMerchants = await fetchMerchants();
    const merchants = allMerchants.filter((m) => allowedIds.includes(m.id));

    const claims = await fetchClaimsForMerchant(merchantId);
    const items = mapClaimsForMerchant(claims, merchants, merchantId);

    const sanitizedMerchants = merchants.map(({ apiKeyHash, apiKeyMask, ...rest }) => rest);

    return {
      merchants: sanitizedMerchants,
      claims: items,
    };
  }

  async updateNotes(merchantId: string, claimId: string, notes: string) {
    const applyDemo = () => {
      const claim = demoClaims.find((c) => c.id === claimId);
      if (!claim) {
        throw new NotFoundException("Claim not found");
      }
      const order = demoOrders.find((o) => o.id === claim.orderId);
      if (!order || order.merchantId !== merchantId) {
        throw new NotFoundException("Claim not found");
      }
      claim.notes = notes;
      return claim;
    };

    if (isDemoDataMode()) {
      applyDemo();
      return;
    }

    try {
      const claim = await this.prisma.claim.findUnique({
        where: { id: claimId },
        include: { order: true },
      });

      if (!claim || !claim.order || claim.order.merchantId !== merchantId) {
        throw new NotFoundException("Claim not found");
      }

      await this.prisma.claim.update({
        where: { id: claimId },
        data: { notes },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const { Prisma } = require('@prisma/client');
      const isInitError = error instanceof Prisma.PrismaClientInitializationError ||
        (error instanceof Error && error.message.includes("Environment variable not found: DATABASE_URL"));
      if (isInitError) {
        applyDemo();
        return;
      }
      throw error;
    }
  }
}

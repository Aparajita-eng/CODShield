import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isDemoDataMode, DEMO_MERCHANT_ACME_ID } from '../../lib/demoData';
import { $Enums } from '@prisma/client';

type IntegrationProvider = $Enums.IntegrationProvider;
type IntegrationSyncMode = $Enums.IntegrationSyncMode;

// ─── Demo integrations stub ──────────────────────────────────────────────────
const DEMO_INTEGRATIONS = [
  {
    id: 'demo-integration-001',
    merchantId: DEMO_MERCHANT_ACME_ID,
    provider: 'DEMO',
    status: 'CONNECTED',
    syncMode: 'REALTIME',
    storeUrl: null,
    lastSync: new Date('2026-03-05T07:30:00Z').toISOString(),
    orderCount: 13,
    createdAt: new Date('2025-06-01T00:00:00Z').toISOString(),
  },
];

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async listIntegrations(merchantId: string) {
    if (isDemoDataMode()) {
      return DEMO_INTEGRATIONS.filter((i) => i.merchantId === merchantId);
    }

    const integrations = await this.prisma.integration.findMany({
      where: { merchantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    return integrations.map((i) => ({
      id: i.id,
      merchantId: i.merchantId,
      provider: i.provider,
      status: i.status,
      syncMode: i.syncMode,
      storeUrl: i.storeUrl,
      lastSync: i.lastSync?.toISOString() || null,
      orderCount: i._count.orders,
      lastSyncStatus: i.syncLogs[0]?.status || null,
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async connectIntegration(merchantId: string, body: any) {
    const { provider, syncMode, storeUrl, apiKey, accessToken } = body;

    if (!provider) {
      throw new BadRequestException('Provider is required');
    }

    if (!['SHOPIFY', 'WOOCOMMERCE', 'MAGENTO', 'CUSTOM_API', 'DEMO'].includes(provider)) {
      throw new BadRequestException('Invalid provider');
    }

    if (!syncMode || !['REALTIME', 'SCHEDULED', 'MANUAL'].includes(syncMode)) {
      throw new BadRequestException('Valid syncMode is required (REALTIME, SCHEDULED, or MANUAL)');
    }

    if (isDemoDataMode()) {
      // Return a simulated connection for demo mode
      return {
        id: `demo-${provider.toLowerCase()}-${Date.now()}`,
        merchantId,
        provider,
        status: 'CONNECTED',
        syncMode,
        storeUrl: storeUrl || null,
        lastSync: null,
        orderCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    // Check for duplicate active integration for same provider
    const existing = await this.prisma.integration.findFirst({
      where: { merchantId, provider: provider as IntegrationProvider, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`An active ${provider} integration already exists`);
    }

    const integration = await this.prisma.integration.create({
      data: {
        merchantId,
        provider: provider as IntegrationProvider,
        status: 'CONNECTED',
        syncMode: syncMode as IntegrationSyncMode,
        storeUrl: storeUrl || null,
        apiKey: apiKey || null,
        accessToken: accessToken || null,
      },
      include: {
        _count: { select: { orders: true } },
      },
    });

    return {
      id: integration.id,
      merchantId: integration.merchantId,
      provider: integration.provider,
      status: integration.status,
      syncMode: integration.syncMode,
      storeUrl: integration.storeUrl,
      lastSync: null,
      orderCount: 0,
      createdAt: integration.createdAt.toISOString(),
    };
  }

  async syncIntegration(merchantId: string, integrationId: string) {
    if (isDemoDataMode()) {
      return {
        importedCount: 0,
        skippedCount: 13,
        failedCount: 0,
        durationMs: 142,
        lastSync: new Date().toISOString(),
      };
    }

    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, merchantId, deletedAt: null },
    });
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const startedAt = new Date();

    // In a real system this would call the provider's webhook/API
    // For now we record a successful sync log with 0 new orders
    const log = await this.prisma.syncLog.create({
      data: {
        integrationId,
        startedAt,
        completedAt: new Date(),
        importedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        status: 'SUCCESS',
        durationMs: Date.now() - startedAt.getTime(),
      },
    });

    // Update the integration's lastSync timestamp
    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { lastSync: new Date() },
    });

    return {
      importedCount: log.importedCount,
      skippedCount: log.skippedCount,
      failedCount: log.failedCount,
      durationMs: log.durationMs,
      lastSync: new Date().toISOString(),
    };
  }

  async disconnectIntegration(merchantId: string, integrationId: string) {
    if (isDemoDataMode()) {
      // Demo mode — guard against disconnecting the canonical demo integration
      if (integrationId === 'demo-integration-001') {
        throw new ForbiddenException('Cannot disconnect the demo integration');
      }
      return;
    }

    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, merchantId, deletedAt: null },
    });
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { deletedAt: new Date(), status: 'DISCONNECTED' },
    });
  }
}

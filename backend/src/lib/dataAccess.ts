import { Prisma, type Blacklist, type Merchant, type Order, type PincodeRisk } from "@prisma/client";
import { prisma } from "./db";
import {
  demoBlacklists,
  demoMerchants,
  demoOrders,
  demoPincodeRisks,
  isDemoDataMode,
} from "./demoData";

function isPrismaInitError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Error && error.message.includes("Environment variable not found: DATABASE_URL"))
  );
}

async function withData<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  if (isDemoDataMode()) return fallback();
  try {
    return await query();
  } catch (error) {
    if (isPrismaInitError(error)) {
      console.warn("Database unavailable — serving demo seed data.");
      return fallback();
    }
    throw error;
  }
}

function sortOrders(orders: Order[], orderBy?: Prisma.OrderOrderByWithRelationInput): Order[] {
  const sorted = [...orders];
  if (orderBy?.createdAt === "desc") {
    sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (orderBy?.createdAt === "asc") {
    sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  return sorted;
}

function filterOrders(orders: Order[], where?: Prisma.OrderWhereInput): Order[] {
  if (!where) return orders;

  return orders.filter((order) => {
    if (where.merchantId && order.merchantId !== where.merchantId) return false;
    if (where.pincode && order.pincode !== where.pincode) return false;
    if (typeof where.phone === "string" && order.phone !== where.phone) return false;
    if (where.phone && typeof where.phone === "object" && "contains" in where.phone) {
      const needle = String(where.phone.contains ?? "");
      if (!order.phone.includes(needle)) return false;
    }
    if (where.id && order.id !== where.id) return false;
    if (where.createdAt && typeof where.createdAt === "object" && !(where.createdAt instanceof Date)) {
      const createdAt = where.createdAt as { gte?: Date; lte?: Date };
      if (createdAt.gte && order.createdAt < createdAt.gte) return false;
      if (createdAt.lte && order.createdAt > createdAt.lte) return false;
    }
    return true;
  });
}

export async function fetchMerchants(): Promise<Merchant[]> {
  return withData(() => prisma.merchant.findMany(), () => demoMerchants);
}

export async function fetchMerchantById(id: string): Promise<Merchant | null> {
  return withData(
    () => prisma.merchant.findUnique({ where: { id } }),
    () => demoMerchants.find((m) => m.id === id) ?? null
  );
}

export async function fetchOrders(args?: {
  where?: Prisma.OrderWhereInput;
  orderBy?: Prisma.OrderOrderByWithRelationInput;
}): Promise<Order[]> {
  return withData(
    () =>
      prisma.order.findMany({
        where: args?.where,
        orderBy: args?.orderBy ?? { createdAt: "desc" },
      }),
    () => sortOrders(filterOrders(demoOrders, args?.where), args?.orderBy)
  );
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  return withData(
    () => prisma.order.findUnique({ where: { id } }),
    () => demoOrders.find((o) => o.id === id) ?? null
  );
}

export async function fetchBlacklists(args?: { phones?: string[] }): Promise<Blacklist[]> {
  return withData(
    () =>
      prisma.blacklist.findMany(
        args?.phones ? { where: { phone: { in: args.phones } } } : undefined
      ),
    () =>
      args?.phones
        ? demoBlacklists.filter((b) => args.phones!.includes(b.phone))
        : demoBlacklists
  );
}

export async function fetchBlacklistByPhone(phone: string): Promise<Blacklist | null> {
  return withData(
    () => prisma.blacklist.findUnique({ where: { phone } }),
    () => demoBlacklists.find((b) => b.phone === phone) ?? null
  );
}

export async function fetchPincodeRisk(pincode: string): Promise<PincodeRisk | null> {
  return withData(
    () => prisma.pincodeRisk.findUnique({ where: { pincode } }),
    () => demoPincodeRisks.find((p) => p.pincode === pincode) ?? null
  );
}

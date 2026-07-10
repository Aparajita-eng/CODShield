import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clean existing data
  await prisma.claim.deleteMany();
  await prisma.order.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.pincodeRisk.deleteMany();
  await prisma.blacklist.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Merchants
  const merchants = [
    {
      name: "Acme Apparel",
      apiKey: "codshield_live_acme_growth_9843",
      tier: "Growth",
      claimRatio: 4.0,
    },
    {
      name: "Beta Electronics",
      apiKey: "codshield_live_beta_starter_1294",
      tier: "Starter",
      claimRatio: 1.5,
    },
    {
      name: "Delta Direct",
      apiKey: "codshield_live_delta_enterprise_0481",
      tier: "Enterprise",
      claimRatio: 9.5,
    },
  ];

  const createdMerchants = [];
  for (const m of merchants) {
    const merchant = await prisma.merchant.create({
      data: m,
    });
    createdMerchants.push(merchant);
  }
  console.log(`Seeded ${createdMerchants.length} merchants.`);

  // Demo dashboard user (password: Demo@1234)
  await prisma.user.create({
    data: {
      email: "demo@codshield.com",
      passwordHash: hashPassword("Demo@1234"),
      name: "Demo Merchant",
      companyName: "FastCommerce Inc.",
      phone: "+919876543210",
    },
  });
  console.log("Seeded demo user (demo@codshield.com / Demo@1234).");

  const acmeId = createdMerchants[0].id;

  // 2. Seed Pincodes Risk Weights
  const pincodes = [
    { pincode: "560034", riskWeight: 0.15 }, // Koramangala, Bengaluru
    { pincode: "110044", riskWeight: 0.65 }, // Okhla, New Delhi
    { pincode: "400072", riskWeight: 0.85 }, // Saki Naka, Mumbai
    { pincode: "600041", riskWeight: 0.12 }, // Adyar, Chennai
    { pincode: "700091", riskWeight: 0.28 }, // Salt Lake, Kolkata
    { pincode: "500081", riskWeight: 0.18 }, // Madhapur, Hyderabad
    { pincode: "380009", riskWeight: 0.22 }, // Navrangpura, Ahmedabad
    { pincode: "411001", riskWeight: 0.20 }, // Pune Camp, Pune
    { pincode: "122001", riskWeight: 0.45 }, // Gurugram, Haryana
    { pincode: "201301", riskWeight: 0.55 }, // Noida, Uttar Pradesh
  ];

  for (const p of pincodes) {
    await prisma.pincodeRisk.create({
      data: p,
    });
  }
  console.log(`Seeded ${pincodes.length} pincodes.`);

  // 3. Seed Blacklisted Phones
  const blacklist = [
    {
      phone: "9123456780",
      refusalCount: 3,
      reason: "Repeat COD refusal (3 orders, 60 days)",
    },
    {
      phone: "9876543211",
      refusalCount: 2,
      reason: "Multiple accounts, same device ID",
    },
    {
      phone: "9998887776",
      refusalCount: 4,
      reason: "Address flagged by another merchant",
    },
    {
      phone: "8887776665",
      refusalCount: 1,
      reason: "Delivery attempt cancelled post-dispatch",
    },
  ];

  for (const b of blacklist) {
    await prisma.blacklist.create({
      data: b,
    });
  }
  console.log(`Seeded ${blacklist.length} blacklist records.`);

  // 4. Seed Initial Orders for Acme Apparel
  const orders = [
    {
      merchantId: acmeId,
      phone: "9876543210",
      pincode: "560034",
      value: 1240.0,
      riskScore: 27,
      protectionStatus: "Protected",
      fulfillmentStatus: "Delivered",
      statusReason: "Low risk pincode and clear phone history",
      createdAt: new Date("2026-01-12T10:30:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9876543210",
      pincode: "560034",
      value: 2180.0,
      riskScore: 22,
      protectionStatus: "Protected",
      fulfillmentStatus: "Delivered",
      statusReason: "Repeat buyer with clean delivery history",
      createdAt: new Date("2025-11-08T14:15:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9876543210",
      pincode: "500081",
      value: 890.0,
      riskScore: 18,
      protectionStatus: "Protected",
      fulfillmentStatus: "Delivered",
      statusReason: "Low order value. Verified pincode",
      createdAt: new Date("2025-09-20T09:00:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9876543210",
      pincode: "600041",
      value: 1560.0,
      riskScore: 24,
      protectionStatus: "Protected",
      fulfillmentStatus: "Shipped",
      statusReason: "Standard COD order in transit",
      createdAt: new Date("2026-03-02T11:45:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9123456780",
      pincode: "110044",
      value: 3890.0,
      riskScore: 58,
      protectionStatus: "Held",
      fulfillmentStatus: "Pending",
      statusReason: "[cluster:cod-ring-delhi] Medium risk pincode. Phone blacklisted with 3 refusals. OTP verification required",
      createdAt: new Date("2026-02-18T16:20:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9123456780",
      pincode: "122001",
      value: 2450.0,
      riskScore: 62,
      protectionStatus: "Held",
      fulfillmentStatus: "RTO",
      statusReason: "[cluster:cod-ring-delhi] Buyer refused delivery at doorstep",
      createdAt: new Date("2025-12-05T08:30:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9123456780",
      pincode: "201301",
      value: 1720.0,
      riskScore: 55,
      protectionStatus: "Failed",
      fulfillmentStatus: "RTO",
      statusReason: "[cluster:cod-ring-delhi] Multiple delivery attempts failed",
      createdAt: new Date("2025-10-14T13:10:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9998887776",
      pincode: "400072",
      value: 6150.0,
      riskScore: 88,
      protectionStatus: "Failed",
      fulfillmentStatus: "RTO",
      fraudFlagged: true,
      statusReason: "[cluster:cod-ring-delhi] High risk pincode. Phone blacklisted with 4 refusals",
      createdAt: new Date("2026-01-28T12:00:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9998887776",
      pincode: "400072",
      value: 4820.0,
      riskScore: 82,
      protectionStatus: "Failed",
      fulfillmentStatus: "Cancelled",
      fraudFlagged: true,
      statusReason: "[cluster:cod-ring-delhi] Manually flagged as fraud by merchant",
      createdAt: new Date("2025-11-22T17:40:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9998887776",
      pincode: "110044",
      value: 3290.0,
      riskScore: 76,
      protectionStatus: "Failed",
      fulfillmentStatus: "RTO",
      fraudFlagged: true,
      statusReason: "[cluster:cod-ring-delhi] Address mismatch flagged during verification",
      createdAt: new Date("2025-09-03T10:05:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "8887776665",
      pincode: "600041",
      value: 980.0,
      riskScore: 15,
      protectionStatus: "Protected",
      fulfillmentStatus: "Verified",
      statusReason: "Low risk order value. Clear phone history. Verified pincode",
      createdAt: new Date("2026-02-10T15:25:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "8887776665",
      pincode: "600041",
      value: 1340.0,
      riskScore: 19,
      protectionStatus: "Protected",
      fulfillmentStatus: "Delivered",
      statusReason: "Successful repeat delivery to same pincode",
      createdAt: new Date("2025-12-18T09:50:00Z"),
    },
    {
      merchantId: acmeId,
      phone: "9876543211",
      pincode: "380009",
      value: 2100.0,
      riskScore: 48,
      protectionStatus: "Held",
      fulfillmentStatus: "Pending",
      statusReason: "Multiple accounts linked to same device ID",
      createdAt: new Date("2026-03-05T07:15:00Z"),
    },
  ];

  for (const o of orders) {
    await prisma.order.create({
      data: o,
    });
  }
  console.log(`Seeded ${orders.length} initial orders.`);

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

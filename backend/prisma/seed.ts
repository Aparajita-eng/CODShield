import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import {
  DEMO_MERCHANT_ACME_ID,
  DEMO_MERCHANT_BETA_ID,
  DEMO_MERCHANT_DELTA_ID,
} from "../src/lib/demoData";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clean existing data (users before merchants — User.merchantId FK)
  await prisma.claim.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.pincodeRisk.deleteMany();
  await prisma.blacklist.deleteMany();

  // 1. Seed Merchants
  const merchants = [
    {
      id: DEMO_MERCHANT_ACME_ID,
      name: "Acme Apparel",
      apiKey: "codshield_live_acme_growth_9843",
      tier: "Growth",
      claimRatio: 4.0,
    },
    {
      id: DEMO_MERCHANT_BETA_ID,
      name: "Beta Test Co.",
      apiKey: "codshield_live_beta_starter_1294",
      tier: "Starter",
      claimRatio: 1.5,
    },
    {
      id: DEMO_MERCHANT_DELTA_ID,
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

  const acmeId = createdMerchants[0].id;
  const betaId = createdMerchants[1].id;

  // Demo dashboard user (password: Demo@1234) — linked to Acme via merchantId FK
  await prisma.user.create({
    data: {
      email: "demo@codshield.com",
      passwordHash: hashPassword("Demo@1234"),
      name: "Demo Merchant",
      companyName: "FastCommerce Inc.",
      phone: "+919876543210",
      merchantId: acmeId,
    },
  });
  console.log("Seeded demo user (demo@codshield.com / Demo@1234) → Acme Apparel.");

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
  console.log(`Seeded ${orders.length} Acme orders.`);

  // Claims linked to RTO orders (indices match demoData claim seeds)
  const rtoOrders = await prisma.order.findMany({
    where: { merchantId: acmeId, fulfillmentStatus: "RTO" },
    orderBy: { createdAt: "asc" },
    take: 4,
  });
  const paidOrder = await prisma.order.findFirst({
    where: {
      merchantId: acmeId,
      fulfillmentStatus: "Delivered",
      value: 890,
    },
  });

  const claimSeeds: Array<{
    id: string;
    orderId: string;
    proofUrl: string;
    status: string;
    step: number;
    notes?: string | null;
    createdAt: Date;
  }> = [];

  if (rtoOrders[0]) {
    claimSeeds.push({
      id: "c0000000-0000-4000-8000-000000000001",
      orderId: rtoOrders[0].id,
      proofUrl: "https://dispatch.courier/returns/pod-refusal.pdf",
      status: "Pending",
      step: 1,
      notes: "Awaiting POD response from courier partner.",
      createdAt: new Date("2026-02-20T10:00:00Z"),
    });
  }
  if (rtoOrders[1]) {
    claimSeeds.push({
      id: "c0000000-0000-4000-8000-000000000002",
      orderId: rtoOrders[1].id,
      proofUrl: "https://dispatch.courier/returns/delivery-failure.pdf",
      status: "Under Review",
      step: 2,
      notes: "Logistics partner reported delivery address could not be located.",
      createdAt: new Date("2025-10-20T09:30:00Z"),
    });
  }
  if (rtoOrders[2]) {
    claimSeeds.push({
      id: "c0000000-0000-4000-8000-000000000003",
      orderId: rtoOrders[2].id,
      proofUrl: "https://dispatch.courier/returns/rto-proof.pdf",
      status: "Approved",
      step: 3,
      notes: "RTO confirmed. Reimbursement processed to merchant wallet.",
      createdAt: new Date("2026-02-01T14:15:00Z"),
    });
  }
  if (rtoOrders[3]) {
    claimSeeds.push({
      id: "c0000000-0000-4000-8000-000000000004",
      orderId: rtoOrders[3].id,
      proofUrl: "https://dispatch.courier/returns/address-mismatch.pdf",
      status: "Rejected",
      step: 3,
      notes: "Claim rejected due to matching customer phone geolocation history.",
      createdAt: new Date("2025-09-10T11:00:00Z"),
    });
  }
  if (paidOrder) {
    claimSeeds.push({
      id: "c0000000-0000-4000-8000-000000000005",
      orderId: paidOrder.id,
      proofUrl: "https://dispatch.courier/returns/payout-claim.pdf",
      status: "Paid",
      step: 4,
      notes: "Payout verified. INR 890 credited to account bank balance.",
      createdAt: new Date("2025-10-01T08:00:00Z"),
    });
  }

  for (const claim of claimSeeds) {
    await prisma.claim.create({ data: claim });
  }
  if (claimSeeds.length) {
    console.log(`Seeded ${claimSeeds.length} Acme claims.`);
  }

  // Cross-merchant auth test fixture — Beta Test Co. only (not visible in Acme-scoped dashboards)
  await prisma.order.create({
    data: {
      id: "b0000000-0000-4000-8000-0000000000999",
      merchantId: betaId,
      phone: "9000000001",
      pincode: "411001",
      value: 1500.0,
      riskScore: 35,
      protectionStatus: "Held",
      fulfillmentStatus: "Pending",
      statusReason: "[fixture:beta-test-co] Cross-merchant auth test order — Beta Test Co. only",
      createdAt: new Date("2026-03-01T10:00:00Z"),
    },
  });
  console.log("Seeded Beta Test Co. fixture order for cross-merchant auth tests.");

  // Seed a claim for the Beta Test Co. order to test cross-merchant auth boundary
  await prisma.claim.create({
    data: {
      id: "c0000000-0000-4000-8000-000000000999",
      orderId: "b0000000-0000-4000-8000-0000000000999",
      proofUrl: "https://dispatch.courier/returns/beta-refusal.pdf",
      status: "Pending",
      step: 1,
      notes: "Beta Test Co. private claim notes.",
      createdAt: new Date("2026-03-02T10:00:00Z"),
    },
  });
  console.log("Seeded Beta Test Co. claim fixture for cross-merchant auth tests.");

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

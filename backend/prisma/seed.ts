import { PrismaClient, IntegrationProvider, PaymentMode, OverallStatus, VerificationStatus } from "@prisma/client";
import { hashPassword, hashApiKey } from "../src/lib/auth";
import {
  DEMO_MERCHANT_ACME_ID,
  DEMO_MERCHANT_BETA_ID,
  DEMO_MERCHANT_DELTA_ID,
} from "../src/lib/demoData";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clean existing data in dependency order
  await prisma.notificationLog.deleteMany();
  await prisma.merchantDecision.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.verificationJob.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.order.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.pincodeRisk.deleteMany();
  await prisma.blacklist.deleteMany();

  // 1. Seed Merchants
  const merchants = [
    {
      id: DEMO_MERCHANT_ACME_ID,
      name: "Acme Apparel",
      apiKeyHash: hashApiKey("codshield_live_acme_growth_9843"),
      apiKeyMask: "codshield_live_acme_••••••••_9843",
      tier: "Growth",
      claimRatio: 4.0,
    },
    {
      id: DEMO_MERCHANT_BETA_ID,
      name: "Beta Test Co.",
      apiKeyHash: hashApiKey("codshield_live_beta_starter_1294"),
      apiKeyMask: "codshield_live_beta_••••••••_1294",
      tier: "Starter",
      claimRatio: 1.5,
    },
    {
      id: DEMO_MERCHANT_DELTA_ID,
      name: "Delta Direct",
      apiKeyHash: hashApiKey("codshield_live_delta_enterprise_0481"),
      apiKeyMask: "codshield_live_delta_••••••••_0481",
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

  // Demo dashboard user (password: Demo@1234)
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
    { pincode: "560034", riskWeight: 0.15 },
    { pincode: "110044", riskWeight: 0.65 },
    { pincode: "400072", riskWeight: 0.85 },
    { pincode: "600041", riskWeight: 0.12 },
    { pincode: "700091", riskWeight: 0.28 },
    { pincode: "500081", riskWeight: 0.18 },
    { pincode: "380009", riskWeight: 0.22 },
    { pincode: "411001", riskWeight: 0.20 },
    { pincode: "122001", riskWeight: 0.45 },
    { pincode: "201301", riskWeight: 0.55 },
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

  // 4. Seed Buyers
  const buyersData = [
    { name: "Demo Customer", phone: "9876543210", email: "demo.cust@codshield.com", trustScore: 92, totalOrders: 10, successfulDeliveries: 9, rtoCount: 1 },
    { name: "Delhi COD Ring Buyer", phone: "9123456780", email: "delhi.buyer@codshield.com", trustScore: 40, totalOrders: 5, successfulDeliveries: 2, rtoCount: 3 },
    { name: "Mumbai Fraud Suspect", phone: "9998887776", email: "mumbai.fraud@codshield.com", trustScore: 12, totalOrders: 6, successfulDeliveries: 0, rtoCount: 6 },
    { name: "Chennai Verified Repeat", phone: "8887776665", email: "chennai.repeat@codshield.com", trustScore: 98, totalOrders: 15, successfulDeliveries: 15, rtoCount: 0 },
    { name: "Ahmedabad Buyer", phone: "9876543211", email: "ahmed.buyer@codshield.com", trustScore: 68, totalOrders: 4, successfulDeliveries: 2, rtoCount: 2 },
  ];

  const buyersMap = new Map<string, string>(); // phone -> id
  for (const b of buyersData) {
    const buyer = await prisma.buyer.create({ data: b });
    buyersMap.set(b.phone, buyer.id);
  }
  console.log(`Seeded ${buyersData.length} buyers.`);

  // 5. Seed Initial Orders
  const ordersSeeds = [
    {
      merchantId: acmeId,
      buyerPhone: "9876543210",
      value: 1240.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1001",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-01-12T10:30:00Z"),
      address: { name: "Demo Customer", phone: "9876543210", line1: "Flat 202, Acme Apt", city: "Bengaluru", state: "Karnataka", pincode: "560034" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9876543210",
      value: 2180.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1002",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-11-08T14:15:00Z"),
      address: { name: "Demo Customer", phone: "9876543210", line1: "Flat 202, Acme Apt", city: "Bengaluru", state: "Karnataka", pincode: "560034" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9876543210",
      value: 890.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1003",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-09-20T09:00:00Z"),
      address: { name: "Demo Customer", phone: "9876543210", line1: "Flat 202, Acme Apt", city: "Hyderabad", state: "Telangana", pincode: "500081" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9876543210",
      value: 1560.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1004",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-03-02T11:45:00Z"),
      address: { name: "Demo Customer", phone: "9876543210", line1: "Flat 202, Acme Apt", city: "Chennai", state: "Tamil Nadu", pincode: "600041" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9123456780",
      value: 3890.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.HELD,
      verificationStatus: VerificationStatus.PENDING,
      externalOrderId: "#1005",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-02-18T16:20:00Z"),
      address: { name: "Delhi COD Ring Buyer", phone: "9123456780", line1: "House 10, Okhla", city: "New Delhi", state: "Delhi", pincode: "110044" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9123456780",
      value: 2450.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.HELD,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1006",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-12-05T08:30:00Z"),
      address: { name: "Delhi COD Ring Buyer", phone: "9123456780", line1: "Sector 15", city: "Gurugram", state: "Haryana", pincode: "122001" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9123456780",
      value: 1720.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.FAILED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1007",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-10-14T13:10:00Z"),
      address: { name: "Delhi COD Ring Buyer", phone: "9123456780", line1: "Sector 62", city: "Noida", state: "Uttar Pradesh", pincode: "201301" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9998887776",
      value: 6150.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.FAILED,
      verificationStatus: VerificationStatus.REJECTED,
      externalOrderId: "#1008",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-01-28T12:00:00Z"),
      address: { name: "Mumbai Fraud Suspect", phone: "9998887776", line1: "Saki Naka", city: "Mumbai", state: "Maharashtra", pincode: "400072" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9998887776",
      value: 4820.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.FAILED,
      verificationStatus: VerificationStatus.REJECTED,
      externalOrderId: "#1009",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-11-22T17:40:00Z"),
      address: { name: "Mumbai Fraud Suspect", phone: "9998887776", line1: "Saki Naka", city: "Mumbai", state: "Maharashtra", pincode: "400072" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "8887776665",
      value: 980.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1010",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-02-10T15:25:00Z"),
      address: { name: "Chennai Verified Repeat", phone: "8887776665", line1: "Adyar Main Road", city: "Chennai", state: "Tamil Nadu", pincode: "600041" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "8887776665",
      value: 1340.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.PROTECTED,
      verificationStatus: VerificationStatus.VERIFIED,
      externalOrderId: "#1011",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2025-12-18T09:50:00Z"),
      address: { name: "Chennai Verified Repeat", phone: "8887776665", line1: "Adyar Main Road", city: "Chennai", state: "Tamil Nadu", pincode: "600041" },
    },
    {
      merchantId: acmeId,
      buyerPhone: "9876543211",
      value: 2100.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.HELD,
      verificationStatus: VerificationStatus.PENDING,
      externalOrderId: "#1012",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-03-05T07:15:00Z"),
      address: { name: "Ahmedabad Buyer", phone: "9876543211", line1: "Navrangpura", city: "Ahmedabad", state: "Gujarat", pincode: "380009" },
    },
  ];

  for (const o of ordersSeeds) {
    const buyerId = buyersMap.get(o.buyerPhone);
    if (!buyerId) continue;

    const createdOrder = await prisma.order.create({
      data: {
        merchantId: o.merchantId,
        buyerId: buyerId,
        value: o.value,
        paymentMode: o.paymentMode,
        overallStatus: o.overallStatus,
        verificationStatus: o.verificationStatus,
        externalOrderId: o.externalOrderId,
        provider: o.provider,
        createdAt: o.createdAt,
      },
    });

    // Create shipping address
    await prisma.shippingAddress.create({
      data: {
        orderId: createdOrder.id,
        name: o.address.name,
        phone: o.address.phone,
        line1: o.address.line1,
        city: o.address.city,
        state: o.address.state,
        pincode: o.address.pincode,
      },
    });

    // Create default line item
    await prisma.orderItem.create({
      data: {
        orderId: createdOrder.id,
        productName: "Premium Apparels Pack",
        quantity: 1,
        price: o.value,
      },
    });
  }
  console.log("Seeded Acme orders and associated items + shipping addresses.");

  // Cross-merchant auth test fixture - Beta Test Co.
  const betaBuyer = await prisma.buyer.create({
    data: { name: "Beta Cross Buyer", phone: "9000000001", email: "beta@test.com", trustScore: 78 },
  });

  const betaOrder = await prisma.order.create({
    data: {
      id: "b0000000-0000-4000-8000-0000000000999",
      merchantId: betaId,
      buyerId: betaBuyer.id,
      value: 1500.0,
      paymentMode: PaymentMode.COD,
      overallStatus: OverallStatus.HELD,
      verificationStatus: VerificationStatus.PENDING,
      externalOrderId: "#9999",
      provider: IntegrationProvider.DEMO,
      createdAt: new Date("2026-03-01T10:00:00Z"),
    },
  });

  await prisma.shippingAddress.create({
    data: {
      orderId: betaOrder.id,
      name: "Beta Cross Buyer",
      phone: "9000000001",
      line1: "Beta Main Rd",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: betaOrder.id,
      productName: "Beta Brand Shirts",
      quantity: 1,
      price: 1500.0,
    },
  });
  console.log("Seeded Beta Test Co. fixture order.");

  // Seed a claim for Acme
  const rtoOrders = await prisma.order.findMany({
    where: { merchantId: acmeId, overallStatus: OverallStatus.FAILED },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  if (rtoOrders[0]) {
    await prisma.claim.create({
      data: {
        id: "c0000000-0000-4000-8000-000000000001",
        orderId: rtoOrders[0].id,
        proofUrl: "https://dispatch.courier/returns/pod-refusal.pdf",
        status: "Pending",
        step: 1,
        notes: "Awaiting POD response from courier partner.",
        createdAt: new Date("2026-02-20T10:00:00Z"),
      },
    });
  }

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

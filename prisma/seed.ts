import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed database...");

  // Clean existing data
  await prisma.claim.deleteMany();
  await prisma.order.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.pincodeRisk.deleteMany();
  await prisma.blacklist.deleteMany();

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
      statusReason: "Low risk pincode and clear phone history",
    },
    {
      merchantId: acmeId,
      phone: "9123456780",
      pincode: "110044",
      value: 3890.0,
      riskScore: 58,
      protectionStatus: "Held",
      statusReason: "Medium risk pincode, phone blacklisted with 3 refusals, OTP verification required",
    },
    {
      merchantId: acmeId,
      phone: "9998887776",
      pincode: "400072",
      value: 6150.0,
      riskScore: 88,
      protectionStatus: "Failed",
      statusReason: "High risk pincode and phone blacklisted with 4 refusals",
    },
    {
      merchantId: acmeId,
      phone: "8887776665",
      pincode: "600041",
      value: 980.0,
      riskScore: 15,
      protectionStatus: "Protected",
      statusReason: "Low risk order value, clear phone history, and verified pincode",
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

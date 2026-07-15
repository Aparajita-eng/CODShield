const {PrismaClient} = require('@prisma/client');
(async ()=>{
  const prisma = new PrismaClient();
  try {
    const m = await prisma.merchant.create({ data: { name: 'ACME Co TEST ' + Date.now(), apiKeyHash: 'h', apiKeyMask: 'm', tier: 'Starter', claimRatio: 0 } });
    console.log('created merchant', m);
    const u = await prisma.user.create({ data: { email: 'apara+junk' + Date.now() + '@example.com', passwordHash: 'ph', name: 'A Test', companyName: 'ACME Co', phone: '+919876543210', merchantId: m.id, role: 'Owner' } });
    console.log('created user', u);
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/modules/prisma/prisma.service";
import { OrderWorkflowService } from "../src/modules/workflow/order-workflow.service";
import { VerificationWorkflowService } from "../src/modules/workflow/verification-workflow.service";
import { ShipmentWorkflowService } from "../src/modules/workflow/shipment-workflow.service";
import { RulesEngineService } from "../src/modules/rules/rules.service";
import { AuditLogService } from "../src/modules/audit/audit.service";
import { DEMO_MERCHANT_ACME_ID } from "../src/lib/demoData";

describe("CODShield V5 Full Orchestration E2E Suite", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orderWorkflow: OrderWorkflowService;
  let verificationWorkflow: VerificationWorkflowService;
  let shipmentWorkflow: ShipmentWorkflowService;
  let rulesEngine: RulesEngineService;
  let auditLogService: AuditLogService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    orderWorkflow = moduleFixture.get<OrderWorkflowService>(OrderWorkflowService);
    verificationWorkflow = moduleFixture.get<VerificationWorkflowService>(VerificationWorkflowService);
    shipmentWorkflow = moduleFixture.get<ShipmentWorkflowService>(ShipmentWorkflowService);
    rulesEngine = moduleFixture.get<RulesEngineService>(RulesEngineService);
    auditLogService = moduleFixture.get<AuditLogService>(AuditLogService);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it("should complete full order lifecycle: Import -> Risk -> Rule -> Verification -> Courier Ranking -> Dispatch", async () => {
    // 1. Create test buyer & order (idempotent via upsert)
    const buyer = await prisma.buyer.upsert({
      where: { phone: "9988776655" },
      update: {},
      create: {
        name: "E2E Orchestration Buyer",
        phone: "9988776655",
        email: "e2e.buyer@codshield.com",
        trustScore: 85,
      },
    });

    const order = await prisma.order.create({
      data: {
        merchantId: DEMO_MERCHANT_ACME_ID,
        buyerId: buyer.id,
        value: 1850.0,
        paymentMode: "COD",
        overallStatus: "IN_PROGRESS",
        verificationStatus: "PENDING",
        externalOrderId: "#E2E-1001",
        provider: "DEMO",
      },
    });

    await prisma.shippingAddress.create({
      data: {
        orderId: order.id,
        name: "E2E Orchestration Buyer",
        phone: "9988776655",
        line1: "100 Innovation Way",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560034",
      },
    });

    expect(order.id).toBeDefined();

    // 2. Trigger Order Ingestion & Risk Workflow
    const correlationId = `e2e-corr-${Date.now()}`;
    await orderWorkflow.processOrder(order.id, correlationId);

    // Verify order stage updated to TRUST_SCORE
    const updatedOrderAfterRisk = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrderAfterRisk?.riskScore).toBeGreaterThan(0);

    // 3. Evaluate Rules Engine
    const ruleEval = await rulesEngine.evaluateRules(updatedOrderAfterRisk, { score: updatedOrderAfterRisk?.riskScore || 35 }, buyer);
    expect(ruleEval).toBeDefined();

    // 4. Trigger Verification Workflow
    await verificationWorkflow.triggerVerification(order.id, correlationId);
    const jobs = await prisma.verificationJob.findMany({ where: { orderId: order.id } });
    expect(jobs.length).toBeGreaterThan(0);

    // Simulate positive customer callback response
    await verificationWorkflow.simulateVerificationCallback(order.id, jobs[0].id, "CONFIRMED", correlationId);
    const verifiedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(verifiedOrder?.verificationStatus).toBe("VERIFIED");

    // 5. Generate Courier Recommendations
    await shipmentWorkflow.generateRecommendations(order.id, correlationId);
    const recommendations = await prisma.logisticsRecommendation.findMany({
      where: { orderId: order.id },
      orderBy: { rank: "asc" },
    });
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].rank).toBe(1);

    // 6. Dispatch Shipment
    const shipment = await shipmentWorkflow.dispatchShipment(order.id, recommendations[0].courier, correlationId);
    expect(shipment).toBeDefined();
    expect(shipment.trackingId).toBeDefined();
    expect(shipment.status).toBe("DISPATCHED");

    // 7. Verify Audit Logs
    const logs = await auditLogService.getLogs(DEMO_MERCHANT_ACME_ID, correlationId);
    expect(logs.length).toBeGreaterThan(0);
  });
});

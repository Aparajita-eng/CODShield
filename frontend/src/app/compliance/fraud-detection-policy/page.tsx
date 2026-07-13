export default function FraudDetectionPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">Fraud Detection Policy</h1>
      <p className="text-sm text-ink-secondary mb-6">How CODShield detects and handles fraud, including data retention and escalation procedures.</p>

      <section className="prose prose-sm">
        <h2>Signals and Detection</h2>
        <p>We combine device, behavioral and historical signals with merchant rules and third-party data to assess order risk.</p>

        <h3>Data Retention</h3>
        <p>Event data and analysis results are retained according to the merchant agreement and applicable law.</p>
      </section>
    </main>
  );
}

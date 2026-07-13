export default function ClaimProcessSlaPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">Claim Process SLA</h1>
      <p className="text-sm text-ink-secondary mb-6">Service level commitments for claim acknowledgement and resolution.</p>

      <section className="prose prose-sm">
        <h2>SLAs</h2>
        <ul>
          <li>Acknowledgement: within 24 hours of submission</li>
          <li>Initial review: within 3 business days</li>
          <li>Resolution: depends on evidence and merchant cooperation</li>
        </ul>
      </section>
    </main>
  );
}

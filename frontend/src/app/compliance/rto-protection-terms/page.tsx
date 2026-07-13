export default function RtoProtectionTermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">RTO Protection Terms</h1>
      <p className="text-sm text-ink-secondary mb-6">Terms that govern return-to-origin (RTO) protection and coverage provided by CODShield.</p>

      <section className="prose prose-sm">
        <h2>Coverage</h2>
        <p>RTO protection covers eligible orders when the return is due to customer refusal or non-delivery caused by merchant errors as defined in the agreement.</p>

        <h3>Eligibility</h3>
        <ul>
          <li>Orders confirmed through verified OTP at time of dispatch</li>
          <li>Valid tracking number and carrier proof</li>
        </ul>
      </section>
    </main>
  );
}

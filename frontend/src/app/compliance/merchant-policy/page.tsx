export default function MerchantPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">Merchant Policy</h1>
      <p className="text-sm text-ink-secondary mb-6">This page describes merchant obligations, prohibited items, and dispute handling for CODShield customers.</p>

      <section className="prose prose-sm">
        <h2>Overview</h2>
        <p>Merchants using CODShield must adhere to applicable laws and the terms agreed in the merchant on-boarding contract.</p>

        <h3>Prohibited Items</h3>
        <ul>
          <li>Illegal goods or services</li>
          <li>Counterfeit or stolen products</li>
          <li>Items restricted by carrier or local law</li>
        </ul>

        <h3>Disputes & Chargebacks</h3>
        <p>Merchants should respond to disputes within 7 business days and provide required proof of delivery and transaction logs.</p>
      </section>
    </main>
  );
}

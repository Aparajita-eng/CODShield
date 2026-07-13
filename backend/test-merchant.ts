
import { hashApiKey } from './src/lib/auth';
import { demoMerchants } from './src/lib/demoData';

console.log('API Key: codshield_live_acme_test_1234');
console.log('Hash:', hashApiKey('codshield_live_acme_test_1234'));

console.log('\nDemo Merchants:');
for (const m of demoMerchants) {
  console.log(`- ${m.name} (id: ${m.id}): hash: ${m.apiKeyHash}`);
}

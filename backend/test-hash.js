
const crypto = require('crypto');
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}
const apiKey = "codshield_live_demo_12345";
console.log(`API Key: ${apiKey}`);
console.log(`Hash: ${hashApiKey(apiKey)}`);

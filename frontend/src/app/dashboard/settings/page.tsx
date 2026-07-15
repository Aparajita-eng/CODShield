"use client";

import { useEffect, useState } from "react";
import {
  Building,
  Key,
  Webhook,
  Users,
  CreditCard,
  Layers,
  Bell,
  Lock,
  ClipboardList,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import DashboardModuleShell from "@/components/DashboardModuleShell";
import {
  updateCompany,
  regenerateApiKey,
  updatePassword,
  fetchTeam,
  fetchWebhooks,
  updateWebhooks,
  type TeamMember,
} from "@/lib/settings-api";

// Active tab types
type TabId =
  | "company"
  | "api-keys"
  | "webhooks"
  | "team"
  | "billing"
  | "integrations"
  | "notifications"
  | "security"
  | "audit-logs";

interface TabOption {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

const TAB_OPTIONS: TabOption[] = [
  { id: "company", label: "Company Profile", icon: Building },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "team", label: "Team Members", icon: Users },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Layers },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Pass", icon: Lock },
  { id: "audit-logs", label: "Audit Logs", icon: ClipboardList },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Shared loaded state (from /api/dashboard/data)
  const [merchantTier, setMerchantTier] = useState("Starter");
  const [apiKeyMask, setApiKeyMask] = useState("");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");

  // 1. Company Module State
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("contact@acme.com");
  const [businessAddress, setBusinessAddress] = useState("123 Apparel Way, Bengaluru");

  // 2. API Keys Module State
  const [showApiKey, setShowApiKey] = useState(false);
  const [newPlaintextKey, setNewPlaintextKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // 3. Webhooks Module State
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["order.flagged"]);

  // 4. Team Module State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // 7. Notifications Module State
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyClaimChange, setNotifyClaimChange] = useState(true);

  // 8. Security Module State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Load initial merchant data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch("/api/dashboard/data");
        const json = await res.json();
        if (json.success && json.selectedMerchant) {
          const m = json.selectedMerchant;
          setCompanyName(m.name);
          setMerchantTier(m.tier);
          setApiKeyMask(m.apiKeyMask);
          setSelectedMerchantId(m.id);
        }
      } catch (err) {
        console.error("Failed to load initial settings config:", err);
      }
    }
    loadInitialData();
  }, []);

  // Fetch webhooks & team on tab changes
  useEffect(() => {
    let active = true;
    if (activeTab === "team" && selectedMerchantId) {
      fetchTeam(selectedMerchantId)
        .then((res) => {
          if (active && res.success && res.team) {
            setTeamMembers(res.team);
          }
        })
        .catch(console.error);
    } else if (activeTab === "webhooks" && selectedMerchantId) {
      fetchWebhooks(selectedMerchantId)
        .then((res) => {
          if (active && res.success && res.webhook) {
            setWebhookUrl(res.webhook.url);
            setWebhookEvents(res.webhook.events);
          }
        })
        .catch(console.error);
    }
    return () => {
      active = false;
    };
  }, [activeTab, selectedMerchantId]);

  // Actions
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateCompany(
        companyName,
        contactEmail,
        businessAddress,
        selectedMerchantId
      );
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.merchant) {
          setCompanyName(res.merchant.name);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Failed to update company settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure you want to regenerate your API key? The old key will immediately stop working.")) {
      return;
    }
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    setNewPlaintextKey(null);
    try {
      const res = await regenerateApiKey(selectedMerchantId);
      if (res.success && res.apiKey) {
        setNewPlaintextKey(res.apiKey);
        if (res.apiKeyMask) setApiKeyMask(res.apiKeyMask);
        setSuccessMsg("New API Key generated successfully! Copy it now.");
      } else {
        setErrorMsg(res.message || "Failed to regenerate API key");
      }
    } catch {
      setErrorMsg("Error regenerating API key");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhooks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updateWebhooks(webhookUrl, webhookEvents, selectedMerchantId);
      if (res.success) {
        setSuccessMsg(res.message || "Webhooks configuration saved.");
      } else {
        setErrorMsg(res.message || "Failed to save webhooks");
      }
    } catch {
      setErrorMsg("Error updating webhook config");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await updatePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNewKey = () => {
    if (newPlaintextKey) {
      navigator.clipboard.writeText(newPlaintextKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const toggleEventCheckbox = (event: string) => {
    if (webhookEvents.includes(event)) {
      setWebhookEvents(webhookEvents.filter((e) => e !== event));
    } else {
      setWebhookEvents([...webhookEvents, event]);
    }
  };

  return (
    <DashboardModuleShell
      title="Settings"
      description="Manage API keys, team roles, billing plans, and account configurations."
      icon={Layers}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 border border-border-default bg-bg-raised rounded-xl p-2.5 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {TAB_OPTIONS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === tab.id
                    ? "bg-accent-muted text-accent border-l-2 border-accent"
                    : "text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Content */}
        <div className="flex-1 w-full border border-border-default bg-bg-raised rounded-xl p-6 min-h-[420px]">
          {/* Status Message Banners */}
          {successMsg && (
            <div className="mb-5 p-3 rounded-lg border border-positive/20 bg-positive/5 text-xs text-positive font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg border border-negative/20 bg-negative/5 text-xs text-negative font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Module 1: Company Profile */}
          {activeTab === "company" && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Company Profile</h3>
                <p className="text-[10px] text-ink-tertiary">Configure the active merchant billing identity information.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="comp-name" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">
                    Merchant Name <span className="text-[9px] text-accent font-medium">(Database Backed)</span>
                  </label>
                  <input
                    id="comp-name"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">
                    Contact Email <span className="text-[9px] text-ink-tertiary font-medium">(Illustrative Placeholder)</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="biz-address" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">
                    Business Address <span className="text-[9px] text-ink-tertiary font-medium">(Illustrative Placeholder)</span>
                  </label>
                  <textarea
                    id="biz-address"
                    rows={2}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-xs font-bold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Changes
              </button>
            </form>
          )}

          {/* Module 2: API Keys */}
          {activeTab === "api-keys" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">API Key Management</h3>
                <p className="text-[10px] text-ink-tertiary">Cryptographic API keys used to authenticate checkout risk audits securely.</p>
              </div>

              {newPlaintextKey && (
                <div className="p-4 rounded-lg border border-positive/30 bg-positive/5 space-y-2">
                  <span className="text-[10px] font-bold text-positive uppercase block">Copy Plaintext Key (Will not show again!)</span>
                  <div className="flex items-center gap-2 bg-bg-base border border-border-default p-2.5 rounded justify-between font-mono text-xs text-ink-primary">
                    <span className="break-all select-all font-bold text-ink-primary">{newPlaintextKey}</span>
                    <button
                      onClick={handleCopyNewKey}
                      className="text-ink-secondary hover:text-accent p-1 cursor-pointer shrink-0 transition-colors"
                      title="Copy Key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedKey && <span className="text-[9px] text-positive font-bold block">Plaintext copied to clipboard.</span>}
                </div>
              )}

              <div className="space-y-3">
                <span className="block text-[10px] font-bold text-ink-secondary uppercase">Active Masked API Key</span>
                <div className="flex items-center gap-2 bg-bg-base border border-border-default p-2.5 rounded justify-between font-mono text-xs text-ink-primary">
                  <span className="break-all select-all text-ink-secondary">
                    {showApiKey ? apiKeyMask : "••••••••••••••••••••••••••••••••"}
                  </span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-ink-secondary hover:text-accent p-1 cursor-pointer shrink-0 transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-ink-tertiary">
                  Stored securely using SHA256 hashing. The plaintext is hidden to protect checkout log integrity.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegenerateKey}
                disabled={loading}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-negative text-xs font-bold text-white hover:bg-negative/95 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Regenerate API Key
              </button>
            </div>
          )}

          {/* Module 3: Webhooks */}
          {activeTab === "webhooks" && (
            <form onSubmit={handleSaveWebhooks} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div>
                  <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Webhook Dispatcher</h3>
                  <p className="text-[10px] text-ink-tertiary">Deliver real-time event updates to your servers.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-warning/10 text-warning text-[9px] font-bold border border-warning/20">
                  Config Storage Only
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="webhook-url" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">Webhook Target URL</label>
                  <input
                    id="webhook-url"
                    type="url"
                    required
                    placeholder="https://yourdomain.com/webhooks/codshield"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-ink-secondary uppercase mb-2">Subscribe to Events</span>
                  <div className="space-y-2">
                    {["order.flagged", "order.verified", "claim.updated", "claim.payout"].map((evt) => (
                      <label key={evt} className="flex items-center gap-2 text-xs text-ink-secondary font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(evt)}
                          onChange={() => toggleEventCheckbox(evt)}
                          className="rounded border-border-default text-accent focus:ring-accent"
                        />
                        {evt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-xs font-bold text-white hover:bg-accent/90 transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Save Webhook
              </button>
            </form>
          )}

          {/* Module 4: Team Members */}
          {activeTab === "team" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Team Directory</h3>
                <p className="text-[10px] text-ink-tertiary">Review database-backed teammates who have access to this merchant profile.</p>
              </div>

              {/* Members List */}
              <div className="border border-border-default rounded-lg divide-y divide-border-default overflow-hidden bg-bg-base">
                {teamMembers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink-secondary">No team members linked yet.</div>
                ) : (
                  teamMembers.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-ink-primary block">{m.name}</span>
                        <span className="text-[10px] text-ink-tertiary">{m.email}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-accent-muted text-accent font-bold text-[9px]">
                        {m.role}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Mock Invite Button */}
              <div className="pt-3 border-t border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-[10px] text-ink-tertiary font-medium">
                  <strong>Coming Soon:</strong> Invite Links and custom Role Scoping permissions settings.
                </p>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-border-default bg-bg-raised text-xs font-bold text-ink-secondary cursor-not-allowed opacity-50 shrink-0"
                >
                  Invite Teammate
                </button>
              </div>
            </div>
          )}

          {/* Module 5: Billing & Plans */}
          {activeTab === "billing" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Plan & Subscription</h3>
                <p className="text-[10px] text-ink-tertiary">Review subscription limits and protected insurance coverage tier.</p>
              </div>

              <div className="p-4 rounded-xl border border-accent/20 bg-accent-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-accent uppercase block">Active Plan Tier</span>
                  <span className="text-xl font-bold text-ink-primary">{merchantTier} Protection</span>
                </div>
                <div className="text-xs text-ink-secondary text-right">
                  <p>Up to 10k monthly checkouts</p>
                  <p>₹2,50,000 max coverage pool</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border-default">
                <span className="block text-[10px] font-bold text-ink-secondary uppercase">Plan Change Requests</span>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  To modify checkout limits, custom fraud clusters, or register new payment processors, contact the accounts desk.
                </p>
                <button
                  type="button"
                  onClick={() => alert("Redirecting to sales desk request form… (Static Demo Action)")}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-xs font-bold text-white hover:bg-accent/90 transition-colors"
                >
                  Contact Account Manager
                </button>
              </div>
            </div>
          )}

          {/* Module 6: Integrations */}
          {activeTab === "integrations" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Platform Integrations</h3>
                <p className="text-[10px] text-ink-tertiary">Review checkout endpoints and payment gateways active status.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border-default rounded-lg p-4 bg-bg-base flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs text-ink-primary block">Custom Checkout SDK</span>
                    <span className="text-[10px] text-ink-tertiary mt-1 block">Active on /v1/orders/risk-check</span>
                  </div>
                  <span className="text-[9px] font-bold bg-positive/10 text-positive border border-positive/20 px-2 py-0.5 rounded">Active</span>
                </div>

                <div className="border border-border-default rounded-lg p-4 bg-bg-base flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs text-ink-primary block">Shopify Gateway Connector</span>
                    <span className="text-[10px] text-ink-tertiary mt-1 block">RTO protection widget app</span>
                  </div>
                  <span className="text-[9px] font-bold bg-ink-tertiary/10 text-ink-tertiary border border-border-default px-2 py-0.5 rounded">Offline</span>
                </div>
              </div>
            </div>
          )}

          {/* Module 7: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-default pb-3">
                <div>
                  <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Notification Preferences</h3>
                  <p className="text-[10px] text-ink-tertiary">Select which system alerts route to your email inbox.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-warning/10 text-warning text-[9px] font-bold border border-warning/20">
                  Illustrative UI
                </span>
              </div>

              <div className="space-y-3.5">
                <label className="flex items-center justify-between p-3.5 rounded-lg border border-border-default bg-bg-base cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-ink-primary block">High Risk Order Alerts</span>
                    <span className="text-[10px] text-ink-tertiary">Notify when risk analysis exceeds score threshold (80+)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyHighRisk}
                    onChange={(e) => setNotifyHighRisk(e.target.checked)}
                    className="rounded text-accent"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-lg border border-border-default bg-bg-base cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-ink-primary block">Claim Status Updates</span>
                    <span className="text-[10px] text-ink-tertiary">Notify on approval, rejection, or reimbursement payouts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyClaimChange}
                    onChange={(e) => setNotifyClaimChange(e.target.checked)}
                    className="rounded text-accent"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setSuccessMsg("Preferences saved locally (Illustrative change).")}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-xs font-bold text-white hover:bg-accent/90 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* Module 8: Security (Password Update) */}
          {activeTab === "security" && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Security Settings</h3>
                <p className="text-[10px] text-ink-tertiary">Modify active user password credentials stored in database.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="curr-pass" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">Current Password</label>
                  <input
                    id="curr-pass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-pass" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">New Password</label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-pass" className="block text-[10px] font-bold text-ink-secondary uppercase mb-1">Confirm New Password</label>
                  <input
                    id="confirm-pass"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-medium text-ink-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-xs font-bold text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Update Password
              </button>
            </form>
          )}

          {/* Module 9: Audit Logs */}
          {activeTab === "audit-logs" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider mb-1">Activity Audit Trail</h3>
                <p className="text-[10px] text-ink-tertiary">Cryptographic append-only logs tracking sensitive admin mutations.</p>
              </div>

              <div className="relative border border-border-default bg-bg-base rounded-lg p-8 flex flex-col items-center justify-center min-h-[220px]">
                <AlertTriangle className="w-8 h-8 text-warning mb-2" />
                <span className="font-bold text-xs text-ink-primary">Audit Trails Coming Soon</span>
                <span className="text-[10px] text-ink-tertiary mt-1 text-center max-w-sm leading-relaxed">
                  Compliance grade activity logging (claim approvals, notes edits, key regenerations) is an Enterprise Protection tier feature.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardModuleShell>
  );
}

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WelcomeModal } from './features/onboarding/WelcomeModal';
import { DashboardView } from './features/dashboard/DashboardView';
import { AssistantView } from './features/assistant/AssistantView';
import { TransactionReviewModal } from './features/wallet/TransactionReviewModal';
import { PermissionCentreView } from './features/policies/PermissionCentreView';
import { ActivityView } from './features/activity/ActivityView';
import { SecurityAuditView } from './features/security/SecurityAuditView';
import { SettingsView } from './features/settings/SettingsView';
import { apiClient } from './services/apiClient';
import { WalletSummary, TransactionRecord, TransactionProposal, PolicyEvaluation } from './types';
import { CyberAnimatedBackground } from './components/CyberAnimatedBackground';

export const App: React.FC = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const [currentTab, setCurrentTab] = useState<string>(queryParams.get('tab') || 'dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(queryParams.get('onboarding') === 'true');
  const [isDemo, setIsDemo] = useState<boolean>(true);
  
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [activity, setActivity] = useState<TransactionRecord[]>([]);
  
  const [reviewProposal, setReviewProposal] = useState<TransactionProposal | null>(null);
  const [reviewEvaluation, setReviewEvaluation] = useState<PolicyEvaluation | null>(null);
  const [assistantPrefill, setAssistantPrefill] = useState<string>('');

  const walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

  const loadData = async () => {
    try {
      const s = await apiClient.getSummary(walletAddress);
      setSummary(s);
      const a = await apiClient.getActivity(walletAddress);
      setActivity(a);
    } catch (e) {
      console.warn('Error loading wallet data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenReview = (proposal: TransactionProposal, evaluation: PolicyEvaluation) => {
    setReviewProposal(proposal);
    setReviewEvaluation(evaluation);
  };

  const handleCloseReview = () => {
    setReviewProposal(null);
    setReviewEvaluation(null);
  };

  const handleSubmitted = () => {
    loadData();
  };

  const handleQuickCommand = (cmd: string) => {
    setAssistantPrefill(cmd);
    setCurrentTab('assistant');
  };

  return (
    <div className="min-h-screen bg-transparent text-guardian-textPrimary flex flex-col font-sans relative">
      <CyberAnimatedBackground />
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        summary={summary}
        isDemo={isDemo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            recentActivity={activity}
            onNavigate={setCurrentTab}
            onQuickCommand={handleQuickCommand}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'assistant' && (
          <AssistantView
            summary={summary}
            onOpenReview={handleOpenReview}
            prefillCommand={assistantPrefill}
          />
        )}

        {currentTab === 'permissions' && (
          <PermissionCentreView
            summary={summary}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityView
            transactions={activity}
          />
        )}

        {currentTab === 'security' && (
          <SecurityAuditView
            summary={summary}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            summary={summary}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-guardian-border py-4 text-center text-xs text-guardian-textMuted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Guardian Wallet © 2026 — FinTechathon Topic F: Agent Wallet</span>
          <span className="text-[11px] text-slate-500">
            Sepolia Testnet: 11155111 • Demo Mode: Local Verified
          </span>
        </div>
      </footer>

      {/* Screen A: Welcome Onboarding Modal */}
      {showOnboarding && (
        <WelcomeModal
          onEnterDemo={() => setShowOnboarding(false)}
          onConnectWallet={() => {
            setShowOnboarding(false);
            setIsDemo(false);
          }}
        />
      )}

      {/* Screen D: Transaction Review Modal */}
      {reviewProposal && reviewEvaluation && (
        <TransactionReviewModal
          proposal={reviewProposal}
          evaluation={reviewEvaluation}
          summary={summary}
          onClose={handleCloseReview}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
};

export default App;

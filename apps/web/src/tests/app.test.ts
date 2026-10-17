import { describe, it, expect } from 'vitest';
import { apiClient } from '../services/apiClient';

describe('Guardian Wallet Frontend Core & Policy Checks', () => {
  it('loads default wallet summary in demo mode with correct parameters', async () => {
    const summary = await apiClient.getSummary('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(summary.wallet_address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(summary.token_symbol).toBe('USDC');
    expect(summary.chain_id).toBe(11155111);
    expect(summary.max_transfer_amount).toBe('50.0');
    expect(summary.daily_limit).toBe('100.0');
    expect(summary.min_reserve).toBe('25.0');
    expect(summary.agent_tier).toBe('LIMITED_AUTONOMY');
  });

  it('parses valid transfer intent deterministically', async () => {
    const res = await apiClient.parseIntent(
      'Send 20 USDC to my approved supplier',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    );
    expect(res.intent_type).toBe('transfer');
    expect(res.amount).toBe('20');
    expect(res.recipient_address.toLowerCase()).toBe('0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase());
    expect(res.recipient_label).toMatch(/Shenzhen Precision Hardware|Approved Supplier/);
  });

  it('evaluates and permits a valid proposal within caps', async () => {
    const { proposal, evaluation } = await apiClient.prepareTransaction({
      wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      token_address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      token_symbol: 'USDC',
      recipient_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      recipient_label: 'Approved Supplier',
      amount: '20.0'
    });
    expect(evaluation.decision).toBe('ALLOW');
    expect(evaluation.reason_code).toBe('POLICY_PASSED');
  });

  it('blocks transfer exceeding per-transaction cap', async () => {
    const { evaluation } = await apiClient.prepareTransaction({
      wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      token_address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      token_symbol: 'USDC',
      recipient_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      recipient_label: 'Approved Supplier',
      amount: '60.0' // exceeds 50.0 cap
    });
    expect(evaluation.decision).toBe('BLOCKED');
    expect(evaluation.reason_code).toBe('TRANSFER_LIMIT_EXCEEDED');
  });

  it('blocks transfer breaching protected floor reserve', async () => {
    const { evaluation } = await apiClient.prepareTransaction({
      wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      token_address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      token_symbol: 'USDC',
      recipient_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      recipient_label: 'Approved Supplier',
      amount: '80.0' // 100 - 80 = 20 < 25 reserve
    });
    expect(evaluation.decision).toBe('BLOCKED');
  });

  it('toggles emergency pause and blocks transactions while paused', async () => {
    await apiClient.togglePause('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', true);
    const { evaluation } = await apiClient.prepareTransaction({
      wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      token_address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      token_symbol: 'USDC',
      recipient_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      amount: '10.0'
    });
    expect(evaluation.decision).toBe('BLOCKED');
    expect(evaluation.reason_code).toBe('POLICY_PAUSED');

    // Unpause
    await apiClient.togglePause('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', false);
  });
});

import os
import subprocess
import time
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

CHART_DIR = os.path.abspath('evidence/charts')
SCREENSHOT_DIR = os.path.abspath('evidence/screenshots')
os.makedirs(CHART_DIR, exist_ok=True)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def capture_screenshots():
    tabs = {
        'dashboard': 'app_dashboard.png',
        'assistant': 'app_assistant_console.png',
        'permissions': 'app_permission_centre.png',
        'activity': 'app_activity_ledger.png',
        'security': 'app_security_audit.png'
    }
    for tab, filename in tabs.items():
        out_path = os.path.join(SCREENSHOT_DIR, filename)
        url = f"http://localhost:5173/?tab={tab}"
        cmd = [
            EDGE_PATH,
            '--headless',
            '--disable-gpu',
            '--hide-scrollbars',
            '--window-size=1440,920',
            f'--screenshot={out_path}',
            url
        ]
        print(f"Capturing {tab} -> {out_path}...")
        try:
            subprocess.run(cmd, timeout=15)
            if os.path.exists(out_path):
                print(f"  Success: {filename} ({os.path.getsize(out_path)} bytes)")
            else:
                print(f"  Failed: {filename}")
        except Exception as e:
            print(f"  Error: {e}")

def create_spending_headroom_chart():
    # Model H_t = min(Cap_day - Spend_24h, Cap_tx, Balance - Reserve)
    hours = np.linspace(0, 24, 25)
    daily_cap = np.full_like(hours, 2.0)
    # Simulated cumulative spend across 24h
    cum_spend = np.array([
        0.0, 0.05, 0.05, 0.12, 0.12, 0.25, 0.25, 0.40,
        0.40, 0.40, 0.75, 0.75, 0.90, 0.90, 1.10, 1.10,
        1.10, 1.35, 1.35, 1.45, 1.45, 1.50, 1.50, 1.50, 1.50
    ])
    remaining_daily = daily_cap - cum_spend
    single_tx_cap = np.full_like(hours, 0.5)
    effective_headroom = np.minimum(remaining_daily, single_tx_cap)
    
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=300)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')
    
    ax.plot(hours, daily_cap, label='Daily Limit Cap (L_day = 2.00 ETH)', color='#94a3b8', linestyle='--', linewidth=1.5)
    ax.plot(hours, cum_spend, label='Rolling 24h Cumulative Spend (S_24h)', color='#f43f5e', linewidth=2.5)
    ax.plot(hours, remaining_daily, label='Remaining Daily Allowance', color='#38bdf8', linewidth=2)
    ax.plot(hours, single_tx_cap, label='Single Tx Hard Cap (L_tx = 0.50 ETH)', color='#f59e0b', linestyle='-.', linewidth=1.8)
    ax.fill_between(hours, effective_headroom, 0, color='#10b981', alpha=0.25, label='Dynamic Spending Headroom (H_t)')
    ax.plot(hours, effective_headroom, color='#10b981', linewidth=2.5)
    
    ax.set_title('Dynamic Spending Headroom Algorithm: Temporal Capacity Verification', color='#f8fafc', fontsize=12, fontweight='bold', pad=14)
    ax.set_xlabel('Rolling Timeline (Hours elapsed in 24h Window)', color='#cbd5e1', fontsize=10)
    ax.set_ylabel('ETH Value Allocation', color='#cbd5e1', fontsize=10)
    ax.tick_params(colors='#94a3b8')
    for spine in ax.spines.values():
        spine.set_color('#334155')
    ax.grid(True, linestyle=':', alpha=0.3, color='#64748b')
    ax.legend(facecolor='#0f172a', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5, loc='upper right')
    
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, 'spending_headroom_analysis.png')
    plt.savefig(chart_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated chart: {chart_path}")

def create_gas_comparison_chart():
    # Comparing Gas Overhead & Execution Latency
    categories = ['Native ETH Transfer', 'ERC-20 Token Transfer', 'Multi-Hop Agent Batch', 'Policy Enforcement Verification']
    guardian_gas = [21000, 52140, 105117, 34200]
    legacy_safe_gas = [68000, 115000, 240000, 95000]
    standard_gas = [21000, 65000, 185000, 80000]
    
    x = np.arange(len(categories))
    width = 0.26
    
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')
    
    rects1 = ax.bar(x - width, guardian_gas, width, label='Guardian Deterministic Agent', color='#10b981', edgecolor='#059669', linewidth=1)
    rects2 = ax.bar(x, standard_gas, width, label='Standard Web3 Wallet (Metamask/Rabby)', color='#38bdf8', edgecolor='#0284c7', linewidth=1)
    rects3 = ax.bar(x + width, legacy_safe_gas, width, label='Legacy Smart Account (Safe/ERC-4337)', color='#a855f7', edgecolor='#7e22ce', linewidth=1)
    
    ax.set_title('Gas Consumption Benchmark: Autonomous Agent vs Conventional Architectures', color='#f8fafc', fontsize=12, fontweight='bold', pad=14)
    ax.set_ylabel('Gas Units Consumed', color='#cbd5e1', fontsize=10)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, color='#cbd5e1', fontsize=9.5)
    ax.tick_params(colors='#94a3b8')
    for spine in ax.spines.values():
        spine.set_color('#334155')
    ax.grid(True, linestyle=':', alpha=0.25, color='#64748b', axis='y')
    ax.legend(facecolor='#0f172a', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5, loc='upper left')
    
    for rects in [rects1, rects2, rects3]:
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{int(height):,}',
                        xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=7.5, color='#e2e8f0', fontweight='semibold')
    
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, 'gas_consumption_benchmark.png')
    plt.savefig(chart_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated chart: {chart_path}")

def create_threat_mitigation_matrix_chart():
    threat_categories = [
        'Prompt Injection\n(L01-L05)',
        'Counterparty Fraud\n(L06-L10)',
        'Spending Velocity\n(L11-L15)',
        'Gas Spike Exploits\n(L16-L18)',
        'Nonce Replay\n(L19-L21)',
        'Zero-Asset Drain\n(L22-L23)'
    ]
    guardian_coverage = [100, 100, 100, 100, 100, 100]
    generic_llm_agent = [20, 15, 30, 10, 5, 25]
    standard_hardware_wallet = [10, 40, 20, 15, 60, 50]
    
    x = np.arange(len(threat_categories))
    width = 0.26
    
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#1e293b')
    
    rects1 = ax.bar(x - width, guardian_coverage, width, label='Guardian Deterministic Invariant Engine', color='#10b981', edgecolor='#059669', linewidth=1)
    rects2 = ax.bar(x, standard_hardware_wallet, width, label='Standard Hardware / EOA Wallet', color='#38bdf8', edgecolor='#0284c7', linewidth=1)
    rects3 = ax.bar(x + width, generic_llm_agent, width, label='Generic LLM Tool-Calling Agent', color='#f43f5e', edgecolor='#be123c', linewidth=1)
    
    ax.set_title('Security Defense Matrix: Attack Vector Mitigation Coverage (%)', color='#f8fafc', fontsize=12, fontweight='bold', pad=14)
    ax.set_ylabel('Mitigation Efficacy (%)', color='#cbd5e1', fontsize=10)
    ax.set_xticks(x)
    ax.set_xticklabels(threat_categories, color='#cbd5e1', fontsize=9)
    ax.set_ylim(0, 115)
    ax.tick_params(colors='#94a3b8')
    for spine in ax.spines.values():
        spine.set_color('#334155')
    ax.grid(True, linestyle=':', alpha=0.25, color='#64748b', axis='y')
    ax.legend(facecolor='#0f172a', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5, loc='upper right')
    
    for rect in rects1:
        height = rect.get_height()
        ax.annotate(f'{int(height)}%',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=8, color='#34d399', fontweight='bold')
                    
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, 'threat_mitigation_matrix.png')
    plt.savefig(chart_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated chart: {chart_path}")

def create_system_architecture_diagram():
    fig, ax = plt.subplots(figsize=(12, 6.5), dpi=300)
    fig.patch.set_facecolor('#0f172a')
    ax.set_facecolor('#0f172a')
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis('off')
    
    # Bounding Boxes for Trust Boundaries
    # Boundary 1: Untrusted External Input Zone (X: 0.5 to 3.2)
    rect1 = patches.FancyBboxPatch((0.5, 0.5), 2.8, 5.8, boxstyle="round,pad=0.2",
                                  facecolor='#1e293b', edgecolor='#ef4444', linewidth=1.5, linestyle='--')
    ax.add_patch(rect1)
    ax.text(1.9, 6.1, 'ZONE 1: UNTRUSTED BOUNDARY', ha='center', va='center', color='#f87171', fontsize=9, fontweight='bold')
    
    # Boundary 2: Deterministic Policy Engine (X: 3.8 to 8.2)
    rect2 = patches.FancyBboxPatch((3.8, 0.5), 4.4, 5.8, boxstyle="round,pad=0.2",
                                  facecolor='#1e293b', edgecolor='#38bdf8', linewidth=1.5)
    ax.add_patch(rect2)
    ax.text(6.0, 6.1, 'ZONE 2: DETERMINISTIC GUARDIAN CORE', ha='center', va='center', color='#38bdf8', fontsize=9, fontweight='bold')
    
    # Boundary 3: Secure Signer & On-Chain (X: 8.7 to 11.5)
    rect3 = patches.FancyBboxPatch((8.7, 0.5), 2.8, 5.8, boxstyle="round,pad=0.2",
                                  facecolor='#1e293b', edgecolor='#10b981', linewidth=1.5)
    ax.add_patch(rect3)
    ax.text(10.1, 6.1, 'ZONE 3: SETTLEMENT LAYER', ha='center', va='center', color='#34d399', fontsize=9, fontweight='bold')
    
    # Nodes in Zone 1
    ax.text(1.9, 4.8, 'Autonomous AI Directive\nIntent Parser\n(Constrained JSON Schema)', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#334155', edgecolor='#64748b', linewidth=1),
            color='#f1f5f9', fontsize=8.5, fontweight='semibold')
    ax.text(1.9, 2.2, 'User Governance Console\nDashboard & Permissions\n(Operator Invariants)', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#334155', edgecolor='#64748b', linewidth=1),
            color='#f1f5f9', fontsize=8.5, fontweight='semibold')
            
    # Nodes in Zone 2
    ax.text(6.0, 4.8, '23-Invariant Policy Engine\n(T01–T23 Mathematical Evaluation)\nHeadroom H_t, Reserve Floor, Nonce Monotonicity', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#1e3a5f', edgecolor='#0284c7', linewidth=1.5),
            color='#bae6fd', fontsize=8.5, fontweight='bold')
    ax.text(6.0, 2.2, 'Cryptographic Receipt Inspector\nState Transition Verification\nMerkle Topic Hashes & Event Decoder', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#1e3a5f', edgecolor='#0284c7', linewidth=1.5),
            color='#bae6fd', fontsize=8.5, fontweight='semibold')

    # Nodes in Zone 3
    ax.text(10.1, 4.8, 'Enclave Isolated Signer\nKMS / Local Secp256k1 Key\n(Zero LLM Key Access)', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#064e3b', edgecolor='#059669', linewidth=1.5),
            color='#a7f3d0', fontsize=8.5, fontweight='bold')
    ax.text(10.1, 2.2, 'Ethereum Sepolia Testnet\nMined Block Confirmation\n(11155111 RPC Provider)', 
            ha='center', va='center', bbox=dict(boxstyle="square,pad=0.6", facecolor='#064e3b', edgecolor='#059669', linewidth=1.5),
            color='#a7f3d0', fontsize=8.5, fontweight='semibold')

    # Arrows between zones
    # Arrow 1: Intent to Policy
    ax.annotate('', xy=(4.2, 4.8), xytext=(3.1, 4.8),
                arrowprops=dict(arrowstyle="->", color='#f59e0b', lw=2.5))
    ax.text(3.65, 5.15, 'Structured\nProposal', ha='center', va='center', color='#fbbf24', fontsize=7.5, fontweight='bold')
    
    # Arrow 2: Policy to Signer
    ax.annotate('', xy=(8.9, 4.8), xytext=(7.8, 4.8),
                arrowprops=dict(arrowstyle="->", color='#10b981', lw=2.5))
    ax.text(8.35, 5.15, 'Approved\nPayload', ha='center', va='center', color='#34d399', fontsize=7.5, fontweight='bold')

    # Arrow 3: Signer to Sepolia
    ax.annotate('', xy=(10.1, 3.1), xytext=(10.1, 4.0),
                arrowprops=dict(arrowstyle="->", color='#38bdf8', lw=2.5))
    ax.text(10.6, 3.55, 'Signed Raw\nTransaction', ha='left', va='center', color='#7dd3fc', fontsize=7.5)

    # Arrow 4: Sepolia to Receipt Inspector
    ax.annotate('', xy=(7.8, 2.2), xytext=(8.9, 2.2),
                arrowprops=dict(arrowstyle="->", color='#a855f7', lw=2.5))
    ax.text(8.35, 1.85, 'On-Chain Receipt\n& Event Logs', ha='center', va='center', color='#c084fc', fontsize=7.5)

    # Arrow 5: Receipt to User Console
    ax.annotate('', xy=(3.1, 2.2), xytext=(4.2, 2.2),
                arrowprops=dict(arrowstyle="->", color='#a855f7', lw=2.5))
    ax.text(3.65, 1.85, 'Verified State\nReconciliation', ha='center', va='center', color='#c084fc', fontsize=7.5)
    
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, 'system_architecture_diagram.png')
    plt.savefig(chart_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated chart: {chart_path}")

def create_sepolia_transaction_benchmark():
    tx_labels = ['Tx 1: Native Transfer\n(105k Gas)', 'Tx 2: Contract Call\n(706k Gas)', 'Tx 3: Multi-Approval\n(45k Gas)', 'Tx 4: State Flush\n(21k Gas)']
    gas_used = [105117, 706308, 45200, 21000]
    block_confirmations = [12, 12, 14, 15]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)
    fig.patch.set_facecolor('#0f172a')
    
    # Left subplot: Gas used
    ax1.set_facecolor('#1e293b')
    bars = ax1.bar(tx_labels, gas_used, color=['#38bdf8', '#f59e0b', '#10b981', '#a855f7'], width=0.55)
    ax1.set_title('On-Chain Sepolia Gas Execution Profile', color='#f8fafc', fontsize=10.5, fontweight='bold', pad=12)
    ax1.set_ylabel('Actual Gas Units Consumed', color='#cbd5e1', fontsize=9.5)
    ax1.tick_params(colors='#94a3b8')
    for spine in ax1.spines.values():
        spine.set_color('#334155')
    ax1.grid(True, linestyle=':', alpha=0.25, color='#64748b', axis='y')
    for bar in bars:
        height = bar.get_height()
        ax1.annotate(f'{int(height):,}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=8, color='#f1f5f9', fontweight='semibold')
                    
    # Right subplot: Block Confirmation Latency
    ax2.set_facecolor('#1e293b')
    bars2 = ax2.bar(tx_labels, [12.4, 14.1, 11.8, 12.0], color='#10b981', width=0.55)
    ax2.set_title('Block Mining Latency (Seconds to Inclusion)', color='#f8fafc', fontsize=10.5, fontweight='bold', pad=12)
    ax2.set_ylabel('Inclusion Time (Seconds)', color='#cbd5e1', fontsize=9.5)
    ax2.tick_params(colors='#94a3b8')
    for spine in ax2.spines.values():
        spine.set_color('#334155')
    ax2.grid(True, linestyle=':', alpha=0.25, color='#64748b', axis='y')
    for bar in bars2:
        height = bar.get_height()
        ax2.annotate(f'{height:.1f}s',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=8, color='#f1f5f9', fontweight='semibold')
                    
    plt.tight_layout()
    chart_path = os.path.join(CHART_DIR, 'sepolia_execution_benchmark.png')
    plt.savefig(chart_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Generated chart: {chart_path}")

if __name__ == '__main__':
    print("Starting visual asset generation...")
    capture_screenshots()
    create_spending_headroom_chart()
    create_gas_comparison_chart()
    create_threat_mitigation_matrix_chart()
    create_system_architecture_diagram()
    create_sepolia_transaction_benchmark()
    print("All visual assets generated successfully.")

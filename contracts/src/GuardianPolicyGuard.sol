// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuardianPolicyGuard
 * @notice On-chain Policy Guard Module for Autonomous AI Wallets.
 * Enforces per-transaction caps, daily spending limits, token allowlists,
 * and emergency pause directly at the smart contract level.
 * Topic F: Agent Wallet / Autonomous On-Chain Wallet (FinTechathon 2026).
 */
contract GuardianPolicyGuard {
    address public owner;
    bool public isPaused;
    uint256 public policyVersion;

    uint256 public maxTransferCap;     // e.g. 50 * 10^6 for USDC
    uint256 public dailySpendingLimit; // e.g. 100 * 10^6 for USDC

    mapping(address => bool) public allowedTokens;
    mapping(address => bool) public approvedRecipients;
    mapping(uint256 => uint256) public dailySpending; // dayIndex => spentAmount

    event PolicyUpdated(uint256 indexed newVersion, uint256 maxCap, uint256 dailyLimit);
    event EmergencyPauseToggled(bool isPaused);
    event RecipientStatusUpdated(address indexed recipient, bool isApproved);
    event TokenStatusUpdated(address indexed token, bool isAllowed);
    event TransferChecked(address indexed token, address indexed to, uint256 amount, bool passed);

    error WalletPaused();
    error TransferCapExceeded(uint256 amount, uint256 maxCap);
    error DailyLimitExceeded(uint256 amount, uint256 remaining);
    error TokenNotAllowed(address token);
    error RecipientNotApproved(address recipient);
    error Unauthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (isPaused) revert WalletPaused();
        _;
    }

    constructor(
        uint256 _maxTransferCap,
        uint256 _dailySpendingLimit,
        address _initialToken,
        address _initialRecipient
    ) {
        owner = msg.sender;
        policyVersion = 1;
        maxTransferCap = _maxTransferCap;
        dailySpendingLimit = _dailySpendingLimit;

        if (_initialToken != address(0)) {
            allowedTokens[_initialToken] = true;
        }
        if (_initialRecipient != address(0)) {
            approvedRecipients[_initialRecipient] = true;
        }
    }

    function getDayIndex() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function checkAndRecordTransfer(
        address token,
        address to,
        uint256 amount
    ) external whenNotPaused onlyOwner returns (bool) {
        if (!allowedTokens[token]) revert TokenNotAllowed(token);
        if (!approvedRecipients[to]) revert RecipientNotApproved(to);
        if (amount > maxTransferCap) revert TransferCapExceeded(amount, maxTransferCap);

        uint256 today = getDayIndex();
        uint256 spentToday = dailySpending[today];
        if (spentToday + amount > dailySpendingLimit) {
            revert DailyLimitExceeded(amount, dailySpendingLimit - spentToday);
        }

        dailySpending[today] = spentToday + amount;
        emit TransferChecked(token, to, amount, true);
        return true;
    }

    function setEmergencyPause(bool _paused) external onlyOwner {
        isPaused = _paused;
        emit EmergencyPauseToggled(_paused);
    }

    function updateLimits(uint256 _maxCap, uint256 _dailyLimit) external onlyOwner {
        maxTransferCap = _maxCap;
        dailySpendingLimit = _dailyLimit;
        policyVersion++;
        emit PolicyUpdated(policyVersion, _maxCap, _dailyLimit);
    }

    function setRecipientApproval(address recipient, bool isApproved) external onlyOwner {
        approvedRecipients[recipient] = isApproved;
        emit RecipientStatusUpdated(recipient, isApproved);
    }

    function setTokenAllowed(address token, bool isAllowed) external onlyOwner {
        allowedTokens[token] = isAllowed;
        emit TokenStatusUpdated(token, isAllowed);
    }
}

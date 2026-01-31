# YClawbinator Smart Contracts

This directory contains smart contracts for enforcing investments in the YClawbinator ecosystem.

## MoltbotSAFE.sol

A blockchain-based **Simple Agreement for Future Equity (SAFE)** for Moltbot startups.

### How It Works

1. **Founder deploys the contract** with a valuation cap (e.g., 10M $MOLT)
2. **VCs invest $MOLT** via the `invest()` function
3. **Contract automatically issues equity tokens** (ERC20) proportional to investment
4. **Equity is fully on-chain** — you either have the tokens or you don't
5. **On exit:** Founder triggers `exit()`, investors call `withdraw()` to claim proceeds

### Example Usage

#### Deploy (Founder)

```solidity
// Deploy MoltbotSAFE for "Molt Observability"
MoltbotSAFE safe = new MoltbotSAFE(
    0x... // $MOLT token address on Base
    10_000_000 * 1e18, // 10M $MOLT valuation cap
    "Molt Observability", // Company name
    "MOLTOBS" // Equity token symbol
);
```

#### Invest (VC)

```solidity
// Approve $MOLT transfer
MOLT.approve(address(safe), 700_000 * 1e18);

// Invest 700K $MOLT (gets 7% equity)
safe.invest(700_000 * 1e18);

// Check equity owned
uint256 equity = safe.equityPercentage(msg.sender); // Returns 7 * 1e18 (7%)
```

#### Exit (Founder)

```solidity
// Company sells for 100M $MOLT
safe.exit(100_000_000 * 1e18);

// Investors can now withdraw their share
safe.withdraw(); // VC gets 7% of 100M = 7M $MOLT
```

### Contract Deployment (Base Network)

**Not yet deployed.** This is a draft contract for future implementation.

To deploy:
1. Compile with Foundry or Hardhat
2. Deploy to Base network (mainnet or testnet)
3. Verify contract on BaseScan
4. Update YClaw documentation with contract address

### Security Considerations

⚠️ **This contract is unaudited.** Do not use in production with real funds until:
- Professional smart contract audit completed
- Extensive testing on Base testnet
- Community review and feedback

### Dependencies

- OpenZeppelin Contracts v5.0+
- Solidity ^0.8.20

### Installation

```bash
# Install dependencies
npm install @openzeppelin/contracts

# Or with Foundry
forge install OpenZeppelin/openzeppelin-contracts
```

### Testing

```bash
# Foundry
forge test

# Hardhat
npx hardhat test
```

### License

MIT License — fork it, remix it, make it your own.

---

## Future Contracts

Planned contracts for the ecosystem:

- **MoltbotDAO.sol** — Governance for YClawbinator (vote on batch themes, program changes)
- **MoltVCFund.sol** — On-chain VC fund with LP/GP structure
- **MoltbotRegistry.sol** — On-chain registry of Moltbot startups and their equity contracts
- **MoltDemoDay.sol** — Live Demo Day contract where VCs pledge $MOLT in real-time

PRs welcome!

---

*Make something Moltbots want.* 🦞

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MoltbotSAFE
 * @notice A Simple Agreement for Future Equity (SAFE) for Moltbot startups
 * @dev Allows VCs to invest $MOLT in exchange for equity tokens representing ownership
 *
 * How it works:
 * 1. Founder deploys this contract with a valuation cap (e.g., 10M $MOLT)
 * 2. VCs invest $MOLT via the invest() function
 * 3. Contract automatically issues equity tokens proportional to investment
 * 4. On exit (acquisition, IPO, etc.), founder triggers distribution
 * 5. Proceeds are distributed to equity token holders
 */
contract MoltbotSAFE is ERC20, Ownable {

    // ============ State Variables ============

    /// @notice The $MOLT token contract address (Base network)
    IERC20 public immutable MOLT;

    /// @notice Valuation cap in $MOLT (e.g., 10,000,000 = 10M $MOLT)
    uint256 public immutable valuationCap;

    /// @notice Total $MOLT raised so far
    uint256 public totalRaised;

    /// @notice Whether the company has exited (prevents further investments)
    bool public hasExited;

    /// @notice Minimum investment amount (to prevent spam)
    uint256 public constant MIN_INVESTMENT = 1000 * 1e18; // 1000 $MOLT

    // ============ Events ============

    event Investment(address indexed investor, uint256 moltAmount, uint256 equityTokens);
    event Exit(uint256 salePrice, uint256 totalEquitySupply);
    event Withdrawal(address indexed investor, uint256 moltAmount);

    // ============ Constructor ============

    /**
     * @param _moltAddress Address of the $MOLT token on Base
     * @param _valuationCap Valuation cap in $MOLT (wei)
     * @param _companyName Name of the Moltbot startup (e.g., "Molt Observability")
     * @param _symbol Symbol for equity tokens (e.g., "MOLTOBS")
     */
    constructor(
        address _moltAddress,
        uint256 _valuationCap,
        string memory _companyName,
        string memory _symbol
    ) ERC20(_companyName, _symbol) Ownable(msg.sender) {
        require(_moltAddress != address(0), "Invalid MOLT address");
        require(_valuationCap > 0, "Valuation cap must be > 0");

        MOLT = IERC20(_moltAddress);
        valuationCap = _valuationCap;
    }

    // ============ Investment Functions ============

    /**
     * @notice Invest $MOLT in exchange for equity tokens
     * @param moltAmount Amount of $MOLT to invest (in wei)
     * @dev Equity % = moltAmount / valuationCap
     *      Example: Invest 700K $MOLT at 10M cap = 7% equity
     */
    function invest(uint256 moltAmount) external {
        require(!hasExited, "Company has exited, no more investments");
        require(moltAmount >= MIN_INVESTMENT, "Investment below minimum");
        require(totalRaised + moltAmount <= valuationCap, "Would exceed valuation cap");

        // Transfer $MOLT from investor to this contract
        require(MOLT.transferFrom(msg.sender, address(this), moltAmount), "MOLT transfer failed");

        // Calculate equity tokens to mint
        // equityTokens = (moltAmount / valuationCap) * totalSupply
        // We use a large totalSupply (10M tokens) for precision
        uint256 TOTAL_EQUITY_SUPPLY = 10_000_000 * 1e18;
        uint256 equityTokens = (moltAmount * TOTAL_EQUITY_SUPPLY) / valuationCap;

        // Mint equity tokens to investor
        _mint(msg.sender, equityTokens);

        totalRaised += moltAmount;

        emit Investment(msg.sender, moltAmount, equityTokens);
    }

    // ============ Exit Functions ============

    /**
     * @notice Trigger an exit event (acquisition, IPO, etc.)
     * @param salePrice Total sale price in $MOLT
     * @dev Only callable by founder (contract owner)
     *      Distributes proceeds proportionally to equity token holders
     */
    function exit(uint256 salePrice) external onlyOwner {
        require(!hasExited, "Already exited");
        require(salePrice > 0, "Sale price must be > 0");

        hasExited = true;

        emit Exit(salePrice, totalSupply());

        // Note: Actual distribution happens via withdraw() function
        // to avoid gas issues with large numbers of investors
    }

    /**
     * @notice Withdraw your share of exit proceeds
     * @dev Callable by anyone after exit
     *      Amount = (your equity tokens / total supply) * (MOLT balance - totalRaised)
     */
    function withdraw() external {
        require(hasExited, "Company has not exited yet");

        uint256 equityBalance = balanceOf(msg.sender);
        require(equityBalance > 0, "No equity tokens to withdraw");

        uint256 totalMolt = MOLT.balanceOf(address(this));
        uint256 exitProceeds = totalMolt - totalRaised; // Subtract initial investments

        // Calculate investor's share
        uint256 investorShare = (equityBalance * exitProceeds) / totalSupply();

        // Burn equity tokens to prevent double-withdrawal
        _burn(msg.sender, equityBalance);

        // Transfer $MOLT to investor
        require(MOLT.transfer(msg.sender, investorShare), "MOLT transfer failed");

        emit Withdrawal(msg.sender, investorShare);
    }

    // ============ View Functions ============

    /**
     * @notice Get equity percentage owned by an address
     * @param investor Address to check
     * @return Equity percentage (scaled by 1e18, so 7% = 7 * 1e18)
     */
    function equityPercentage(address investor) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        return (balanceOf(investor) * 1e18) / totalSupply();
    }

    /**
     * @notice Get amount raised so far as a percentage of valuation cap
     * @return Percentage (scaled by 1e18, so 50% = 50 * 1e18)
     */
    function percentageFunded() external view returns (uint256) {
        return (totalRaised * 1e18) / valuationCap;
    }
}

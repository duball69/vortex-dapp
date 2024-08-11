// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "contracts/Staking.sol";

contract MyToken is ERC20 {
    uint256 public maxHolding;
    address swapRouter;
    address public factoryAddress;
    address positionManager;
    uint256 public constant MAX_WALLET_PERCENTAGE = 5; // 5% max wallet
    uint256 public maxWalletAmount;
    bool public maxWalletEnabled = false;

    struct TokenList {
        address tokenAddress;
        bool maxWalletEnabled;
        address poolAddress;
    }

    TokenList[] public allTokens;

    mapping(address => uint256) private tokenIndex; // Maps tokenId to index in allTokens array

    modifier onlyAuth() {
        require(
            msg.sender == factoryAddress,
            "Caller is not authorized to enable max wallet"
        );
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address factory
    ) ERC20(name, symbol) {
        maxHolding = (totalSupply * 10 ** 18 * 5) / 100; // 5% of total supply in wei

        factoryAddress = factory;

        // Initialize the token in the allTokens array
        allTokens.push(
            TokenList({
                tokenAddress: address(this),
                maxWalletEnabled: false,
                poolAddress: address(this)
            })
        );

        // Save the index of the new token details in the mapping
        tokenIndex[address(this)] = allTokens.length - 1;
        _mint(msg.sender, totalSupply * 10 ** 18);
    }

    function enableMaxWalletLimit(address poolAddress) external onlyAuth {
        uint256 index = tokenIndex[address(this)];
        allTokens[index].maxWalletEnabled = true;
        allTokens[index].poolAddress = poolAddress;
        maxWalletAmount = (totalSupply() * MAX_WALLET_PERCENTAGE) / 100;
        maxWalletEnabled = true;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        uint256 index = tokenIndex[address(this)];

        // Check max holding limit for the recipient
        if (
            allTokens[index].maxWalletEnabled == true &&
            to != factoryAddress &&
            to != address(this) &&
            from != to &&
            to != allTokens[index].poolAddress
        ) {
            uint256 maxHoldings = (totalSupply() * 5) / 100;
            uint256 toBalance = balanceOf(to);
            require(
                toBalance + value <= maxHoldings,
                "MyToken: Transfer amount exceeds the max holding limit"
            );
        }

        super._update(from, to, value);
    }
}

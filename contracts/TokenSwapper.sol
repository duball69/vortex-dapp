// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces for Uniswap V3 contracts
interface INonfungiblePositionManager {
    // Define interface functions here
}

interface ISwapRouter {
    // Define interface functions here
}

contract TokenSwapper {
    address public owner;
    mapping(address => bool) public supportedTokens;
    INonfungiblePositionManager public positionManager;
    ISwapRouter public swapRouter;
    address public IWETH;

    event Swap(
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    // Example constructor in TokenSwapper.sol
    constructor(address _positionManager, address _swapRouter, address _weth) {
        // Constructor logic
        positionManager = INonfungiblePositionManager(_positionManager);
        swapRouter = ISwapRouter(_swapRouter);
        IWETH = _weth;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    function swapTokens(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external {
        require(
            supportedTokens[tokenIn] && supportedTokens[tokenOut],
            "Tokens not supported"
        );

        // Transfer tokenIn from sender
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "TransferFrom failed"
        );

        // Perform token swap logic here (for example, swap via an external DEX or custom logic)

        emit Swap(tokenIn, amountIn, tokenOut, 0); // Replace 0 with actual amountOut if applicable
    }

    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner, amount), "Transfer failed");
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }

    receive() external payable {}
}

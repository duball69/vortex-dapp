// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
//import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";




contract MyToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 totalSupply) ERC20(name, symbol) {
        _mint(msg.sender, totalSupply * 10**18);
    }
}

contract MyFactory {
    address[] public tokens;
    uint256 public tokenCount;
    INonfungiblePositionManager public positionManager;
    address public weth;
    IUniswapV3Factory public uniswapFactory;
    ISwapRouter public swapRouter; // Add the SwapRouter variable
    
    event TokenDeployed(address indexed tokenAddress);
    event PoolCreated(address indexed token0, address indexed poolAddress);
    event PoolInitialized(address indexed poolAddress, uint160 sqrtPriceX96);
    event TokenApproved(address indexed tokenAddress, address indexed poolAddress);
    event LiquidityAdded(address indexed token, address indexed pool, uint256 tokenAmount, uint256 wethAmount);
    event LiquidityRemoved(address indexed token, uint256 tokenId, uint256 amount0, uint256 amount1);
    event LiquidityAdditionFailed(address indexed token, address indexed pool, uint256 tokenAmount, uint256 wethAmount, string error);
    event FeesCollected(address indexed token, uint256 amount0, uint256 amount1);
    event SwappedToWETH(address indexed token, uint256 amountIn, uint256 amountOut);

    constructor(address _positionManager, address _weth, address _uniswapFactory, address _swapRouter) {
        positionManager = INonfungiblePositionManager(_positionManager);
        weth = _weth;
        uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        swapRouter = ISwapRouter(_swapRouter);
         owner = msg.sender;
    }

    function deployToken(
        string calldata _name,
        string calldata _symbol,
        uint256 _supply
    ) external returns (address) {
        MyToken token = new MyToken(_name, _symbol, _supply);
        address tokenAddress = address(token);
        
        tokens.push(tokenAddress);
        tokenCount++;
        emit TokenDeployed(tokenAddress);

        return tokenAddress;
    }

    function createPoolForToken(address _token0, address _token1) external returns (address poolAddress) {
    //require(_token0 != _token1, "Tokens must be different");

    //(address token0, address token1) = _tokenA < _tokenB ? (_tokenA, _tokenB) : (_tokenB, _tokenA);

    poolAddress = uniswapFactory.getPool(_token0, _token1, 10000);
    if (poolAddress == address(0)) {
        poolAddress = uniswapFactory.createPool(_token0, _token1, 10000);
        emit PoolCreated(_token0, poolAddress);
    }
        return poolAddress;
    }


    function initializePool(address poolAddress, uint160 sqrtPriceX96) external {
        IUniswapV3Pool(poolAddress).initialize(sqrtPriceX96);
        emit PoolInitialized(poolAddress, sqrtPriceX96);
    }

    // Function to get the pool address
    function get_Pool(address tokenA, address tokenB, uint24 fee) external view returns (address pool) {
        pool = uniswapFactory.getPool(tokenA, tokenB, fee);
    }


    function tokenExists(address _token) internal view returns (bool) {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == _token) {
                return true;
            }
        }
        return false;
    }

    // Fallback function to receive Ether
    fallback() external payable {
        // Handle received Ether if necessary
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        // Handle received Ether
    }

    function approveToken(address token, address spender, uint256 amount) external {
    require(IERC20(token).approve(spender, amount), "Approval failed");
}
    

    function addInitialLiquidity(address _token0, address _token1, address factory_addy, uint256 _token0Amount, uint256 _token1Amount) external {

    // Approve the position manager to spend tokens
    TransferHelper.safeApprove(_token0, address(positionManager), _token0Amount);
    TransferHelper.safeApprove(_token1, address(positionManager), _token1Amount);

    // Log the parameters before attempting to mint
    //emit LiquidityAdded(_token0, _token1, _tokenAmount, _wethAmount);

    try positionManager.mint(
            INonfungiblePositionManager.MintParams({
                token0: _token0,
                token1: _token1,
                fee: 10000,
                tickLower: -887200,
                tickUpper: 887200,
                amount0Desired: _token0Amount,
                amount1Desired: _token1Amount,
                amount0Min: 0,
                amount1Min: 0,
                recipient: factory_addy,
                deadline: block.timestamp + 5 minutes
            })
        ) returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1) {
            emit LiquidityAdded(_token0, address(positionManager), _token0Amount, _token1Amount);
        } catch Error(string memory reason) {
            emit LiquidityAdditionFailed(_token0, address(positionManager), _token0Amount, _token1Amount, reason);
        } catch (bytes memory lowLevelData) {
            emit LiquidityAdditionFailed(_token0, address(positionManager), _token0Amount, _token1Amount, "Low-level error");
        }
    }

    function removeLiquidity(uint256 tokenId, uint128 liquidityToRemove) external {
        // Decrease liquidity
        (uint256 amount0, uint256 amount1) = positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidityToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );

        // Collect the tokens from the position
        (uint256 collectedAmount0, uint256 collectedAmount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        emit LiquidityRemoved(msg.sender, tokenId, collectedAmount0, collectedAmount1);
    }


    function getPosition(uint256 tokenId) external view returns (
    uint96 nonce,
    address operator,
    address token0,
    address token1,
    uint24 fee,
    int24 tickLower,
    int24 tickUpper,
    uint128 liquidity,
    uint256 feeGrowthInside0LastX128,
    uint256 feeGrowthInside1LastX128,
    uint128 tokensOwed0,
    uint128 tokensOwed1
) {
    return positionManager.positions(tokenId);
}

// Function to perform a swap from ETH to token
    function swapETHForToken(address tokenOut, uint amount_In) external payable returns (uint amountOut) {
        
        // Convert ETH to WETH
        IWETH(weth).deposit{value: amount_In}();

        // Approve the router to spend WETH
        TransferHelper.safeApprove(weth, address(swapRouter), amount_In);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: weth,
                tokenOut: tokenOut,
                fee: 10000,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amount_In,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
    }


    function _swapTokenForWETH(address token, uint256 amountIn) internal {
        //require(IERC20(token).approve(address(swapRouter), amountIn), "Approval failed");

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(weth, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: token,
            tokenOut: weth,
            fee: 10000,
            recipient: address(this),
            deadline: block.timestamp + 15,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);
        emit SwappedToWETH(token, amountIn, amountOut);
    }


function collectFeesAndSwap(uint256 tokenId) external {
        // Collect the fees from the position
        (uint256 amount0, uint256 amount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
        emit FeesCollected(address(this), amount0, amount1);

    }






    //MUDANCAS MAKU - ADICIONAR AO CONTRATO DO DAVID

address public stakingPoolAddress;
address public wethAddress;
address public owner;


    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }


     function setStakingPoolAddress(address _stakingPoolAddress) external onlyOwner {
        stakingPoolAddress = _stakingPoolAddress;
    }


    // Modifier to restrict function calls to the staking contract
    modifier onlyStakingPool() {
        require(msg.sender == stakingPoolAddress, "Caller is not the staking pool");
        _;
    }


   
   function notifyFundsNeeded(uint256 amountNeeded) external onlyStakingPool {
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));
    uint256 amountToSend = (availableWETH >= amountNeeded) ? amountNeeded : availableWETH;
    if (amountToSend > 0) {
        sendWETHToStakingPool(amountToSend);
    }
}

function sendWETHToStakingPool(uint256 amount) private {
    require(IWETH(weth).transfer(stakingPoolAddress, amount), "Failed to send WETH");
    IStaking(stakingPoolAddress).notifyFundsReceived(amount);
}






}


/*interface ISwapRouter is IUniswapV3SwapCallback {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}*/


interface IWETH {
    function deposit() external payable;
    function deposit(uint256 amount) external payable;
    function withdraw(uint256 amount) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IStaking {
    function notifyFundsReceived(uint256 amount) external;
}

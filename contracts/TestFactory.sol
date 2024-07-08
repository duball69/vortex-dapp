// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "contracts/Staking.sol";
//import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";


contract MyToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 totalSupply) ERC20(name, symbol) {
        _mint(msg.sender, totalSupply * 10**18);
    }
}

contract MyFactory {

    uint256 public tokenCount;
    INonfungiblePositionManager public positionManager;
    address public weth;
    IUniswapV3Factory public uniswapFactory;
    ISwapRouter public swapRouter; 
    address public owner;
    address payable public stakingAddress;
    address public lockerAddress;
    ILocker public locker;
    address nftAddress;

    uint256 wethProvided = 0.0001 ether;
    bool removeEarlier;

    struct TokenDetails {
        address tokenAddress;
        uint256 timeStamp;
        uint256 tokenId;
        bool liquidityRemoved;
        uint256 zerofeedays;
        bool isTokenDEAD;
        uint256 feeFromSwap;
        uint256 lockId;
        bool isLocked;
        uint256 unlockTime;
    }

    TokenDetails[] public allTokens;

    mapping(uint256 => uint256) private tokenIndex; // Maps tokenId to index in allTokens array

    
    event TokenDeployed(address indexed tokenAddress);
    event PoolCreated(address indexed token0, address indexed poolAddress);
    event PoolInitialized(address indexed poolAddress, uint160 sqrtPriceX96);
    event TokenApproved(address indexed tokenAddress, address indexed poolAddress);
    event LiquidityAdded(uint256 tokenId);
    event LiquidityRemoved(address indexed token, uint256 tokenId, uint256 amount0, uint256 amount1);
    event LiquidityAdditionFailed(address indexed token, address indexed pool, uint256 tokenAmount, uint256 wethAmount, string error);
    event FeesCollected(uint256 tokenId, uint256 amount0, uint256 amount1);
    event SwappedToWETH(address indexed token, uint256 amountIn, uint256 amountOut);
    event ZeroFeesDays(uint256 tokenId, bool isTokenDead);
    event ResetFeesDays(uint256 tokenId, bool isTokenDead);
    event TokensSwapped(uint256 amount);
    event RemoveTime (uint256 yesOrNo);
    

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(address _positionManager, address _weth, address _uniswapFactory, address _swapRouter, address _lockerAddress) {
        positionManager = INonfungiblePositionManager(_positionManager);
        nftAddress = _positionManager;
        weth = _weth;
        uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        swapRouter = ISwapRouter(_swapRouter);
        owner = msg.sender;  // Set the deployer as the owner
        lockerAddress = _lockerAddress;
        locker = ILocker(_lockerAddress);
    }
    


    // Method to get all token addresses
    function getAllTokens() public view onlyOwner returns (address[] memory addresses, uint256[] memory tokenIds, uint256[] memory timestamps, bool[] memory liquidityRemovedStatus, uint256[] memory zerofeesdays, bool[] memory isTokenDead, uint256[] memory feefromswap, uint256[] memory lockIds, bool[] memory isTokenLocked, uint256[] memory unlockTimes) {
    addresses = new address[](allTokens.length);
    tokenIds = new uint256[](allTokens.length);
    timestamps = new uint256[](allTokens.length);
    liquidityRemovedStatus = new bool[](allTokens.length);
    zerofeesdays = new uint256[](allTokens.length);
    isTokenDead = new bool[](allTokens.length);
    feefromswap = new uint256[](allTokens.length);
    lockIds = new uint256[](allTokens.length);
    isTokenLocked = new bool[](allTokens.length);
    unlockTimes = new uint256[](allTokens.length);

    for (uint i = 0; i < allTokens.length; i++) {
        addresses[i] = allTokens[i].tokenAddress;
        tokenIds[i] = allTokens[i].tokenId;
        timestamps[i] = allTokens[i].timeStamp;
        liquidityRemovedStatus[i] = allTokens[i].liquidityRemoved;
        zerofeesdays[i] = allTokens[i].zerofeedays;
        isTokenDead[i] = allTokens[i].isTokenDEAD;
        feefromswap[i] = allTokens[i].feeFromSwap;
        lockIds[i] = allTokens[i].lockId;
        isTokenLocked[i] = allTokens[i].isLocked;
        unlockTimes[i] = allTokens[i].unlockTime;
    }

    return (addresses, tokenIds, timestamps, liquidityRemovedStatus, zerofeesdays, isTokenDead, feefromswap, lockIds, isTokenLocked, unlockTimes);
}

    function deployToken( string calldata _name, string calldata _symbol, uint256 _supply) external returns (address) {

        MyToken token = new MyToken(_name, _symbol, _supply);
        address tokenAddress = address(token);
        
        emit TokenDeployed(tokenAddress);

        return tokenAddress;
    }


    /* function multicall(bytes[] calldata data) external payable returns (bytes[] memory results) {
        results = new bytes[](data.length);
        for (uint i = 0; i < data.length; i++) {
            (bool success, bytes memory result) = address(this).delegatecall(data[i]);
            require(success, "Transaction failed");
            results[i] = result;
        }
    } */


   function multicall(bytes[] calldata data) external payable {
        for (uint256 i = 0; i < data.length; i++) {
            (bool success, ) = address(this).call{value: i == data.length - 1 ? msg.value : 0}(data[i]);
            require(success, "Multicall execution failed");
        }
    }


     function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint160 sqrtPriceX96
    ) external returns (address pool) {
        pool = positionManager.createAndInitializePoolIfNecessary(token0, token1, 10000, sqrtPriceX96);
        emit PoolCreated(token0, pool);
        return pool;
    }


    // Function to get the pool address
    function get_Pool(address tokenA, address tokenB, uint24 fee) external view returns (address pool) {
        pool = uniswapFactory.getPool(tokenA, tokenB, fee);
    }


    // Fallback function to receive Ether
    fallback() external payable {
        // Handle received Ether if necessary
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        // Handle received Ether
    }

    function approveToken(address token, address spender, uint256 amount) internal onlyOwner {
    require(IERC20(token).approve(spender, amount), "Approval failed");
}

    // Function to approve another contract or address to manage a specific NFT
    function approveNFT(uint256 tokenId, address spender) external {
        IERC721(nftAddress).approve(spender, tokenId);
    }


    function setStakingAddress(address payable _stakingAddress) external onlyOwner {
        stakingAddress = _stakingAddress;
    }

    function callAddRewards (uint256 amount ) external payable onlyOwner {

        //require(msg.value > 0, "No rewards to add");
        approveToken(weth, stakingAddress, amount);

        SimpleStaking(stakingAddress).addRewards{value: amount}();
        
    }


    // Function to transfer tokens from the factory contract to a specified wallet
    function transferTokens(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer tokens to the specified address
        IERC20(tokenAddress).transfer(to, amount);

    }

    function burnPositionNFT(uint256 tokenId) external {
    // Ensure all liquidity has been removed and fees collected
    positionManager.burn(tokenId);
}


    function convertWETHToETH(uint256 amount) external onlyOwner {
        IWETH(weth).withdraw(amount);
    }
    

    function swapETHforTokens (uint256 amountIn, address tokenAddress) external payable returns (uint256 amountOut) {

        // Approve the swap router to spend tokens
        approveToken(weth, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: weth,
                tokenOut: tokenAddress,
                fee: 10000,
                recipient: msg.sender,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle{ value: msg.value }(params);
        emit TokensSwapped(amountOut);

        return amountOut;
    }

    function swapTokensForWETH(uint256 amountIn, address tokenAddress, uint256 tokenId) external payable onlyOwner returns (uint256 amountOut) {
        
        require(amountIn > 0, "Amount must be greater than zero");

        // Approve the swap router to spend tokens
        approveToken(tokenAddress, address(swapRouter), amountIn);

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenAddress,
                tokenOut: weth,
                fee: 10000,
                recipient: address(this),
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle{ value: msg.value }(params);
        
        uint256 index = tokenIndex[tokenId]; // Get the index from mapping
        allTokens[index].feeFromSwap = amountIn * 1 / 100;
        emit TokensSwapped(amountOut);
        return amountOut;
    }

    /* function checkFeeFromSwap( uint256 tokenId ) external onlyOwner {

        uint256 index = tokenIndex[tokenId]; // Get the index from mapping
        allTokens[index].feeFromSwap = amountIn * 1 / 100;

    } */

    
    

    function addLiquidityLockSwap(address _token0, address _token1, address tokenAddress, uint256 _token0Amount, uint256 _token1Amount, uint160 sqrtPriceX96, uint256 amountToBuy) external payable returns (uint256 tokenId) {

     // Check if the factory contract has enough WETH
    uint256 wethBalance = IERC20(weth).balanceOf(address(this));
    require(wethBalance >= wethProvided, "Not enough WETH in the factory contract");

    address pool = positionManager.createAndInitializePoolIfNecessary(_token0, _token1, 10000, sqrtPriceX96);
    emit PoolCreated(_token0, pool);


    // Approve the position manager to spend tokens
    TransferHelper.safeApprove(_token0, address(positionManager), _token0Amount);
    TransferHelper.safeApprove(_token1, address(positionManager), _token1Amount);

    INonfungiblePositionManager.MintParams memory params =
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
                recipient: address(this),
                deadline: block.timestamp + 5 minutes
            });

        (tokenId,,,) = positionManager.mint(params);


    emit LiquidityAdded(tokenId);

    ////////////////////////////////////////////////////////////////////////////////////

    // Approve the locker contract to manage the liquidity NFT
        IERC721(address(positionManager)).approve(lockerAddress, tokenId);
        uint256 duration = 6;

        // Lock the liquidity NFT
        ILocker(lockerAddress).lockLiquidity(address(positionManager), tokenId, duration, address(this));

    //////////////////////////////////////////////////////////////////////////////////
    if(amountToBuy > 0){
        approveToken(weth, address(swapRouter), amountToBuy);
        ISwapRouter.ExactInputSingleParams memory swapParams =
                    ISwapRouter.ExactInputSingleParams({
                tokenIn: weth,
                tokenOut: tokenAddress,
                fee: 10000,
                recipient: msg.sender,
                amountIn: amountToBuy,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        uint256 amountOut = swapRouter.exactInputSingle{ value: msg.value }(swapParams);
        emit TokensSwapped(amountOut);
    }
/////////////////////////////////////////////////////////////////////////////////////////
    // Store the token details in the array
    allTokens.push(TokenDetails({
        tokenAddress: tokenAddress,  // Storing _token0 as an example, store _token1 similarly if needed
        tokenId: tokenId,
        timeStamp: block.timestamp,
        liquidityRemoved: false,
        zerofeedays: 0,
        isTokenDEAD: false,
        feeFromSwap: 0,
        lockId: 0,
        isLocked: true,
        unlockTime: block.timestamp + 6 seconds 
    }));

    // Save the index of the new token details in the mapping
    tokenIndex[tokenId] = allTokens.length - 1;

    return tokenId;
    }


function updateNoFeeDays(uint256 tokenId) external onlyOwner { 

    uint256 index = tokenIndex[tokenId]; // Get the index from mapping

    if( allTokens[index].zerofeedays >= 2){

        allTokens[index].isTokenDEAD = true;

    }

    allTokens[index].zerofeedays++;
    
}



function resetNoFeeDays(uint256 tokenId) external onlyOwner { 


    uint256 index = tokenIndex[tokenId]; // Get the index from mapping
    allTokens[index].zerofeedays=0;

    emit ResetFeesDays(allTokens[index].zerofeedays, allTokens[index].isTokenDEAD );
    
}

function storeLockID(uint256 tokenId, uint256 _lockId, bool locked, uint256 unlockDate) external {

    uint256 index = tokenIndex[tokenId]; // Get the index from mapping
    allTokens[index].lockId = _lockId;
    allTokens[index].isLocked = locked;
    allTokens[index].unlockTime = unlockDate;

}


// Babylonian method for calculating the square root
function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y != 0) {
        z = 1;
    }
}


    function removeLiquidity(uint256 tokenId, uint128 liquidityToRemove) external onlyOwner {

        uint256 index = tokenIndex[tokenId]; // Get the index from mapping
        //require(!allTokens[index].liquidityRemoved, "Liquidity already removed");

        // Decrease liquidity
        positionManager.decreaseLiquidity(
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

        allTokens[index].liquidityRemoved = true; // Update the liquidity removed status
        emit LiquidityRemoved(msg.sender, tokenId, collectedAmount0, collectedAmount1);
        tryToSendFunds();
         
    }


    function getPosition(uint256 tokenId) external view onlyOwner returns (
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


function collectFees(uint256 tokenId) external onlyOwner {
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (uint256 amount0, uint256 amount1) = positionManager.collect(params);

        emit FeesCollected(tokenId, amount0, amount1);

        
    }


    //new changes regarding unstaking queue

 uint256 public pendingFunds; 

event FundsRequested(uint256 amountNeeded);
    event FundsSent(uint256 amount);

//function called by the staking pool to ask factory for funds to process pending unstaking
function notifyFundsNeeded(uint256 amount) external {
        require(msg.sender == stakingAddress, "Only staking contract can notify.");
        pendingFunds += amount;
        emit FundsRequested(amount);
        tryToSendFunds();
    }
 // Attempt to send funds to the staking contract

  

    // if unstaking queue is too long, only pay the first in the line


    function tryToSendFunds() public {
        uint256 availableWETH = IERC20(weth).balanceOf(address(this));
        if (availableWETH >= pendingFunds && pendingFunds > 0) {
            IERC20(weth).transfer(stakingAddress, pendingFunds);
            ISimpleStaking(stakingAddress).notifyFundsReceived(pendingFunds);
            emit FundsSent(pendingFunds);
            pendingFunds = 0;
        }
    }

//if factory has funds, and is requested by the staking pool - change visibility

    function provideFundsIfNeeded(address _stakingContract, uint256 amountRequested) public {
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));
    if (availableWETH >= amountRequested) {
        IWETH(weth).transfer(_stakingContract, amountRequested);
        ISimpleStaking(payable(_stakingContract)).notifyFundsReceived(amountRequested);
    }
}


}


interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}


interface ISimpleStaking {
    function notifyFundsReceived(uint256 amount) external;
}

interface ILocker {
    function lockLiquidity(address _nftAddress, uint256 _tokenId, uint256 _duration, address factory) external returns (uint256 lockId);
}
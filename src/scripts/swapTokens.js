async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x3168e66eC3fa850C9B24E5e39890Bc29F6159071";

  const tokenAddress = "0x4f03d060609d8155696F9A2c76C2956c588A69dB";

  const tokenId = 16391;

  const abi = [
    {
      inputs: [
        { internalType: "address", name: "_factoryV2", type: "address" },
        { internalType: "address", name: "factoryV3", type: "address" },
        { internalType: "address", name: "_positionManager", type: "address" },
        { internalType: "address", name: "_WETH9", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "WETH9",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "approveMax",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "approveMaxMinusOne",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "approveZeroThenMax",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "token", type: "address" }],
      name: "approveZeroThenMaxMinusOne",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes", name: "data", type: "bytes" }],
      name: "callPositionManager",
      outputs: [{ internalType: "bytes", name: "result", type: "bytes" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes[]", name: "paths", type: "bytes[]" },
        { internalType: "uint128[]", name: "amounts", type: "uint128[]" },
        {
          internalType: "uint24",
          name: "maximumTickDivergence",
          type: "uint24",
        },
        { internalType: "uint32", name: "secondsAgo", type: "uint32" },
      ],
      name: "checkOracleSlippage",
      outputs: [],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes", name: "path", type: "bytes" },
        {
          internalType: "uint24",
          name: "maximumTickDivergence",
          type: "uint24",
        },
        { internalType: "uint32", name: "secondsAgo", type: "uint32" },
      ],
      name: "checkOracleSlippage",
      outputs: [],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "bytes", name: "path", type: "bytes" },
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amountIn", type: "uint256" },
            {
              internalType: "uint256",
              name: "amountOutMinimum",
              type: "uint256",
            },
          ],
          internalType: "struct IV3SwapRouter.ExactInputParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "exactInput",
      outputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "tokenIn", type: "address" },
            { internalType: "address", name: "tokenOut", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amountIn", type: "uint256" },
            {
              internalType: "uint256",
              name: "amountOutMinimum",
              type: "uint256",
            },
            {
              internalType: "uint160",
              name: "sqrtPriceLimitX96",
              type: "uint160",
            },
          ],
          internalType: "struct IV3SwapRouter.ExactInputSingleParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "exactInputSingle",
      outputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "bytes", name: "path", type: "bytes" },
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amountOut", type: "uint256" },
            {
              internalType: "uint256",
              name: "amountInMaximum",
              type: "uint256",
            },
          ],
          internalType: "struct IV3SwapRouter.ExactOutputParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "exactOutput",
      outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "tokenIn", type: "address" },
            { internalType: "address", name: "tokenOut", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "address", name: "recipient", type: "address" },
            { internalType: "uint256", name: "amountOut", type: "uint256" },
            {
              internalType: "uint256",
              name: "amountInMaximum",
              type: "uint256",
            },
            {
              internalType: "uint160",
              name: "sqrtPriceLimitX96",
              type: "uint160",
            },
          ],
          internalType: "struct IV3SwapRouter.ExactOutputSingleParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "exactOutputSingle",
      outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "factory",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "factoryV2",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "getApprovalType",
      outputs: [
        {
          internalType: "enum IApproveAndCall.ApprovalType",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
            { internalType: "uint256", name: "tokenId", type: "uint256" },
            { internalType: "uint256", name: "amount0Min", type: "uint256" },
            { internalType: "uint256", name: "amount1Min", type: "uint256" },
          ],
          internalType: "struct IApproveAndCall.IncreaseLiquidityParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "increaseLiquidity",
      outputs: [{ internalType: "bytes", name: "result", type: "bytes" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          components: [
            { internalType: "address", name: "token0", type: "address" },
            { internalType: "address", name: "token1", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "int24", name: "tickLower", type: "int24" },
            { internalType: "int24", name: "tickUpper", type: "int24" },
            { internalType: "uint256", name: "amount0Min", type: "uint256" },
            { internalType: "uint256", name: "amount1Min", type: "uint256" },
            { internalType: "address", name: "recipient", type: "address" },
          ],
          internalType: "struct IApproveAndCall.MintParams",
          name: "params",
          type: "tuple",
        },
      ],
      name: "mint",
      outputs: [{ internalType: "bytes", name: "result", type: "bytes" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "bytes32", name: "previousBlockhash", type: "bytes32" },
        { internalType: "bytes[]", name: "data", type: "bytes[]" },
      ],
      name: "multicall",
      outputs: [{ internalType: "bytes[]", name: "", type: "bytes[]" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "bytes[]", name: "data", type: "bytes[]" },
      ],
      name: "multicall",
      outputs: [{ internalType: "bytes[]", name: "", type: "bytes[]" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
      name: "multicall",
      outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "positionManager",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "pull",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "refundETH",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "selfPermit",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "nonce", type: "uint256" },
        { internalType: "uint256", name: "expiry", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "selfPermitAllowed",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "nonce", type: "uint256" },
        { internalType: "uint256", name: "expiry", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "selfPermitAllowedIfNecessary",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
        { internalType: "uint256", name: "deadline", type: "uint256" },
        { internalType: "uint8", name: "v", type: "uint8" },
        { internalType: "bytes32", name: "r", type: "bytes32" },
        { internalType: "bytes32", name: "s", type: "bytes32" },
      ],
      name: "selfPermitIfNecessary",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountIn", type: "uint256" },
        { internalType: "uint256", name: "amountOutMin", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
      ],
      name: "swapExactTokensForTokens",
      outputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
      ],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountOut", type: "uint256" },
        { internalType: "uint256", name: "amountInMax", type: "uint256" },
        { internalType: "address[]", name: "path", type: "address[]" },
        { internalType: "address", name: "to", type: "address" },
      ],
      name: "swapTokensForExactTokens",
      outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "address", name: "recipient", type: "address" },
      ],
      name: "sweepToken",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      ],
      name: "sweepToken",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "uint256", name: "feeBips", type: "uint256" },
        { internalType: "address", name: "feeRecipient", type: "address" },
      ],
      name: "sweepTokenWithFee",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "token", type: "address" },
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "feeBips", type: "uint256" },
        { internalType: "address", name: "feeRecipient", type: "address" },
      ],
      name: "sweepTokenWithFee",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "int256", name: "amount0Delta", type: "int256" },
        { internalType: "int256", name: "amount1Delta", type: "int256" },
        { internalType: "bytes", name: "_data", type: "bytes" },
      ],
      name: "uniswapV3SwapCallback",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "address", name: "recipient", type: "address" },
      ],
      name: "unwrapWETH9",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      ],
      name: "unwrapWETH9",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "feeBips", type: "uint256" },
        { internalType: "address", name: "feeRecipient", type: "address" },
      ],
      name: "unwrapWETH9WithFee",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amountMinimum", type: "uint256" },
        { internalType: "uint256", name: "feeBips", type: "uint256" },
        { internalType: "address", name: "feeRecipient", type: "address" },
      ],
      name: "unwrapWETH9WithFee",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
      name: "wrapETH",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    { stateMutability: "payable", type: "receive" },
  ];
  const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const swapRouterAddress = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  // Retrieve the contract address of the deployed token
  const provider = ethers.getDefaultProvider(); // Update with your WebSocket provider URL

  const swapRouter = new ethers.Contract(swapRouterAddress, abi, deployer);

  // Amount of ETH to swap
  const amountIn = ethers.parseUnits("0.1", 18); // 0.01 ETH
  // Amount of Tokens to swap
  const amountIn2 = ethers.parseUnits("33", 18); // 0.01 ETH

  // Swap parameters
  const params = {
    tokenIn: WETH_address,
    tokenOut: tokenAddress,
    fee: 10000, // Assuming 1% fee tier
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
    amountIn: amountIn,
    amountOutMinimum: 0, // Set to 0 for simplicity, you may want to set a minimum amount out to avoid front-running
    sqrtPriceLimitX96: 0, // No price limit
  };

  // Perform the swap
  console.log("Performing the swap from ETH to the token...");
  const tx = await swapRouter.exactInputSingle(params, { value: amountIn });
  await tx.wait();
  console.log("Swap performed successfully!");
  //console.log("Transaction receipt:", receipt);
  /*
    // Approve the SwapRouter to spend your tokens
    console.log("Approving the SwapRouter to spend tokens...");
    const tokenContract = await ethers.getContractAt("IERC20", tokenAddress, deployer);
    const approveTx = await tokenContract.approve(swapRouterAddress, amountIn2);
    await approveTx.wait();
    console.log("Tokens approved for SwapRouter.");

    // Swap parameters
    const params2 = {
        tokenIn: tokenAddress,
        tokenOut: WETH_address,
        fee: 10000, // Assuming 1% fee tier
        recipient: deployer.address,
        deadline: Math.floor(Date.now() / 1000) + (60 * 10), // 10 minutes from now
        amountIn: amountIn2,
        amountOutMinimum: 0, // Set to 0 for simplicity, you may want to set a minimum amount out to avoid front-running
        sqrtPriceLimitX96: 0 // No price limit
    };


    // Perform the swap
    console.log("Performing the swap from Tokens to ETH...");
    const tx2 = await swapRouter.exactInputSingle(params2);
    await tx2.wait();
    console.log("Swap performed successfully!");
*/

  // Collect the fees from the position
  console.log("Collecting fees...");
  const collectTx = await factory.collectFees(tokenId);
  const receipt = await collectTx.wait();
  console.log("Fees collected successfully!");
  console.log("Transaction receipt:", receipt);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

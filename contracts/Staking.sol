// SPDX-License-Identifier: MIT
// VortexDapp Staking v0.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";



contract SimpleStaking is ReentrancyGuard{
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewardDebt;
     mapping(address => uint256) public pendingUnstakes;
    address public factoryAddress;
    address public weth;
    address public owner;
    uint256 public totalStaked;
    uint256 public totalRewards;
    uint256 public accRewardPerShare; // Accumulated rewards per share, times 1e12 to prevent precision loss
    uint256 public lastRewardTime;
   uint256 public constant REWARD_INTERVAL = 10 minutes; // Reward distribution interval


    event Stake(address indexed user, uint256 amount);
     event Unstake(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event UnstakeQueued(address indexed user, uint256 amount, uint256 timestamp);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 pendingAmount);
    event UnstakeProcessed(address indexed user, uint256 amount, uint256 pendingAmount);
    event FundsReceived(uint256 amount, uint256 timestamp);




struct UnstakeRequest {
    address user;
    uint256 amount;
    uint256 timestamp; // Optional, for tracking when the request was made
}

UnstakeRequest[] public unstakeQueue;


 
  constructor(address _weth, address factory) {
        owner = msg.sender;  // Set the deployer as the owner
        lastRewardTime = block.timestamp;
        weth = _weth;
        factoryAddress=factory;
    }


function stake() external payable nonReentrant {
    require(msg.value > 0, "Cannot stake 0 ETH");
    updatePool();

    // Convert the entire ETH amount to WETH
    IWETH(weth).deposit{value: msg.value}();

    uint256 factoryShare = (msg.value * 70) / 100; // 70% to factory
    uint256 reserveShare = msg.value - factoryShare; // 30% stays in the contract as WETH

    // Send 70% WETH to the factory address
    require(IWETH(weth).transfer(factoryAddress, factoryShare), "Failed to send WETH to factory");

    // Handle rewards and stake recording
    if (stakes[msg.sender] > 0) {
        uint256 pending = (stakes[msg.sender] * accRewardPerShare / 1e12) - rewardDebt[msg.sender];
        if (pending > 0) {
            IWETH(weth).withdraw(pending);
            payable(msg.sender).transfer(pending);
            emit RewardClaimed(msg.sender, pending);
        }
    }

    // Record the full amount staked, not just the reserve share
    stakes[msg.sender] += msg.value;
    totalStaked += msg.value;
    rewardDebt[msg.sender] = stakes[msg.sender] * accRewardPerShare / 1e12;
    
    emit Stake(msg.sender, msg.value);
}



function processImmediateUnstake(address user, uint256 amount) internal {
    // Withdraw the WETH amount to this contract
    IWETH(weth).withdraw(amount);

    // Transfer ETH to the user
    payable(user).transfer(amount);

    // Update the user's staked amount and total staked
    stakes[user] -= amount;
    totalStaked -= amount;
    rewardDebt[user] = stakes[user] * accRewardPerShare / 1e12;
    

    emit Unstake(user, amount);
}


uint256 public totalFundsNeeded;

function addToUnstakeQueue(address user, uint256 amount) internal {
    UnstakeRequest memory request = UnstakeRequest({
        user: user,
        amount: amount,
        timestamp: block.timestamp  // Storing the timestamp can help with processing logic later if needed
    });
    unstakeQueue.push(request);
    emit UnstakeQueued(user, amount, block.timestamp);  // Emit an event for a queued unstake request

    // Update the total funds needed to include the total amount needed in the queue
    uint256 totalQueueAmount = getTotalUnstakeQueueAmount();
    
    notifyFactoryForFunds(totalQueueAmount);
}

event NotifyFactoryForFunds(uint256 amountNeeded);


function notifyFactoryForFunds(uint256 amountNeeded) internal {
     emit NotifyFactoryForFunds(amountNeeded); 
    IFundsInterface(factoryAddress).notifyFundsNeeded(amountNeeded);
}



function requestUnstake(uint256 amount) public nonReentrant {
    require(stakes[msg.sender] >= amount, "Insufficient staked balance");
   

    uint256 wethBalance = IWETH(weth).balanceOf(address(this));

    if (wethBalance >= amount) {
        processImmediateUnstake(msg.sender, amount);
    } else {
        // Try to get funds from the factory before queuing
        IFundsInterface(factoryAddress).provideFundsIfNeeded(address(this), amount);
        // Check balance again after factory interaction
        wethBalance = IWETH(weth).balanceOf(address(this));
     
        if (wethBalance >= amount) {
            processImmediateUnstake(msg.sender, amount);
        } else {
            pendingUnstakes[msg.sender] += amount; // Only lock funds if they need to be queued
            addToUnstakeQueue(msg.sender, amount);
        }
 
    }
    
       emit UnstakeRequested(msg.sender, amount, pendingUnstakes[msg.sender]);}





    function getStake(address staker) external view returns (uint256) {
        return stakes[staker];
    }

function updatePool() internal {
    if (block.timestamp <= lastRewardTime) {
        return;
    }

    if (totalStaked == 0) {
        lastRewardTime = block.timestamp;
        return;
    }

    uint256 multiplier = block.timestamp - lastRewardTime;
    uint256 reward = (multiplier * totalRewards) / REWARD_INTERVAL;

    if (reward > 0) {
        accRewardPerShare += (reward * 1e12) / totalStaked;
        // Do not deduct from totalRewards here; only deduct when rewards are claimed
    }

    lastRewardTime = block.timestamp;
}



function addRewards() external payable {
    require(msg.value > 0, "No rewards to add");

    // Deposit the received ETH and mint WETH
    IWETH(weth).deposit{value: msg.value}();

    // Update the total rewards with the newly minted WETH amount
    totalRewards += msg.value;  // Assuming the WETH value is 1:1 with ETH
    updatePool();  // Update the pool after changing the totalRewards

    emit RewardsAdded(msg.value);
}


function pendingReward(address _user) external view returns (uint256) {
    uint256 _accRewardPerShare = accRewardPerShare;
    if (block.timestamp > lastRewardTime && totalStaked != 0) {
        uint256 multiplier = block.timestamp - lastRewardTime;
        uint256 reward = multiplier * totalRewards / REWARD_INTERVAL;
        _accRewardPerShare += reward * 1e12 / totalStaked;
    }
    uint256 simulatedReward = (stakes[_user] * _accRewardPerShare / 1e12);
    return simulatedReward - rewardDebt[_user];
}


function getTotalStaked() public view returns (uint256) {
    return totalStaked;
}



function claimRewards() external nonReentrant {
    updatePool();  // Make sure the pool is updated before claiming

    uint256 userStake = stakes[msg.sender];
    require(userStake > 0, "No staked amount to claim rewards for");

    uint256 accumulatedReward = (userStake * accRewardPerShare) / 1e12;
    uint256 pendingReward = accumulatedReward - rewardDebt[msg.sender];

    require(pendingReward > 0, "No rewards to claim");
    require(totalRewards >= pendingReward, "Not enough rewards in pool");

    totalRewards -= pendingReward;
    rewardDebt[msg.sender] = accumulatedReward;  // Update the reward debt post-claim

    IWETH(weth).withdraw(pendingReward);
    (bool sent, ) = payable(msg.sender).call{value: pendingReward}("");
    require(sent, "Failed to send ETH");

    emit RewardClaimed(msg.sender, pendingReward);
}




 // Fallback function to receive Ether
    fallback() external payable {
        // Handle received Ether if necessary
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        // Handle received Ether
    }


    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
    }




    function notifyFundsReceived(uint256 amount) external {
    require(msg.sender == factoryAddress, "Only factory can notify");

    // Optionally, you can add logic here if you need to adjust any balances or states based on the received funds
    emit FundsReceived(amount, block.timestamp);
handleReceivedWETHALLQUEUE();     

}








    event DebugAvailableWETH(uint256 availableWETH);
    event DebugProcessAttempt(address user, uint256 amountToProcess);
    event UnstakeRequestDetails(uint index, address user, uint256 amount, uint256 pendingUnstakes);
    event WETHProcessed(address user, uint256 processedAmount, uint256 remainingWETH);
    event ProcessUnstakeError(address user, uint256 requestedAmount, string error);
  event FailedToProcessUnstake(address user, uint256 amount);
  event FundsRequested(uint256 amount);




function handleReceivedWETH() internal{ 
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));
    emit DebugAvailableWETH(availableWETH);  // Log the available WETH balance

    if (unstakeQueue.length > 0) {
        UnstakeRequest storage request = unstakeQueue[0];  // Get the first request in the queue
        emit UnstakeRequestDetails(0, request.user, request.amount, request.timestamp); // Log details of the request

        if (availableWETH >= request.amount) {
            processImmediateUnstake(request.user, request.amount);  // Process the unstake immediately
            removeFromQueue(0);  // Remove the processed request from the queue
            totalFundsNeeded -= (request.amount * 70 / 100);  // Reduce the total funds needed
                   // Update available WETH after processing this unstake
                   availableWETH = IWETH(weth).balanceOf(address(this));

        } else {
 uint256 wethShortfall = request.amount - availableWETH;
            notifyFactoryForFunds(wethShortfall);  // Request the exact needed funds from the factory
            emit FundsRequested(wethShortfall);  // Optionally log this event
                    }
    }
}
 

function handleReceivedWETHDELETE() external{ 
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));
    emit DebugAvailableWETH(availableWETH);  // Log the available WETH balance

    if (unstakeQueue.length > 0) {
        UnstakeRequest storage request = unstakeQueue[0];  // Get the first request in the queue
        emit UnstakeRequestDetails(0, request.user, request.amount, request.timestamp); // Log details of the request

        if (availableWETH >= request.amount) {
            processImmediateUnstake(request.user, request.amount);  // Process the unstake immediately
            removeFromQueue(0);  // Remove the processed request from the queue
        } else {
 uint256 wethShortfall = request.amount - availableWETH;
            notifyFactoryForFunds(wethShortfall);  // Request the exact needed funds from the factory
            emit FundsRequested(wethShortfall);  // Optionally log this event
                    }
    }
}


function handleReceivedWETHALLQUEUE() internal {
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));
    emit DebugAvailableWETH(availableWETH);  // Log the available WETH balance

    uint256 fundsNeeded = 0;

    for (uint i = 0; i < unstakeQueue.length && availableWETH > 0;) {
        UnstakeRequest storage request = unstakeQueue[i];

        if (availableWETH >= request.amount) {
            processImmediateUnstake(request.user, request.amount);
            availableWETH -= request.amount;  // Update available WETH after processing this unstake

            unstakeQueue[i] = unstakeQueue[unstakeQueue.length - 1];  // Efficient removal of processed request
            unstakeQueue.pop();  // Adjust the length of the queue
        } else {
            fundsNeeded += request.amount - availableWETH;
            i++;  // Only increment if the unstake is not processed
        }
    }

    if (fundsNeeded > 0) {
        notifyFactoryForFunds(fundsNeeded);
        emit FundsRequested(fundsNeeded);
    }
}



function removeFromQueue(uint index) internal {
    require(index < unstakeQueue.length, "Index out of bounds.");
    unstakeQueue[index] = unstakeQueue[unstakeQueue.length - 1];
    unstakeQueue.pop();  // Remove the last element after moving it to replace the processed one
}





function canProcessUnstake(address user, uint256 amount) internal view returns (bool) {
    // Example check that needs to be tailored to actual requirements
    return IWETH(weth).balanceOf(address(this)) >= amount && pendingUnstakes[user] >= amount;
}


// Function to get the length of the unstake queue
function getUnstakeQueueLength() public view returns (uint) {
    return unstakeQueue.length;
}

// Function to get details of a request by index
function getUnstakeRequest(uint index) public view returns (address user, uint256 amount, uint256 timestamp) {
    require(index < unstakeQueue.length, "Index out of bounds");
    UnstakeRequest storage request = unstakeQueue[index];
    return (request.user, request.amount, request.timestamp);
}


// know the total amount in weth on the unstake queue
function getTotalUnstakeQueueAmount() public view returns (uint256 totalAmount) {
    uint256 total = 0;
    for (uint i = 0; i < unstakeQueue.length; i++) {
        total += unstakeQueue[i].amount;
    }
    return total;
}



}



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

interface IFundsInterface {
    function notifyFundsNeeded(uint256 amount) external;
      function provideFundsIfNeeded(address stakingContract, uint256 amountRequested) external;
}


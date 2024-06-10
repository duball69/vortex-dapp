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
   uint256 public constant REWARD_INTERVAL = 5 minutes; // Reward distribution interval


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


 
  constructor(address _weth) {
        owner = msg.sender;  // Set the deployer as the owner
        lastRewardTime = block.timestamp;
        weth = _weth;
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


function unstake(uint256 amount) external nonReentrant {
    require(stakes[msg.sender] >= amount, "Insufficient staked balance");
    require(stakes[msg.sender] - pendingUnstakes[msg.sender] >= amount, "Unstake amount exceeds available balance");

    updatePool();

    uint256 wethBalance = IWETH(weth).balanceOf(address(this));
    if (wethBalance >= amount) {
        // There is enough WETH in the pool to fulfill the unstake request immediately
        processImmediateUnstake(msg.sender, amount);
    } else {
        // Not enough WETH available, add the request to the unstake queue
        addToUnstakeQueue(msg.sender, amount);
    }
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


function addToUnstakeQueue(address user, uint256 amount) internal {
    UnstakeRequest memory request = UnstakeRequest({
        user: user,
        amount: amount,
        timestamp: block.timestamp  // Storing the timestamp can help with processing logic later if needed
    });
    unstakeQueue.push(request);
    emit UnstakeQueued(user, amount, block.timestamp);  // Consider creating and emitting an event for a queued unstake request


      uint256 fundsNeeded = amount * 70 / 100;
    notifyFactoryForFunds(fundsNeeded);
}



function notifyFactoryForFunds(uint256 amount) internal {
    IFundsInterface(factoryAddress).notifyFundsNeeded(amount);
}



function requestUnstake(uint256 amount) public nonReentrant {
    require(stakes[msg.sender] >= amount, "Insufficient staked balance");
    require(stakes[msg.sender] - pendingUnstakes[msg.sender] >= amount, "Unstake amount exceeds available balance");

    pendingUnstakes[msg.sender] += amount; // Lock this amount for unstaking

    uint256 wethBalance = IWETH(weth).balanceOf(address(this)); // Get current WETH balance

    if (wethBalance < amount) {
        addToUnstakeQueue(msg.sender, amount);
    } else {
        processImmediateUnstake(msg.sender, amount);
    }

    emit UnstakeRequested(msg.sender, amount, pendingUnstakes[msg.sender]);
}





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
    if (totalRewards > 0) {
        uint256 reward = multiplier * totalRewards / REWARD_INTERVAL;
        totalRewards = totalRewards > reward ? totalRewards - reward : 0;
        accRewardPerShare += reward * 1e12 / totalStaked;
    }

    lastRewardTime = block.timestamp;
}

function addRewards() external payable {
    require(msg.value > 0, "No rewards to add");
    totalRewards += msg.value;
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



    function claimRewards() external nonReentrant {
    uint256 userStake = stakes[msg.sender];
    require(userStake > 0, "No staked amount to claim rewards for");
 
    updatePool();

    uint256 accumulatedReward = (userStake * accRewardPerShare / 1e12);
    uint256 pendingReward = accumulatedReward - rewardDebt[msg.sender];

    require(pendingReward > 0, "No rewards to claim");
    require(IWETH(weth).balanceOf(address(this)) >= pendingReward, "Not enough WETH in contract");

    // Update the reward debt to the latest accumulated reward
    rewardDebt[msg.sender] = accumulatedReward;

    // Convert WETH to ETH
    IWETH(weth).withdraw(pendingReward);

    // Send ETH to the user
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
handleReceivedWETH();     

}








    event DebugAvailableWETH(uint256 availableWETH);
    event DebugProcessAttempt(address user, uint256 amountToProcess);
    event UnstakeRequestDetails(uint index, address user, uint256 amount, uint256 pendingUnstakes);
    event WETHProcessed(address user, uint256 processedAmount, uint256 remainingWETH);
    event ProcessUnstakeError(address user, uint256 requestedAmount, string error);
  event FailedToProcessUnstake(address user, uint256 amount);
  event FundsRequested(uint256 amount);




function handleReceivedWETH() internal{ // CHANGE TO INTERNAL AFTER TESTS
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
}

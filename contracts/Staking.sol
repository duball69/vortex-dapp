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
    uint256 public constant REWARD_INTERVAL = 1 days; // Reward distribution interval


    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event UnstakeQueued(address indexed user, uint256 amount, uint256 timestamp);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 pendingAmount);
    event UnstakeProcessed(address indexed user, uint256 amount, uint256 pendingAmount);



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
}


function requestUnstake(uint256 amount) public nonReentrant {
    require(stakes[msg.sender] >= amount, "Insufficient staked balance");
    require(stakes[msg.sender] - pendingUnstakes[msg.sender] >= amount, "Unstake amount exceeds available balance");

    pendingUnstakes[msg.sender] += amount; // Lock this amount for unstaking

    uint256 wethBalance = IWETH(weth).balanceOf(address(this)); // Get current WETH balance

    if (wethBalance < amount) {
        addToUnstakeQueue(msg.sender, amount);
    } else {
        processUnstake(msg.sender, amount);
    }

    emit UnstakeRequested(msg.sender, amount, pendingUnstakes[msg.sender]);
}


    function processUnstake(address user, uint256 amount) internal {
    require(pendingUnstakes[user] >= amount, "Requested amount exceeds pending unstakes.");
    
    uint256 amountToProcess = amount;
    for (uint i = 0; i < unstakeQueue.length && amountToProcess > 0; i++) {
        // Find the earliest request that matches the user and has not been fully processed
        if (unstakeQueue[i].user == user && unstakeQueue[i].amount > 0) {
            uint256 processAmount = (unstakeQueue[i].amount <= amountToProcess) ? unstakeQueue[i].amount : amountToProcess;
            
            // Process this amount
            IWETH(weth).withdraw(processAmount);
            payable(user).transfer(processAmount);

            // Update the queue and the pending unstakes
            unstakeQueue[i].amount -= processAmount;
            amountToProcess -= processAmount;

            emit UnstakeProcessed(user, processAmount, pendingUnstakes[user]);

            // If the unstake request is fully processed, clear it
            if (unstakeQueue[i].amount == 0) {
                removeFromQueue(i);
                i--; // Adjust index after removal
            }
        }
    }

    pendingUnstakes[user] -= amount;
    totalStaked -= amount;
    rewardDebt[user] = stakes[user] * accRewardPerShare / 1e12;
}

// Helper function to remove an entry from the queue by index
function removeFromQueue(uint index) internal {
    require(index < unstakeQueue.length, "Index out of bounds.");

    for (uint i = index; i < unstakeQueue.length - 1; i++) {
        unstakeQueue[i] = unstakeQueue[i + 1];
    }
    unstakeQueue.pop(); // Remove the last element after shifting
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
        uint256 reward = multiplier * totalRewards / REWARD_INTERVAL;

        totalRewards -= reward;
        accRewardPerShare += reward * 1e12 / totalStaked;
        lastRewardTime = block.timestamp;
    }

    function addRewards() external payable {
        require(msg.value > 0, "No rewards to add");
        updatePool();
        totalRewards += msg.value;
        emit RewardsAdded(msg.value);
    }

    function pendingReward(address _user) external view returns (uint256) {
        uint256 _accRewardPerShare = accRewardPerShare;
        if (block.timestamp > lastRewardTime && totalStaked != 0) {
            uint256 multiplier = block.timestamp - lastRewardTime;
            uint256 reward = multiplier * totalRewards / REWARD_INTERVAL;
            _accRewardPerShare += reward * 1e12 / totalStaked;
        }
        return (stakes[_user] * _accRewardPerShare / 1e12) - rewardDebt[_user];
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


function handleReceivedWETH() public {
    uint256 availableWETH = IWETH(weth).balanceOf(address(this));

    // Iterate over the unstake queue to process requests.
    uint i = 0;
    while (i < unstakeQueue.length && availableWETH > 0) {
        UnstakeRequest storage request = unstakeQueue[i];
        
        if (request.amount > 0 && pendingUnstakes[request.user] >= request.amount) {
            uint256 amountToProcess = (availableWETH >= request.amount) ? request.amount : availableWETH;

            // Process the unstake.
            processUnstake(request.user, amountToProcess);

            // Subtract the processed amount from available WETH.
            availableWETH -= amountToProcess;
        }
        i++;
    }


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

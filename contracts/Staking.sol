// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleStaking is ReentrancyGuard{
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewardDebt;
    uint256 public totalStaked;
    uint256 public totalRewards;
    uint256 public accRewardPerShare; // Accumulated rewards per share, times 1e12 to prevent precision loss
    uint256 public lastRewardTime;
    uint256 public constant REWARD_INTERVAL = 1 days; // Reward distribution interval

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor() {
        lastRewardTime = block.timestamp;
    }

    function stake() external payable nonReentrant {
    require(msg.value > 0, "Cannot stake 0 ETH");
    updatePool();

    if (stakes[msg.sender] > 0) {
        uint256 pending = (stakes[msg.sender] * accRewardPerShare / 1e12) - rewardDebt[msg.sender];
        if (pending > 0) {
            payable(msg.sender).transfer(pending);
            emit RewardClaimed(msg.sender, pending);
        }
    }

    stakes[msg.sender] += msg.value;
    totalStaked += msg.value;
    rewardDebt[msg.sender] = stakes[msg.sender] * accRewardPerShare / 1e12;
    
    emit Stake(msg.sender, msg.value);
}


function unstake(uint256 amount) external nonReentrant {
    require(stakes[msg.sender] >= amount, "Insufficient balance to unstake");
    updatePool();

    uint256 pending = (stakes[msg.sender] * accRewardPerShare / 1e12) - rewardDebt[msg.sender];
    if (pending > 0) {
        payable(msg.sender).transfer(pending);
        emit RewardClaimed(msg.sender, pending);
    }

    stakes[msg.sender] -= amount;
    totalStaked -= amount;
    rewardDebt[msg.sender] = stakes[msg.sender] * accRewardPerShare / 1e12;

    payable(msg.sender).transfer(amount);
    emit Unstake(msg.sender, amount);
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

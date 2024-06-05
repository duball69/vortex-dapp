// SPDX-License-Identifier: MIT
// VortexDapp Staking v0.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleStaking is ReentrancyGuard{
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewardDebt;
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


 

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
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

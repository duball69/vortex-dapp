// SPDX-License-Identifier: MIT
// VortexDapp Staking v0.1

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleStaking is ReentrancyGuard {
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingUnstakes;
    address public factoryAddress;
    address public weth;
    address public owner;
    uint256 public totalStaked;
    uint256 public totalRewards;
    uint256 public accRewardPerShare;
    uint256 public lastRewardTime;
    uint256 public constant REWARD_INTERVAL = 7 days;
    uint256 public rewardRate; // Rewards distributed per second

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event RewardsAdded(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event UnstakeQueued(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event UnstakeRequested(
        address indexed user,
        uint256 amount,
        uint256 pendingAmount
    );
    event UnstakeProcessed(
        address indexed user,
        uint256 amount,
        uint256 pendingAmount
    );
    event FundsReceived(uint256 amount, uint256 timestamp);
    event TotalRewardsUpdated(uint256 newTotalRewards);

    struct UnstakeRequest {
        address user;
        uint256 amount;
        uint256 timestamp;
    }

    UnstakeRequest[] public unstakeQueue;

    constructor(address _weth, address factory) {
        owner = msg.sender;
        lastRewardTime = block.timestamp;
        weth = _weth;
        factoryAddress = factory;
    }

    function stake() external payable nonReentrant {
        require(msg.value > 0, "Cannot stake 0 ETH");
        updatePool();

        IWETH(weth).deposit{value: msg.value}();

        uint256 factoryShare = (msg.value * 70) / 100;
        uint256 reserveShare = msg.value - factoryShare;

        require(
            IWETH(weth).transfer(factoryAddress, factoryShare),
            "Failed to send WETH to factory"
        );

        if (stakes[msg.sender] > 0) {
            uint256 pending = ((stakes[msg.sender] * accRewardPerShare) /
                1e12) - rewardDebt[msg.sender];
            if (pending > 0) {
                IWETH(weth).withdraw(pending);
                payable(msg.sender).transfer(pending);
                emit RewardClaimed(msg.sender, pending);
            }
        }

        stakes[msg.sender] += msg.value;
        totalStaked += msg.value;
        rewardDebt[msg.sender] =
            (stakes[msg.sender] * accRewardPerShare) /
            1e12;

        emit Stake(msg.sender, msg.value);
    }

    function processImmediateUnstake(address user, uint256 amount) internal {
        IWETH(weth).withdraw(amount);
        payable(user).transfer(amount);
        stakes[user] -= amount;
        totalStaked -= amount;
        rewardDebt[user] = (stakes[user] * accRewardPerShare) / 1e12;

        emit Unstake(user, amount);
    }

    uint256 public totalFundsNeeded;

    function addToUnstakeQueue(address user, uint256 amount) internal {
        UnstakeRequest memory request = UnstakeRequest({
            user: user,
            amount: amount,
            timestamp: block.timestamp
        });
        unstakeQueue.push(request);
        emit UnstakeQueued(user, amount, block.timestamp);
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
            uint256 shortfall = amount - wethBalance;

            IFundsInterface(factoryAddress).provideFundsIfNeeded(
                address(this),
                shortfall
            );

            wethBalance = IWETH(weth).balanceOf(address(this));

            if (wethBalance >= amount) {
                processImmediateUnstake(msg.sender, amount);
            } else {
                pendingUnstakes[msg.sender] += amount;
                addToUnstakeQueue(msg.sender, amount);
            }
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

        uint256 timeElapsed = block.timestamp - lastRewardTime;
        uint256 reward = timeElapsed * rewardRate;

        // Ensure rewards do not exceed totalRewards
        if (reward > totalRewards) {
            reward = totalRewards;
        }

        // Update accRewardPerShare
        accRewardPerShare += (reward * 1e12) / totalStaked;

        // Deduct the distributed rewards from totalRewards
        totalRewards -= reward;

        // Update lastRewardTime
        lastRewardTime = block.timestamp;
    }

    function addRewards() external payable onlyAuth {
        require(msg.value > 0, "No rewards to add");

        // Deposit ETH to WETH
        IWETH(weth).deposit{value: msg.value}();

        // First, update the pool to process any pending rewards
        updatePool();

        // Add the newly deposited rewards to totalRewards
        totalRewards += msg.value;
        emit TotalRewardsUpdated(totalRewards);

        // Recalculate rewardRate based on the updated totalRewards and REWARD_INTERVAL
        rewardRate = totalRewards / REWARD_INTERVAL;

        // Update lastRewardTime to the current block timestamp
        lastRewardTime = block.timestamp;

        // Emit event indicating new rewards have been added
        emit RewardsAdded(msg.value);
    }

    function pendingReward(address _user) external view returns (uint256) {
        uint256 _accRewardPerShare = accRewardPerShare;
        if (block.timestamp > lastRewardTime && totalStaked != 0) {
            uint256 timeElapsed = block.timestamp - lastRewardTime;
            uint256 reward = timeElapsed * rewardRate;

            // Ensure rewards do not exceed totalRewards
            if (reward > totalRewards) {
                reward = totalRewards;
            }

            _accRewardPerShare += (reward * 1e12) / totalStaked;
        }
        uint256 simulatedReward = (stakes[_user] * _accRewardPerShare) / 1e12;
        return simulatedReward - rewardDebt[_user];
    }

    function getTotalStaked() public view returns (uint256) {
        return totalStaked;
    }

    function claimRewards() external nonReentrant {
        updatePool();

        uint256 userStake = stakes[msg.sender];
        require(userStake > 0, "No staked amount to claim rewards for");

        uint256 accumulatedReward = (userStake * accRewardPerShare) / 1e12;
        uint256 userpendingReward = accumulatedReward - rewardDebt[msg.sender];

        require(userpendingReward > 0, "No rewards to claim");
        require(
            totalRewards >= userpendingReward,
            "Not enough rewards in pool"
        );

        totalRewards -= userpendingReward;
        rewardDebt[msg.sender] = accumulatedReward;

        IWETH(weth).withdraw(userpendingReward);
        (bool sent, ) = payable(msg.sender).call{value: userpendingReward}("");
        require(sent, "Failed to send ETH");
        emit RewardClaimed(msg.sender, userpendingReward);
    }

    fallback() external payable {}

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyAuth() {
        require(
            msg.sender == owner ||
                msg.sender == address(this) ||
                msg.sender == factoryAddress,
            "Caller is not authorized"
        );
        _;
    }

    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
    }

    function notifyFundsReceived(uint256 amount) external {
        require(msg.sender == factoryAddress, "Only factory can notify");
        emit FundsReceived(amount, block.timestamp);
        handleReceivedWETHALLQUEUE();
    }

    event DebugAvailableWETH(uint256 availableWETH);
    event DebugProcessAttempt(address user, uint256 amountToProcess);
    event UnstakeRequestDetails(
        uint index,
        address user,
        uint256 amount,
        uint256 pendingUnstakes
    );
    event WETHProcessed(
        address user,
        uint256 processedAmount,
        uint256 remainingWETH
    );
    event ProcessUnstakeError(
        address user,
        uint256 requestedAmount,
        string error
    );
    event FailedToProcessUnstake(address user, uint256 amount);
    event FundsRequested(uint256 amount);

    function handleReceivedWETH() public nonReentrant {
        uint256 availableWETH = IWETH(weth).balanceOf(address(this));
        emit DebugAvailableWETH(availableWETH);

        uint256 fundsNeeded = 0;

        for (uint i = 0; i < unstakeQueue.length && availableWETH > 0; ) {
            UnstakeRequest storage request = unstakeQueue[i];

            if (availableWETH >= request.amount) {
                processImmediateUnstake(request.user, request.amount);
                availableWETH -= request.amount;

                unstakeQueue[i] = unstakeQueue[unstakeQueue.length - 1];
                unstakeQueue.pop();
            } else {
                fundsNeeded += request.amount - availableWETH;
                i++;
            }
        }

        if (fundsNeeded > 0) {
            notifyFactoryForFunds(fundsNeeded);
            emit FundsRequested(fundsNeeded);
        }
    }

    function handleReceivedWETHALLQUEUE() internal {
        uint256 availableWETH = IWETH(weth).balanceOf(address(this));
        emit DebugAvailableWETH(availableWETH);

        uint256 fundsNeeded = 0;

        for (uint i = 0; i < unstakeQueue.length && availableWETH > 0; ) {
            UnstakeRequest storage request = unstakeQueue[i];

            if (availableWETH >= request.amount) {
                processImmediateUnstake(request.user, request.amount);
                availableWETH -= request.amount;

                unstakeQueue[i] = unstakeQueue[unstakeQueue.length - 1];
                unstakeQueue.pop();
            } else {
                fundsNeeded += request.amount - availableWETH;
                i++;
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
        unstakeQueue.pop();
    }

    function canProcessUnstake(
        address user,
        uint256 amount
    ) internal view returns (bool) {
        return
            IWETH(weth).balanceOf(address(this)) >= amount &&
            pendingUnstakes[user] >= amount;
    }

    function getUnstakeQueueLength() public view returns (uint) {
        return unstakeQueue.length;
    }

    function getUnstakeRequest(
        uint index
    ) public view returns (address user, uint256 amount, uint256 timestamp) {
        require(index < unstakeQueue.length, "Index out of bounds");
        UnstakeRequest storage request = unstakeQueue[index];
        return (request.user, request.amount, request.timestamp);
    }

    function getTotalUnstakeQueueAmount()
        public
        view
        returns (uint256 totalAmount)
    {
        uint256 total = 0;
        for (uint i = 0; i < unstakeQueue.length; i++) {
            total += unstakeQueue[i].amount;
        }
        return total;
    }

    function getTotalRewards() external view returns (uint256) {
        return totalRewards;
    }
}

interface IWETH {
    function deposit() external payable;

    function deposit(uint256 amount) external payable;

    function withdraw(uint256 amount) external;

    function approve(address spender, uint256 amount) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function balanceOf(address owner) external view returns (uint256);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
}

interface IFundsInterface {
    function notifyFundsNeeded(uint256 amount) external;

    function provideFundsIfNeeded(
        address stakingContract,
        uint256 amountRequested
    ) external;
}

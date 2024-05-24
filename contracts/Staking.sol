// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStaking {
    mapping(address => uint256) public stakes;
    uint256 public totalStaked;

    function stake() external payable {
        require(msg.value > 0, "Cannot stake 0 ETH");
        stakes[msg.sender] += msg.value;
        totalStaked += msg.value;
    }

    function unstake(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "Insufficient balance to unstake");
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getStake(address staker) external view returns (uint256) {
        return stakes[staker];
    }

    
    // Fallback function to receive Ether
    fallback() external payable {
        // Handle received Ether if necessary
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        // Handle received Ether
    }


}



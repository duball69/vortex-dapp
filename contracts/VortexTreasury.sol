// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Treasury {
    address public owner;
    address public factoryAddress;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor(address factory) {
        owner = msg.sender; // Set the deployer as the owner
        factoryAddress = factory;
    }

    // Function to receive funds
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Function to withdraw funds
    function withdrawFunds(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit FundsWithdrawn(to, amount);
    }

    // Function to get the balance of the treasury
    function getBalance() external view returns (uint256) {
        return address(this).balance;
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

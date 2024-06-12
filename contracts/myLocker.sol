// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract LiquidityLocker is ERC721Holder {
    struct Lock {
        address tokenAddress;
        uint256 tokenId;
        uint256 unlockTime;
    }

    address public owner;
    mapping(uint256 => Lock) public locks;
    uint256 public nextLockId;

    event LiquidityLocked(uint256 indexed lockId, address indexed tokenAddress, uint256 tokenId, uint256 unlockTime);
    event LiquidityUnlocked(uint256 indexed lockId, address indexed tokenAddress, uint256 tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender; // Set the owner to the deployer of the contract
    }

    // Locks the liquidity NFT
    function lockLiquidity(address _nftAddress, uint256 _tokenId, uint256 _duration, address factory) external onlyOwner returns (uint256 lockId) {
        require(_nftAddress != address(0), "Invalid NFT address");

        // Transfer the NFT from the sender to this contract
        IERC721(_nftAddress).transferFrom(factory, address(this), _tokenId);

        lockId = nextLockId++;
        uint256 unlockTime = block.timestamp + _duration;

        locks[lockId] = Lock({
            tokenAddress: _nftAddress,
            tokenId: _tokenId,
            unlockTime: unlockTime
        });

        emit LiquidityLocked(lockId, _nftAddress, _tokenId, unlockTime);
        return lockId;
    }

    // Unlocks the liquidity NFT
    function unlockLiquidity(uint256 _lockId, address factory) external onlyOwner {
        Lock storage lock = locks[_lockId];
        require(block.timestamp >= lock.unlockTime, "Liquidity is still locked");

        address nftAddress = lock.tokenAddress;
        uint256 tokenId = lock.tokenId;

        // Transfer the NFT back to the owner
        IERC721(nftAddress).transferFrom(address(this), factory, tokenId);

        delete locks[_lockId]; // Clean up the storage

        emit LiquidityUnlocked(_lockId, nftAddress, tokenId);
    }

    // Utility function to change ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
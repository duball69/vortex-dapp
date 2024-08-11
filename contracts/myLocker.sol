// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract LiquidityLocker is ERC721Holder {
    struct Lock {
        uint256 tokenId;
        bool isLocked;
        uint256 lockID;
        uint256 unlockTime;
    }

    mapping(uint256 => uint256) private tokenIndex; // Maps tokenId to index in allTokens array

    address public owner;
    mapping(uint256 => Lock) public locks;
    uint256 public nextLockId = 0;
    INonfungiblePositionManager public positionManager;
    address nftAddress;
    address public factoryAddress;

    event LiquidityLocked(
        uint256 indexed lockId,
        address indexed tokenAddress,
        uint256 tokenId,
        uint256 unlockTime
    );
    event LiquidityUnlocked(
        uint256 indexed lockId,
        address indexed tokenAddress,
        uint256 tokenId
    );
    event FeesCollected(uint256, uint256, uint256);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyAuth() {
        require(
            msg.sender == owner || msg.sender == factoryAddress,
            "Caller is not authorized"
        );
        _;
    }

    // Set the factory address
    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
    }

    constructor(address _positionManager) {
        owner = msg.sender; // Set the owner to the deployer of the contract
        positionManager = INonfungiblePositionManager(_positionManager);
        nftAddress = _positionManager;
    }

    /* // Method to get all token addresses
    function getAllTokens() public view onlyOwner returns (uint256[] memory _tokenId, bool[] memory _isLocked, uint256[] memory _lockID, uint256[] memory _unlockTime) {
    _tokenId = new uint256[](allTokens.length);
    _isLocked = new bool[](allTokens.length);
    _lockID = new uint256[](allTokens.length);
    _unlockTime = new uint256[](allTokens.length);
    
    for (uint i = 0; i < allTokens.length; i++) {
        _tokenId[i] = allTokens[i].tokenId;
        _isLocked[i] = allTokens[i].isLocked;
        _lockID[i] = allTokens[i].lockID;
        _unlockTime[i] = allTokens[i].unlockTime;
    }

    return (_tokenId, _isLocked, _lockID, _unlockTime);
} */

    // Locks the liquidity NFT
    function lockLiquidity(
        address _nftAddress,
        uint256 _tokenId,
        uint256 _duration,
        address factory
    ) external onlyAuth returns (uint256 lockId) {
        require(_nftAddress != address(0), "Invalid NFT address");

        // Transfer the NFT from the sender to this contract
        IERC721(_nftAddress).transferFrom(factory, address(this), _tokenId);

        uint256 unlockTime = block.timestamp + _duration;

        lockId = nextLockId++;

        locks[lockId] = Lock({
            tokenId: _tokenId,
            isLocked: true,
            lockID: lockId,
            unlockTime: unlockTime
        });

        // Save the index of the new token details in the mapping
        //tokenIndex[_tokenId] = allTokens.length - 1;

        emit LiquidityLocked(lockId, _nftAddress, _tokenId, unlockTime);

        return lockId;
    }

    // Unlocks the liquidity NFT
    function unlockLiquidity(
        uint256 _lockId,
        address factory
    ) external onlyOwner {
        Lock storage lock = locks[_lockId];
        require(
            block.timestamp >= lock.unlockTime,
            "Liquidity is still locked"
        );

        uint256 token_Id = lock.tokenId;

        // Transfer the NFT back to the owner
        IERC721(nftAddress).transferFrom(address(this), factory, token_Id);

        delete locks[_lockId]; // Clean up the storage

        emit LiquidityUnlocked(_lockId, nftAddress, token_Id);

        //uint256 index = tokenIndex[token_Id]; // Get the index from mapping
        // allTokens[index].isLocked = false;
    }

    // Function to approve the factory contract to manage the locked NFT
    function approveFactory(address factory, uint256 tokenId) external {
        IERC721(nftAddress).approve(factory, tokenId);
    }

    // Function to collect fees from the locked NFT
    function collectFees(uint256 tokenId, address factory) external onlyOwner {
        INonfungiblePositionManager.CollectParams
            memory params = INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: factory,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (uint256 amount0, uint256 amount1) = positionManager.collect(params);

        emit FeesCollected(tokenId, amount0, amount1);
    }

    // Utility function to change ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}

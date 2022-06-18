//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "hardhat/console.sol";

contract MerkleVesting is Ownable {
    bytes32 claimMerkleRoot;
    mapping (address => bool) addressClaim;
    IERC20 immutable _token;

    event Claim(address indexed claimer, uint256 amount);
    event Vest(bytes32 indexed merkleProof);

    constructor(IERC20 vestedToken) {
        _token = vestedToken;
    }

    function vestTokens(bytes32 merkleRoot) external onlyOwner {
        claimMerkleRoot = merkleRoot;
        emit Vest(merkleRoot);
    }

    function claimTokens(uint256 amount, bytes32[] calldata merkleProof) external {
        require(canClaimTokens(amount, merkleProof), "cannot claim");

        addressClaim[msg.sender] = true;
        _token.transfer(msg.sender, amount);

        emit Claim(msg.sender, amount);
    }

    function canClaimTokens(uint256 amount, bytes32[] calldata merkleProof) private view returns (bool) {
        return addressClaim[msg.sender] == false && MerkleProof.verify(merkleProof, claimMerkleRoot, keccak256(abi.encodePacked(msg.sender, amount)));
    }
}
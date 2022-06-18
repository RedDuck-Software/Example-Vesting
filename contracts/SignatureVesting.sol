//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract SignatureVesting is Ownable {
    using ECDSA for bytes32;

    mapping (bytes => bool) signatureClaim;
    IERC20 immutable _token;

    event Claim(address indexed claimer, uint256 amount);

    constructor(IERC20 vestedToken) {
        _token = vestedToken;
    }

    function claimTokens(uint256 amount, uint256 nonce, bytes calldata signature) external {
        require(canClaimTokens(amount, nonce, signature), "cannot claim");

        signatureClaim[signature] = true;
        _token.transfer(msg.sender, amount);

        emit Claim(msg.sender, amount);
    }

    function canClaimTokens(uint256 amount, uint256 nonce, bytes calldata signature) private view returns (bool) {
        bytes32 message = keccak256(abi.encodePacked(msg.sender, amount, nonce, address(this)));

        return signatureClaim[signature] == false 
            && message.toEthSignedMessageHash().recover(signature) == owner();
    }
}
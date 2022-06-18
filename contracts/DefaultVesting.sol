//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DefaultVesting is Ownable {
    mapping (address => uint256) claimableAmount;
    IERC20 immutable _token;

    event Claim(address indexed claimer, uint256 amount);
    event Vest(address indexed claimer, uint256 amount);

    constructor(IERC20 vestedToken) {
        _token = vestedToken;
    }

    function vestTokens(address to, uint256 amount) external onlyOwner {
        claimableAmount[to] += amount;

        emit Vest(to, amount);
    }

    function vestTokensMany(address[] calldata toArray, uint256[] calldata amountArray) external onlyOwner {
        for (uint256 i = 0; i < toArray.length; i++) {
            claimableAmount[toArray[i]] = amountArray[i];
        }
    }

    function claimTokens(uint256 amount) external {
        require(canClaimTokens(amount), "cannot claim");

        claimableAmount[msg.sender] -= amount;
        _token.transfer(msg.sender, amount);

        emit Claim(msg.sender, amount);
    }

    function canClaimTokens(uint256 amount) private view returns (bool) {
        return claimableAmount[msg.sender] >= amount;
    }
}
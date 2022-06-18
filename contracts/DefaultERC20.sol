pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DefaultERC20 is ERC20 {
    constructor() ERC20("DefaultToken", "DT") {
        _mint(msg.sender, 10 * 10**decimals());
    }
}
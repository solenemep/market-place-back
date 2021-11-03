//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Place.sol";
import "./Signature.sol";

contract WToken is ERC20 {
    using SafeMath for uint256;
    using Address for address payable;

    event Deposited(address indexed sender, uint256 amount);
    event Withdrawed(address indexed sender, uint256 amount);

    constructor() ERC20("WrappedBNB", "WBNB") {}

    function deposit() public payable {
        _deposit(msg.sender, msg.value);
    }

    /// @notice Allow user to switch ETH to WETH
    function _deposit(address sender, uint256 value) private {
        _mint(sender, value);
        emit Deposited(sender, value);
    }

    /// @notice Allow user to switch WETH to ETH
    function withdraw(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "WToken : you can not withdraw more than you have");
        _burn(msg.sender, amount);
        payable(msg.sender).sendValue(amount);
        emit Withdrawed(msg.sender, amount);
    }
}

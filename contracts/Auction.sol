//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./Place.sol";
import "./Signature.sol";

contract Auction is ERC20, Ownable {
    using SafeMath for uint256;
    using Address for address payable;

    Place private _place;
    Signature private _signature;

    // Events
    event Deposited(address indexed sender, uint256 amount);
    event Withdrawed(address indexed sender, uint256 amount);
    event BidAccepted(address indexed sender, uint256 tokenId);
    event BidDeclined(address indexed sender, uint256 bid);

    constructor(
        address placeAddress,
        address signatureAddress,
        address owner
    ) ERC20("WrappedEther", "WETH") Ownable() {
        _place = Place(placeAddress);
        _signature = Signature(signatureAddress);
        transferOwnership(owner);
    }

    modifier isCreator(Signature.Bid calldata bid) {
        require(bid.voucher.creator == msg.sender, "Auction : not creator");
        _;
    }

    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

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
        require(balanceOf(msg.sender) >= amount, "Auction : you can not withdraw more than you have");
        _burn(msg.sender, amount);
        payable(msg.sender).sendValue(amount);
        emit Withdrawed(msg.sender, amount);
    }

    function acceptBid(Signature.Bid calldata bid) public isCreator(bid) {
        address signer = _signature.verifyBid(bid);
        require(signer == bid.bidder, "Auction : bidder did not sign this transaction");
        require(bid.value >= bid.voucher.price, "Auction : payment must be higher than minimum price");
        require(bid.amount <= bid.voucher.supply, "Auction : can not buy more than stock");
        _place.mintAndTransfer(bid.bidder, bid.amount, bid.voucher);

        // charges bid amount from buyer's wallet
        // redirects bid amount to seller wallet
        // charges gas fee for transaction from seller => paid accepting bid (msg.sender)
        // charges 5% service fee of bid price => to OWNER of contrat
        transferFrom(bid.bidder, bid.voucher.creator, bid.value);
        uint256 charges = bid.value.mul(5).div(100);
        transfer(owner(), charges);

        emit BidAccepted(msg.sender, bid.voucher.tokenId);
    }

    function declineBid(Signature.Bid calldata bid) public isCreator(bid) {
        //address signer = _signature.verifyBid(bid);
        //require(signer == bid.bidder, "Auction : bidder did not sign this transaction");
        emit BidDeclined(msg.sender, bid.voucher.tokenId);
    }

    function signature() public view returns (Signature) {
        return _signature;
    }

    function place() public view returns (Place) {
        return _place;
    }
}

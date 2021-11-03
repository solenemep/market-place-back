//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./WToken.sol";
import "./Place.sol";
import "./Signature.sol";

contract Auction is Ownable {
    using SafeMath for uint256;
    using Address for address payable;

    WToken private _wToken;
    Place private _place;
    Signature private _signature;

    // Events
    event BidAccepted(address indexed sender, uint256 tokenId);
    event BidDeclined(address indexed sender, uint256 tokenId);

    constructor(
        address wTokenAddress,
        address placeAddress,
        address signatureAddress,
        address owner
    ) Ownable() {
        _wToken = WToken(wTokenAddress);
        _place = Place(placeAddress);
        _signature = Signature(signatureAddress);
        transferOwnership(owner);
    }

    modifier isCreator(Signature.Bid calldata bid) {
        require(bid.creator == msg.sender, "Auction : not creator");
        _;
    }

    function acceptBid(
        Signature.Bid calldata bid,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public isCreator(bid) {
        require(_signature.verifyBid(bid, v, r, s), "Auction : bidder did not sign this transaction");
        require(bid.value >= bid.price * bid.amount, "Auction : payment must be higher than minimum price");
        require(bid.amount <= bid.supply, "Auction : can not buy more than stock");

        // charges bid amount from buyer's wallet
        // redirects bid amount to seller wallet
        // charges gas fee for transaction from seller => paid accepting bid (msg.sender)
        // charges 5% service fee of bid price => to OWNER of contrat
        uint256 charges = bid.value.mul(5).div(100);
        _wToken.transferFrom(bid.bidder, bid.creator, bid.value - charges);
        _wToken.transferFrom(bid.bidder, owner(), charges);
        _place.mintAndTransfer(bid.tokenId, bid.creator, bid.bidder, bid.amount);
        emit BidAccepted(msg.sender, bid.tokenId);
    }

    function declineBid(
        Signature.Bid calldata bid,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public isCreator(bid) {
        require(_signature.verifyBid(bid, v, r, s), "Auction : bidder did not sign this transaction");
        emit BidDeclined(msg.sender, bid.tokenId);
    }

    function wToken() public view returns (WToken) {
        return _wToken;
    }

    function place() public view returns (Place) {
        return _place;
    }

    function signature() public view returns (Signature) {
        return _signature;
    }
}

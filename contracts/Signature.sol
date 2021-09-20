//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract Signature is EIP712 {
    using ECDSA for bytes32;
    string private constant _SIGNING_DOMAIN = "Sacred-Signature";
    string private constant _SIGNATURE_VERSION = "1";

    bytes32 private constant _EIP712DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant _VOUCHER_TYPEHASH =
        keccak256("Voucher(uint tokenId,address creator,uint256 supply,uint256 price)");
    bytes32 private constant _BID_TYPEHASH =
        keccak256(
            "Bid(Voucher voucher,address bidder,uint256 amount,uint256 value)Voucher(uint tokenId,address creator,uint256 supply,uint256 price)"
        );
    bytes32 private _DOMAIN_SEPARATOR;

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct Voucher {
        uint256 tokenId;
        address creator;
        uint256 supply;
        uint256 price;
        bytes signature;
    }

    struct Bid {
        Voucher voucher;
        address bidder;
        uint256 amount;
        uint256 value;
        bytes signature;
    }

    constructor() EIP712(_SIGNING_DOMAIN, _SIGNATURE_VERSION) {
        _DOMAIN_SEPARATOR = _hashDomain(
            EIP712Domain({
                name: _SIGNING_DOMAIN,
                version: _SIGNATURE_VERSION,
                chainId: 4,
                verifyingContract: address(this)
            })
        );
    }

    function _hashDomain(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _EIP712DOMAIN_TYPEHASH,
                    keccak256(bytes(eip712Domain.name)),
                    keccak256(bytes(eip712Domain.version)),
                    eip712Domain.chainId,
                    eip712Domain.verifyingContract
                )
            );
    }

    function _hashVoucher(Voucher calldata voucher) internal pure returns (bytes32) {
        return
            keccak256(abi.encode(_VOUCHER_TYPEHASH, voucher.tokenId, voucher.creator, voucher.supply, voucher.price));
    }

    function _hashBid(Bid calldata bid) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _BID_TYPEHASH,
                    keccak256(
                        abi.encode(bid.voucher.tokenId, bid.voucher.creator, bid.voucher.supply, bid.voucher.price)
                    ),
                    bid.bidder,
                    bid.amount,
                    bid.value
                )
            );
    }

    function verifyVoucher(Voucher calldata voucher) external view returns (address) {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, _hashVoucher(voucher)));
        return digest.recover(voucher.signature);
    }

    function verifyBid(Bid calldata bid) external view returns (address) {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR, _hashBid(bid)));
        return digest.recover(bid.signature);
    }
}

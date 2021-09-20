//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./Signature.sol";

contract Place is ERC1155 {
    Signature private _signature;
    mapping(uint256 => address) private _creatorById;

    event Bought(address creator, address buyer, uint256 id, uint256 amount);

    constructor(string memory uri, address signatureAddress) ERC1155(uri) {
        _signature = Signature(signatureAddress);
    }

    function mintAndTransfer(
        address buyer,
        uint256 amount,
        Signature.Voucher calldata voucher
    ) external {
        address signer = _signature.verifyVoucher(voucher);
        require(signer == voucher.creator, "Place : creator did not sign this transaction");
        _creatorById[voucher.tokenId] = voucher.creator;
        _mint(buyer, voucher.tokenId, amount, "");
        emit Bought(voucher.creator, buyer, voucher.tokenId, amount);
    }

    function creatorById(uint256 tokenId) public view returns (address) {
        return _creatorById[tokenId];
    }

    function signature() public view returns (Signature) {
        return _signature;
    }
}

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./Signature.sol";

contract Place is ERC1155 {
    mapping(uint256 => address) private _creatorById;

    event Bought(address creator, address buyer, uint256 id, uint256 amount);

    constructor(string memory uri) ERC1155(uri) {}

    function mintAndTransfer(
        uint256 tokenId,
        address creator,
        address buyer,
        uint256 amount
    ) external {
        _creatorById[tokenId] = creator;
        _mint(buyer, tokenId, amount, "");
        emit Bought(creator, buyer, tokenId, amount);
    }

    function creatorById(uint256 tokenId) public view returns (address) {
        return _creatorById[tokenId];
    }
}

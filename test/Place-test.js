/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

describe('Place', async function () {
  let Place, place;
  let deployer, owner, developer, creator, buyer, alice, bob;

  const URI = 'ipfs://{id}';

  beforeEach(async function () {
    [deployer, owner, developer, creator, buyer, alice, bob] = await ethers.getSigners();
    Place = await ethers.getContractFactory('Place');
    place = await Place.connect(deployer).deploy(URI);
    await place.deployed();
  });

  describe('constructor', async function () {
    it(`sets uri to ERC1155`, async function () {
      expect(await place.uri(0)).to.equal(URI);
    });
  });
  describe('mintAndTransfer', async function () {
    const TOKENID1 = BigNumber.from('1');
    const TOKENID2 = BigNumber.from('2');
    const AMOUNT = BigNumber.from('5');

    it(`sets creatorById`, async function () {
      await place.mintAndTransfer(TOKENID1, creator.address, buyer.address, AMOUNT);
      expect(await place.creatorById(TOKENID1)).to.equals(creator.address);
      await place.mintAndTransfer(TOKENID2, alice.address, bob.address, AMOUNT);
      expect(await place.creatorById(TOKENID2)).to.equals(alice.address);
    });
    it(`mints token to buyer`, async function () {
      await place.mintAndTransfer(TOKENID1, creator.address, buyer.address, AMOUNT);
      expect(await place.balanceOf(buyer.address, TOKENID1)).to.equals(AMOUNT);
      await place.mintAndTransfer(TOKENID2, alice.address, bob.address, AMOUNT);
      expect(await place.balanceOf(bob.address, TOKENID2)).to.equals(AMOUNT);
    });
    it(`emits Bought event`, async function () {
      await expect(place.mintAndTransfer(TOKENID1, creator.address, buyer.address, AMOUNT))
        .to.emit(place, 'Bought')
        .withArgs(creator.address, buyer.address, TOKENID1, AMOUNT);
      await expect(place.mintAndTransfer(TOKENID2, alice.address, bob.address, AMOUNT))
        .to.emit(place, 'Bought')
        .withArgs(alice.address, bob.address, TOKENID2, AMOUNT);
    });
  });
});

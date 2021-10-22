/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const { createTypeDataBid, signTypedData } = require('../library/Signature');

describe('Signature', async function () {
  let Signature, signature;
  let deployer, owner, developer, creator, bidder;
  let creatorAddress, bidderAddress, bid, signatureBid, signedBid;

  const TOKENID = BigNumber.from('0');
  const SUPPLY = BigNumber.from('10');
  const PRICE = BigNumber.from('2');

  const AMOUNT = BigNumber.from('5');
  const VALUE = ethers.utils.parseEther('15');

  beforeEach(async function () {
    [deployer, owner, developer, creator, bidder] = await ethers.getSigners();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy(97);
    await signature.deployed();

    // CREATION OF BID
    creatorAddress = creator.address;
    bidderAddress = bidder.address;
    bid = {
      tokenId: TOKENID,
      creator: creatorAddress,
      supply: SUPPLY,
      price: PRICE,
      bidder: bidderAddress,
      amount: AMOUNT,
      value: VALUE,
    };
    dataBid = await createTypeDataBid(signature.address, bid);
    signatureBid = await signTypedData(web3, bidder, dataBid);
    signedBid = { ...bid, signature: signatureBid };
  });

  describe('constructor', async function () {});

  describe('verifyBid', async function () {
    it(`returns bid signer address`, async function () {
      expect(await signature.verifyBid(signedBid)).to.equals(bidder.address);
    });
  });
});

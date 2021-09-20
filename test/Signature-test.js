/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');
const { createTypeDataVoucher, createTypeDataBid, signTypedData } = require('../library/Signature');

describe('Signature', async function () {
  let Signature, signature;
  let deployer, owner, developer, voucherSigner, bidSigner;
  let voucherSignerAddress, voucher, signatureVoucher, signedVoucher;
  let bidSignerAddress, bid, signatureBid, signedBid;

  const TOKENID = BigNumber.from('0');
  const SUPPLY = BigNumber.from('10');
  const PRICE = BigNumber.from('2');

  const AMOUNT = BigNumber.from('5');
  const VALUE = ethers.utils.parseEther('15');

  beforeEach(async function () {
    [deployer, owner, developer, voucherSigner, bidSigner] = await ethers.getSigners();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy();
    await signature.deployed();

    // CREATION OF VOUCHER
    voucherSignerAddress = voucherSigner.address;
    voucher = { tokenId: TOKENID, creator: voucherSignerAddress, supply: SUPPLY, price: PRICE };
    dataVoucher = await createTypeDataVoucher(signature.address, voucher);
    signatureVoucher = await signTypedData(web3, voucherSigner, dataVoucher);
    signedVoucher = { ...voucher, signature: signatureVoucher };

    // CREATION OF BID
    bidSignerAddress = bidSigner.address;
    bid = { voucher: signedVoucher, bidder: bidSignerAddress, amount: AMOUNT, value: VALUE };
    dataBid = await createTypeDataBid(signature.address, bid);
    signatureBid = await signTypedData(web3, bidSigner, dataBid);
    signedBid = { ...bid, signature: signatureBid };
  });

  describe('constructor', async function () {});
  describe('verifyVoucher', async function () {
    it(`returns voucher signer address`, async function () {
      expect(await signature.verifyVoucher(signedVoucher)).to.equals(voucherSigner.address);
    });
  });
  describe('verifyBid', async function () {
    it(`returns bid signer address`, async function () {
      expect(await signature.verifyBid(signedBid)).to.equals(bidSigner.address);
    });
  });
});

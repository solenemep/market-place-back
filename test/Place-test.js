/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { getDomain, typesVoucher } = require('../library/Signature');

describe('Place', async function () {
  let Place, place, Signature, signature;
  let deployer, owner, developer, alice, bob;
  let voucherSigner1, voucherSigner2, voucherSigner3;

  const URI = 'ipfs://{id}';

  beforeEach(async function () {
    [deployer, owner, developer, alice, bob, voucherSigner1, voucherSigner2, voucherSigner3] =
      await ethers.getSigners();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy();
    await signature.deployed();
    Place = await ethers.getContractFactory('Place');
    place = await Place.connect(deployer).deploy(URI, signature.address);
    await place.deployed();
  });

  describe('constructor', async function () {
    it(`sets uri to ERC1155`, async function () {
      expect(await place.uri(0)).to.equal(URI);
    });
    it(`sets signature address`, async function () {
      expect(await place.signature()).to.equal(signature.address);
    });
  });
  describe('mintAndTransfer', async function () {
    let voucherSigner1Address,
      voucherSigner2Address,
      voucherSigner3Address,
      voucher1,
      voucher2,
      voucher3,
      signatureVoucher1,
      signatureVoucher2,
      signatureVoucher3,
      signedVoucher1,
      signedVoucher2,
      signedVoucher3;

    const TOKENID1 = BigNumber.from('1');
    const TOKENID2 = BigNumber.from('2');
    const TOKENID3 = BigNumber.from('3');
    const SUPPLY = BigNumber.from('10');
    const PRICE = BigNumber.from('2');

    const AMOUNT = BigNumber.from('5');

    beforeEach(async function () {
      // CREATION OF VOUCHER1 => VALID
      voucherSigner1Address = voucherSigner1.address;
      voucher1 = { tokenId: TOKENID1, creator: voucherSigner1Address, supply: SUPPLY, price: PRICE };
      signatureVoucher1 =
        '0xb4fe6775fa62f45d863c180d1f9a2f50cbd1f9aee712e7adee5dfa4373283d6529d541293e068476024844dcd8de35f7182804736ee362e6af504738887ed51f1b';
      signedVoucher1 = { ...voucher1, signature: signatureVoucher1 };

      // CREATION OF VOUCHER2 => VALID
      voucherSigner2Address = voucherSigner2.address;
      voucher2 = { tokenId: TOKENID2, creator: voucherSigner2Address, supply: SUPPLY, price: PRICE };
      signatureVoucher2 =
        '0xc762de193cb14285808e75a85876de8d703a1e307075a8dc7668a4b095834fa942b3c29720813bec23f64f3f8a21ddcc60c470d47c8c98cf2ecce8ed972f42dc1b';
      signedVoucher2 = { ...voucher2, signature: signatureVoucher2 };

      // CREATION OF VOUCHER3 => INVALID (signer is not creator)
      voucherSigner3Address = voucherSigner3.address;
      voucher3 = { tokenId: TOKENID3, creator: voucherSigner3Address, supply: SUPPLY, price: PRICE };
      signatureVoucher3 =
        '0xc307e743dfe2b0033c9760e476c7347a43a7ad5d7cb97991b1a6e60d314dd3397e4b85cdeb41dce96489c9ce393fdd9674dcd3279f5cfcb1caccb08494f551061c';
      signedVoucher3 = { ...voucher3, signature: signatureVoucher3 };
    });
    it(`verifies signature voucher`, async function () {
      // SEE ./Signature-test.js
    });
    it(`reverts if signer is not creator`, async function () {
      await expect(place.mintAndTransfer(alice.address, AMOUNT, signedVoucher3)).to.be.revertedWith(
        'Place : creator did not sign this transaction'
      );
    });
    it(`sets creatorById`, async function () {
      await place.mintAndTransfer(alice.address, AMOUNT, signedVoucher1);
      expect(await place.creatorById(TOKENID1)).to.equals(voucherSigner1.address);
      await place.mintAndTransfer(bob.address, AMOUNT, signedVoucher2);
      expect(await place.creatorById(TOKENID2)).to.equals(voucherSigner2.address);
    });
    it(`mints token to buyer`, async function () {
      await place.mintAndTransfer(alice.address, AMOUNT, signedVoucher1);
      expect(await place.balanceOf(alice.address, TOKENID1)).to.equals(AMOUNT);
      await place.mintAndTransfer(bob.address, AMOUNT, signedVoucher2);
      expect(await place.balanceOf(bob.address, TOKENID2)).to.equals(AMOUNT);
    });
    it(`emits Bought event`, async function () {
      await expect(place.mintAndTransfer(alice.address, AMOUNT, signedVoucher1))
        .to.emit(place, 'Bought')
        .withArgs(voucherSigner1.address, alice.address, TOKENID1, AMOUNT);
      await expect(place.mintAndTransfer(bob.address, AMOUNT, signedVoucher2))
        .to.emit(place, 'Bought')
        .withArgs(voucherSigner2.address, bob.address, TOKENID2, AMOUNT);
    });
  });
});

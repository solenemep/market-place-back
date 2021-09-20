/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');
const { getDomain, typesVoucher, typesBid } = require('../library/Signature');

describe('Auction', async function () {
  let Auction, auction, Place, place, Signature, signature;
  let deployer, owner, developer, alice, bob;
  let voucherSigner, bidSigner;

  const URI = 'ipfs://{id}';
  const NAME = 'WrappedEther';
  const SYMBOL = 'WETH';

  const VALUE = 50;
  const GAS_PRICE = 1000000000;

  beforeEach(async function () {
    [deployer, owner, developer, alice, bob, voucherSigner, bidSigner] = await ethers.getSigners();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy();
    await signature.deployed();
    Place = await ethers.getContractFactory('Place');
    place = await Place.connect(deployer).deploy(URI, signature.address);
    await place.deployed();
    Auction = await ethers.getContractFactory('Auction');
    auction = await Auction.connect(developer).deploy(place.address, signature.address, owner.address);
    await auction.deployed();
  });

  describe('constructor', async function () {
    it(`sets signature address`, async function () {
      expect(await auction.signature()).to.equal(signature.address);
    });
    it(`sets place address`, async function () {
      expect(await auction.place()).to.equal(place.address);
    });
    it(`sets ownership`, async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });
    it(`sets ERC20 name and symbol`, async function () {
      expect(await auction.name()).to.equal(NAME);
      expect(await auction.symbol()).to.equal(SYMBOL);
    });
  });
  describe('receive', async function () {
    it('transfers directly', async function () {
      expect(
        await alice.sendTransaction({ to: auction.address, value: VALUE, gasPrice: GAS_PRICE })
      ).to.changeEtherBalance(auction, VALUE);
    });
  });
  describe('deposit', async function () {
    it('changes ETH balances', async function () {
      const tx = await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      expect(tx).to.changeEtherBalance(alice, -VALUE);
      expect(tx).to.changeEtherBalance(auction, VALUE);
    });
    it('changes WETH balances', async function () {
      await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      expect(await auction.balanceOf(alice.address)).to.equal(VALUE);
    });
    it('emits Deposited event', async function () {
      await expect(auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE }))
        .to.emit(auction, 'Deposited')
        .withArgs(alice.address, VALUE);
    });
  });
  describe('withdraw', async function () {
    it('reverts if balance < amount', async function () {
      await expect(auction.connect(alice).withdraw(VALUE)).to.be.revertedWith(
        'Auction : you can not withdraw more than you have'
      );
    });
    it('changes ETH balances', async function () {
      await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      const tx = await auction.connect(alice).withdraw(VALUE);
      expect(tx).to.changeEtherBalance(alice, VALUE);
      expect(tx).to.changeEtherBalance(auction, -VALUE);
    });
    it('changes WETH balances', async function () {
      await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await auction.connect(alice).withdraw(VALUE);
      expect(await auction.balanceOf(alice.address)).to.equal(0);
    });
    it('emits Withdrawed event', async function () {
      await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await expect(auction.connect(alice).withdraw(VALUE))
        .to.emit(auction, 'Withdrawed')
        .withArgs(alice.address, VALUE);
    });
  });
  describe('bid functions', async function () {
    let voucherSignerAddress,
      voucher,
      signatureVoucher,
      signedVoucher,
      bidSignerAddress,
      bid1,
      bid2,
      bid3,
      bid4,
      signatureBid1,
      signatureBid2,
      signatureBid3,
      signatureBid4,
      signedBid1,
      signedBid2,
      signedBid3,
      signedBid4;

    const TOKENID = BigNumber.from('0');
    const SUPPLY = BigNumber.from('10');
    const PRICE = 10;
    const AMOUNT_OK = BigNumber.from('5');
    const AMOUNT_KO = BigNumber.from('15');
    const VALUE_OK = 20;
    const VALUE_OK_MINUS_5PERC = 19;
    const VALUE_KO = 5;

    beforeEach(async function () {
      // CREATION OF VOUCHER
      voucherSignerAddress = voucherSigner.address;
      voucher = { tokenId: TOKENID, creator: voucherSignerAddress, supply: SUPPLY, price: PRICE };
      signatureVoucher =
        '0x55aed0833d1add1a40e8982a4c6de674a6cceb37002e0a8e463feb40f82e30f7437c0418c3eba16edab65692557b3ca9449b06e7916bd9efae72acc646ee186e1c';
      signedVoucher = { ...voucher, signature: signatureVoucher };

      // CREATION OF BID1 => VALID
      bidSignerAddress = bidSigner.address;
      bid1 = { voucher: signedVoucher, bidder: bidSignerAddress, amount: AMOUNT_OK, value: VALUE_OK };
      signatureBid1 =
        '0x55aed0833d1add1a40e8982a4c6de674a6cceb37002e0a8e463feb40f82e30f7437c0418c3eba16edab65692557b3ca9449b06e7916bd9efae72acc646ee186e1c';
      signedBid1 = { ...bid1, signature: signatureBid1 };

      // CREATION OF BID2 => INVALID (amount KO)
      bid2 = { voucher: signedVoucher, bidder: bidSignerAddress, amount: AMOUNT_KO, value: VALUE_OK };
      signatureBid2 =
        '0x55aed0833d1add1a40e8982a4c6de674a6cceb37002e0a8e463feb40f82e30f7437c0418c3eba16edab65692557b3ca9449b06e7916bd9efae72acc646ee186e1c';
      signedBid2 = { ...bid2, signature: signatureBid2 };

      // CREATION OF BID3 => INVALID (value KO)
      bid3 = { voucher: signedVoucher, bidder: bidSignerAddress, amount: AMOUNT_OK, value: VALUE_KO };
      signatureBid3 =
        '0x55aed0833d1add1a40e8982a4c6de674a6cceb37002e0a8e463feb40f82e30f7437c0418c3eba16edab65692557b3ca9449b06e7916bd9efae72acc646ee186e1c';
      signedBid3 = { ...bid3, signature: signatureBid3 };

      // CREATION OF BID4 => INVALID (signer is not bidder)
      bid4 = { voucher: signedVoucher, bidder: bidSignerAddress, amount: AMOUNT_OK, value: VALUE_KO };
      signatureBid4 =
        '0x55aed0833d1add1a40e8982a4c6de674a6cceb37002e0a8e463feb40f82e30f7437c0418c3eba16edab65692557b3ca9449b06e7916bd9efae72acc646ee186e1c';
      signedBid4 = { ...bid4, signature: signatureBid4 };

      // PREPARE WETH
      await auction.connect(bidSigner).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await auction.connect(bidSigner).approve(voucherSigner.address, VALUE_OK);
    });

    describe('acceptBid', async function () {
      it(`verifies signature bid`, async function () {
        // SEE ./Signature-test.js
      });
      it(`reverts if signer is not bidder`, async function () {
        await expect(auction.connect(voucherSigner).acceptBid(signedBid1)).to.be.revertedWith(
          'Auction : bidder did not sign this transaction'
        );
      });
      it(`reverts if bid value is lower than voucher price`, async function () {
        await expect(auction.connect(voucherSigner).acceptBid(signedBid3)).to.be.revertedWith(
          'Auction : payment must be higher than minimum price'
        );
      });
      it(`reverts if bid amount is lower than voucher supply`, async function () {
        await expect(auction.connect(voucherSigner).acceptBid(signedBid2)).to.be.revertedWith(
          'Auction : can not buy more than stock'
        );
      });
      it(`mints token to buyer`, async function () {
        // SEE ./Place-test.js
      });
      describe(`changes WETH balances`, async function () {
        it(`charges bid amount to buyer`, async function () {
          const initialBalance = await auction.balanceOf(bidSigner.address);
          await auction.connect(voucherSigner).acceptBid(signedBid1);
          expect(await auction.balanceOf(bidSigner.address)).to.equals(initialBalance - VALUE_OK);
        });
        it(`redirects bid amount to seller`, async function () {
          const initialBalance = await auction.balanceOf(voucherSigner.address);
          await auction.connect(voucherSigner).acceptBid(signedBid1);
          expect(await auction.balanceOf(voucherSigner.address)).to.equals(initialBalance + VALUE_OK_MINUS_5PERC);
        });
        it(`charges gas fee for transaction to seller`, async function () {
          const tx = await auction.connect(voucherSigner).acceptBid(signedBid1, { gasPrice: GAS_PRICE });
          expect(tx).to.changeEtherBalance(voucherSigner, 0, { includeFee: true });
        });
        it(`charges 5% fees from seller to owner`, async function () {
          const initialBalance = await auction.balanceOf(owner.address);
          await auction.connect(voucherSigner).acceptBid(signedBid1);
          expect(await auction.balanceOf(owner.address)).to.equals(initialBalance + VALUE_OK - VALUE_OK_MINUS_5PERC);
        });
      });
      it(`emits BidAccepted event`, async function () {
        await expect(auction.connect(voucherSigner).acceptBid(signedBid1))
          .to.emit(auction, 'BidAccepted')
          .withArgs(voucherSigner.address, signedBid1.voucher.tokenId.toString());
      });
    });

    describe('declineBid', async function () {
      it(`verifies signature bid`, async function () {
        // SEE ./Signature-test.js
      });
      it(`reverts if signer is not bidder`, async function () {
        await expect(auction.connect(voucherSigner).declineBid(signedBid4)).to.be.revertedWith(
          'Auction : bidder did not sign this transaction'
        );
      });
      it(`emits BidDeclined event`, async function () {
        await expect(auction.connect(voucherSigner).declineBid(signedBid1))
          .to.emit(auction, 'BidDeclined')
          .withArgs(voucherSigner.address, signedBid1.voucher.tokenId.toString());
      });
    });
  });
});

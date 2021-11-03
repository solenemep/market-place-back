/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

describe('Auction', async function () {
  let Auction, auction, WToken, wToken, Place, place, Signature, signature;
  let deployer, owner, developer, creator, bidder, alice, bob;

  const URI = 'ipfs://{id}';

  const VALUE = 50;
  const GAS_PRICE = 1000000000;

  beforeEach(async function () {
    [deployer, owner, developer, creator, bidder, alice, bob] = await ethers.getSigners();
    WToken = await ethers.getContractFactory('WToken');
    wToken = await WToken.connect(developer).deploy();
    await wToken.deployed();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy(97);
    await signature.deployed();
    Place = await ethers.getContractFactory('Place');
    place = await Place.connect(deployer).deploy(URI);
    await place.deployed();
    Auction = await ethers.getContractFactory('Auction');
    auction = await Auction.connect(developer).deploy(wToken.address, place.address, signature.address, owner.address);
    await auction.deployed();
  });

  describe('constructor', async function () {
    it(`sets wToken address`, async function () {
      expect(await auction.wToken()).to.equal(wToken.address);
    });
    it(`sets place address`, async function () {
      expect(await auction.place()).to.equal(place.address);
    });
    it(`sets signature address`, async function () {
      expect(await auction.signature()).to.equal(signature.address);
    });
    it(`sets ownership`, async function () {
      expect(await auction.owner()).to.equal(owner.address);
    });
  });
  describe('bid functions', async function () {
    let creatorAddress, bidderAddress, aliceAddress, bid1, bid2, bid3, bid4;

    const TOKENID = BigNumber.from('0');
    const SUPPLY = BigNumber.from('10');
    const PRICE = 1;
    const AMOUNT_OK = BigNumber.from('5');
    const AMOUNT_KO = BigNumber.from('15');
    const VALUE_OK = 20;
    const VALUE_OK_MINUS_5PERC = 19;
    const VALUE_KO = 4;

    const v = 27;
    const r = 0x33a9c2884c5d046ef602ad3a9e11a8bb2be3901617cda541bfe6b761dc84203e;
    const s = 0x64600619dcdc57ce82abcd69c91f0069e68215f512f0c7be6b6a56daf44a62a4;

    beforeEach(async function () {
      creatorAddress = creator.address;
      bidderAddress = bidder.address;
      aliceAddress = alice.address;

      // CREATION OF BID1 => VALID
      bid1 = {
        tokenId: TOKENID,
        creator: creatorAddress,
        supply: SUPPLY,
        price: PRICE,
        bidder: bidderAddress,
        amount: AMOUNT_OK,
        value: VALUE_OK,
      };

      // CREATION OF BID2 => INVALID (amount KO)
      bid2 = {
        tokenId: TOKENID,
        creator: creatorAddress,
        supply: SUPPLY,
        price: PRICE,
        bidder: bidderAddress,
        amount: AMOUNT_KO,
        value: VALUE_OK,
      };

      // CREATION OF BID3 => INVALID (value KO)
      bid3 = {
        tokenId: TOKENID,
        creator: creatorAddress,
        supply: SUPPLY,
        price: PRICE,
        bidder: bidderAddress,
        amount: AMOUNT_OK,
        value: VALUE_KO,
      };

      // CREATION OF BID4 => INVALID (signer is not bidder)
      bid4 = {
        tokenId: TOKENID,
        creator: creatorAddress,
        supply: SUPPLY,
        price: PRICE,
        bidder: aliceAddress,
        amount: AMOUNT_OK,
        value: VALUE_OK,
      };

      // PREPARE WETH
      await wToken.connect(bidder).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await wToken.connect(bidder).approve(auction.address, VALUE_OK);
    });

    describe('acceptBid', async function () {
      it(`reverts if not creator`, async function () {
        await expect(auction.connect(alice).acceptBid(bid1, v, r, s)).to.be.revertedWith('Auction : not creator');
      });
      it(`verifies signature bid`, async function () {
        // SEE ./Signature-test.js
      });
      it(`reverts if signer is not bidder`, async function () {
        await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
        await wToken.connect(alice).approve(auction.address, VALUE_OK);
        await expect(auction.connect(creator).acceptBid(bid4, v, r, s)).to.be.revertedWith(
          'Auction : bidder did not sign this transaction'
        );
      });
      it(`reverts if bid value is lower than voucher price * amount`, async function () {
        await expect(auction.connect(creator).acceptBid(bid3, v, r, s)).to.be.revertedWith(
          'Auction : payment must be higher than minimum price'
        );
      });
      it(`reverts if bid amount is lower than voucher supply`, async function () {
        await expect(auction.connect(creator).acceptBid(bid2, v, r, s)).to.be.revertedWith(
          'Auction : can not buy more than stock'
        );
      });
      it(`mints token to buyer`, async function () {
        // SEE ./Place-test.js
      });
      describe(`changes WETH balances`, async function () {
        it(`charges bid amount to buyer`, async function () {
          const initialBalance = await wToken.balanceOf(bidder.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await wToken.balanceOf(bidder.address)).to.equals(initialBalance - VALUE_OK);
        });
        it(`redirects bid amount to seller`, async function () {
          const initialBalance = await wToken.balanceOf(creator.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await wToken.balanceOf(creator.address)).to.equals(initialBalance + VALUE_OK_MINUS_5PERC);
        });
        it(`charges gas fee for transaction to seller`, async function () {
          const tx = await auction.connect(creator).acceptBid(bid1, v, r, s, { gasPrice: GAS_PRICE });
          expect(tx).to.changeEtherBalance(creator, 0, { includeFee: true });
        });
        it(`charges 5% fees from seller to owner`, async function () {
          const initialBalance = await wToken.balanceOf(owner.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await wToken.balanceOf(owner.address)).to.equals(initialBalance + VALUE_OK - VALUE_OK_MINUS_5PERC);
        });
      });
      it(`emits BidAccepted event`, async function () {
        await expect(auction.connect(creator).acceptBid(bid1, v, r, s))
          .to.emit(auction, 'BidAccepted')
          .withArgs(creator.address, bid1.tokenId.toString());
      });
    });

    describe('declineBid', async function () {
      it(`reverts if not creator`, async function () {
        await expect(auction.connect(alice).declineBid(bid1, v, r, s)).to.be.revertedWith('Auction : not creator');
      });
      it(`verifies signature bid`, async function () {
        // SEE ./Signature-test.js
      });
      it(`reverts if signer is not bidder`, async function () {
        await expect(auction.connect(creator).declineBid(bid4, v, r, s)).to.be.revertedWith(
          'Auction : bidder did not sign this transaction'
        );
      });
      it(`emits BidDeclined event`, async function () {
        await expect(auction.connect(creator).declineBid(bid1, v, r, s))
          .to.emit(auction, 'BidDeclined')
          .withArgs(creator.address, bid1.tokenId.toString());
      });
    });
  });
});

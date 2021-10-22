/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

describe('Auction', async function () {
  let Auction, auction, Place, place, Signature, signature;
  let deployer, owner, developer, creator, bidder, alice, bob;

  const URI = 'ipfs://{id}';
  const NAME = 'WrappedEther';
  const SYMBOL = 'WETH';

  const VALUE = 50;
  const GAS_PRICE = 1000000000;

  beforeEach(async function () {
    [deployer, owner, developer, creator, bidder, alice, bob] = await ethers.getSigners();
    Signature = await ethers.getContractFactory('Signature');
    signature = await Signature.connect(deployer).deploy(97);
    await signature.deployed();
    Place = await ethers.getContractFactory('Place');
    place = await Place.connect(deployer).deploy(URI);
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
    let creatorAddress, bidderAddress, aliceAddress, bid1, bid2, bid3, bid4;

    const TOKENID = BigNumber.from('0');
    const SUPPLY = BigNumber.from('10');
    const PRICE = 1;
    const AMOUNT_OK = BigNumber.from('5');
    const AMOUNT_KO = BigNumber.from('15');
    const VALUE_OK = 20;
    const VALUE_OK_MINUS_5PERC = 19;
    const VALUE_KO = 4;

    const v = 1;
    const r = 0x0000000000000000000000000000000000000000000000000000000061626364;
    const s = 0x0000000000000000000000000000000000000000000000000000000061626364;

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
      await auction.connect(bidder).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await auction.connect(bidder).approve(creator.address, VALUE_OK);
    });

    describe('acceptBid', async function () {
      it(`reverts if not creator`, async function () {
        await expect(auction.connect(alice).acceptBid(bid1, v, r, s)).to.be.revertedWith('Auction : not creator');
      });
      it(`verifies signature bid`, async function () {
        // SEE ./Signature-test.js
      });
      it(`reverts if signer is not bidder`, async function () {
        await auction.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
        await auction.connect(alice).approve(creator.address, VALUE_OK);
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
          const initialBalance = await auction.balanceOf(bidder.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await auction.balanceOf(bidder.address)).to.equals(initialBalance - VALUE_OK);
        });
        it(`redirects bid amount to seller`, async function () {
          const initialBalance = await auction.balanceOf(creator.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await auction.balanceOf(creator.address)).to.equals(initialBalance + VALUE_OK_MINUS_5PERC);
        });
        it(`charges gas fee for transaction to seller`, async function () {
          const tx = await auction.connect(creator).acceptBid(bid1, v, r, s, { gasPrice: GAS_PRICE });
          expect(tx).to.changeEtherBalance(creator, 0, { includeFee: true });
        });
        it(`charges 5% fees from seller to owner`, async function () {
          const initialBalance = await auction.balanceOf(owner.address);
          await auction.connect(creator).acceptBid(bid1, v, r, s);
          expect(await auction.balanceOf(owner.address)).to.equals(initialBalance + VALUE_OK - VALUE_OK_MINUS_5PERC);
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

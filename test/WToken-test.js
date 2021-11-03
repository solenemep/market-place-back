/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const { expect } = require('chai');
const { BigNumber } = require('ethers');
const { ethers } = require('hardhat');

describe('WToken', async function () {
  let WToken, wToken;
  let deployer, owner, developer, creator, bidder, alice, bob;

  const NAME = 'WrappedBNB';
  const SYMBOL = 'WBNB';

  const VALUE = 50;
  const GAS_PRICE = 1000000000;

  beforeEach(async function () {
    [deployer, owner, developer, creator, bidder, alice, bob] = await ethers.getSigners();
    WToken = await ethers.getContractFactory('WToken');
    wToken = await WToken.connect(developer).deploy();
    await wToken.deployed();
  });

  describe('constructor', async function () {
    it(`sets ERC20 name and symbol`, async function () {
      expect(await wToken.name()).to.equal(NAME);
      expect(await wToken.symbol()).to.equal(SYMBOL);
    });
  });
  describe('deposit', async function () {
    it('changes ETH balances', async function () {
      const tx = await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      expect(tx).to.changeEtherBalance(alice, -VALUE);
      expect(tx).to.changeEtherBalance(wToken, VALUE);
    });
    it('changes WETH balances', async function () {
      await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      expect(await wToken.balanceOf(alice.address)).to.equal(VALUE);
    });
    it('emits Deposited event', async function () {
      await expect(wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE }))
        .to.emit(wToken, 'Deposited')
        .withArgs(alice.address, VALUE);
    });
  });
  describe('withdraw', async function () {
    it('reverts if balance < amount', async function () {
      await expect(wToken.connect(alice).withdraw(VALUE)).to.be.revertedWith(
        'WToken : you can not withdraw more than you have'
      );
    });
    it('changes ETH balances', async function () {
      await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      const tx = await wToken.connect(alice).withdraw(VALUE);
      expect(tx).to.changeEtherBalance(alice, VALUE);
      expect(tx).to.changeEtherBalance(wToken, -VALUE);
    });
    it('changes WETH balances', async function () {
      await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await wToken.connect(alice).withdraw(VALUE);
      expect(await wToken.balanceOf(alice.address)).to.equal(0);
    });
    it('emits Withdrawed event', async function () {
      await wToken.connect(alice).deposit({ value: VALUE, gasPrice: GAS_PRICE });
      await expect(wToken.connect(alice).withdraw(VALUE)).to.emit(wToken, 'Withdrawed').withArgs(alice.address, VALUE);
    });
  });
});

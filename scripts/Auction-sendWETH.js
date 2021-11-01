/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
const hre = require('hardhat');
const { deployed } = require('./deployed');
const { getContract } = require('./getContract');

const AMOUNT = 1;

async function main() {
  const [deployer, owner, developer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const auctionAddress = await getContract('Auction', 'BSCtestnet');
  const pashaAddress = '0x8e51084195B6fDdbDC75aa518d9E370202E59ce1';

  const Auction = await hre.ethers.getContractFactory('Auction');
  const auction = await Auction.attach(auctionAddress);

  await auction.connect(deployer).approve(auctionAddress, 1);
  await auction.connect(deployer).deposit({ value: 1 });
  await auction.connect(deployer).transfer(pashaAddress, 1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

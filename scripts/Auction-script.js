/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
const hre = require('hardhat');
const { deployed } = require('./deployed');

async function main() {
  const [deployer, owner, developer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const signatureAddress = await getContract('Signature', 'rinkeby');
  const placeAddress = await getContract('Place', 'rinkeby');
  const OWNER = '';

  const Auction = await hre.ethers.getContractFactory('Auction');
  const auction = await Auction.deploy(placeAddress, signatureAddress, OWNER);

  await auction.deployed();

  await deployed('Auction', hre.network.name, auction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

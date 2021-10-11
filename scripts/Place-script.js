/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
const hre = require('hardhat');
const { deployed } = require('./deployed');

async function main() {
  const [deployer, owner, developer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const Place = await hre.ethers.getContractFactory('Place');
  const place = await Place.deploy('ipfs://{id}');

  await place.deployed();

  await deployed('Place', hre.network.name, place.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

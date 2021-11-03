/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
const hre = require('hardhat');
const { deployed } = require('./deployed');

async function main() {
  const [deployer, owner, developer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const WToken = await hre.ethers.getContractFactory('WToken');
  const wToken = await WToken.deploy();

  await wToken.deployed();

  await deployed('WToken', hre.network.name, wToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

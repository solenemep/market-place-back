/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
const hre = require('hardhat');
const { deployed } = require('./deployed');

async function main() {
  const [deployer, owner, developer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const Signature = await hre.ethers.getContractFactory('Signature');
  const signature = await Signature.deploy(97);

  await signature.deployed();

  await deployed('Signature', hre.network.name, signature.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

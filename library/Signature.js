/* eslint-disable comma-dangle */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { expect } = require('chai');
const { ethers } = require('hardhat');

const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const VOUCHER_TYPE = {
  Voucher: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'creator', type: 'address' },
    { name: 'supply', type: 'uint256' },
    { name: 'price', type: 'uint256' },
  ],
};

const BID_TYPE = {
  Voucher: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'creator', type: 'address' },
    { name: 'supply', type: 'uint256' },
    { name: 'price', type: 'uint256' },
  ],
  Bid: [
    { name: 'voucher', type: 'Voucher' },
    { name: 'bidder', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'value', type: 'uint256' },
  ],
};

const getDomainData = async (contractAddress) => {
  const SIGNING_DOMAIN_NAME = 'Sacred-Signature';
  const SIGNING_DOMAIN_VERSION = '1';

  return {
    name: SIGNING_DOMAIN_NAME,
    version: SIGNING_DOMAIN_VERSION,
    chainId: 4,
    verifyingContract: contractAddress,
  };
};

const createTypeDataVoucher = async (contractAddress, voucher) => {
  const domainData = await getDomainData(contractAddress);
  return {
    types: {
      EIP712Domain: DOMAIN_TYPE,
      Voucher: VOUCHER_TYPE,
    },
    domain: domainData,
    primaryType: 'Voucher',
    message: voucher,
  };
};

const createTypeDataBid = async (contractAddress, bid) => {
  const domainData = await getDomainData(contractAddress);
  return {
    types: {
      EIP712Domain: DOMAIN_TYPE,
      Bid: BID_TYPE,
    },
    domain: domainData,
    primaryType: 'Bid',
    message: bid,
  };
};

const signTypedData = async (web3, from, data) => {
  web3.currentProvider.sendAsync({
    jsonrpc: '2.0',
    method: 'eth_signTypedData_v3',
    params: [from, JSON.stringify(data)],
    id: new Date().getTime(),
  });
};

exports.createTypeDataVoucher = createTypeDataVoucher;
exports.createTypeDataBid = createTypeDataBid;
exports.signTypedData = signTypedData;

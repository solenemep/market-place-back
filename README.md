# Sacred Place Smart Contracts

Please note that all tests are not passing because of signature verification in contracts/Place.sol (mintAndTransfer function), and contracts/Auction.sol (acceptBid function).

I could not find a way to sign using MetaMask function (web3 is not recognized) in library/Signature.js :

```js
const signTypedData = async (web3, from, data) => {
  web3.currentProvider.sendAsync({
    jsonrpc: "2.0",
    method: "eth_signTypedData_v3",
    params: [from, JSON.stringify(data)],
    id: new Date().getTime(),
  });
};
```

If we mask requirement of verification of signature, all tests are passing.

const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    process.env.RPC
  )
);
const bip39 = require("bip39");
const ethers = require("ethers");
const ERC20_ABI = require("../abi/ERC20.json");
const { BigNumber } = require("bignumber.js");

const usdcContract = new web3.eth.Contract(ERC20_ABI, process.env.USDC_CONTRACT_ADDRESS);
const minterAddress = process.env.MINTER_PUBLIC_KEY;
const minterPrivateKey = process.env.MINTER_PRIVATE_KEY;
web3.eth.accounts.wallet.add(minterPrivateKey);

const MaxUint256 = new BigNumber("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

exports.checkHealth = async (req, res) => {
  res.json({ status: "ok" });
};

exports.getTreasuryWallet = async (req, res) => {
  try {
    res.json({
      walletAddress: minterAddress // hardcoded treasury address
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.mintUSDC = async (req, res) => {
  const { amount, walletAddress } = req.body;
  try {
    const estimateGas = await usdcContract.methods.mint(walletAddress, ethers.utils.parseUnits(amount, 6)).estimateGas({
      from: minterAddress
    });
    const tx = await usdcContract.methods.mint(walletAddress, ethers.utils.parseUnits(amount, 6)).send({
      from: minterAddress,
      gas: estimateGas
    });
    res.json({
      transactionTX: tx.transactionHash,
      transactionURL: `https://sepolia.etherscan.io/tx/${tx.transactionHash}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNewWallet = async (req, res) => {
  try {
    console.log("comin creatw new wallet");

    const mnemonic = await bip39.generateMnemonic();
    const dataWallet = await generateWalletFromSeedPhrase(mnemonic);
    // send 0.005 ETH for new wallet
    console.log("dataWallet.address", dataWallet.address);
    console.log("dataWallet.privateKey", dataWallet.privateKey);
    await sendNativeToken(dataWallet.address, "5000000000000000");
    console.log("sent 0.005 ETH to new wallet");
    
    web3.eth.accounts.wallet.add(dataWallet.privateKey);
    const estimateGas = await usdcContract.methods.approve(minterAddress, MaxUint256.toFixed(0)).estimateGas({
      from: dataWallet.address
    });
    const tx = await usdcContract.methods.approve(minterAddress, MaxUint256.toFixed(0)).send({
      from: dataWallet.address,
      gas: estimateGas
    });
    console.log("approved USDC contract for minter");
    res.json({
      walletAddress: dataWallet.address,
      transactionTX: tx.transactionHash,
      transactionURL: `https://sepolia.etherscan.io/tx/${tx.transactionHash}`
    });
    web3.eth.accounts.wallet.remove(dataWallet.privateKey);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: error.message });
  }
};


exports.collectUSDC = async (req, res) => {
  const { fromAddress } = req.body;
  try {
    const balanceFromAddress = await usdcContract.methods.balanceOf(fromAddress).call();
    if (balanceFromAddress > 0) {
    const estimateGas = await usdcContract.methods.transferFrom(fromAddress, minterAddress, balanceFromAddress).estimateGas({
      from: minterAddress
    });
    const tx = await usdcContract.methods.transferFrom(fromAddress, minterAddress, balanceFromAddress).send({
      from: minterAddress,
      gas: estimateGas
    });
    res.json({
      transactionTX: tx.transactionHash,
      transactionURL: `https://sepolia.etherscan.io/tx/${tx.transactionHash}`
      });
    } else {
      res.status(400).json({ error: "No USDC to collect" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.burnUSDC = async (req, res) => {
  const { } = req.body;
  try {
    const balanceFromAddress = await usdcContract.methods.balanceOf(minterAddress).call();
    console.log("balanceFromAddress", balanceFromAddress);
    if (balanceFromAddress > 0) {
      const estimateGas = await usdcContract.methods.burn(balanceFromAddress).estimateGas({
        from: minterAddress
      });
      const tx = await usdcContract.methods.burn(balanceFromAddress).send({
        from: minterAddress,
        gas: estimateGas
      });
      res.json({
        transactionTX: tx.transactionHash,
        transactionURL: `https://sepolia.etherscan.io/tx/${tx.transactionHash}`
      });
    } else {
      res.status(400).json({ error: "No USDC to burn" });
    }
  } catch (error) {
    console.log("error", error);
    
    res.status(500).json({ error: error.message });
  }
};

async function sendNativeToken(to, amount) {
  console.log("sendNativeToken", to, amount);
  const nonce = await web3.eth.getTransactionCount(minterAddress, "pending");
  console.log("nonce", nonce);
  const gasPrice = await web3.eth.getGasPrice();
  console.log("gasPrice", gasPrice);
  const data = {
    nonce: nonce,
    from: minterAddress,
    to: to,
    data: "0x",
    value: amount,
    gasLimit: 210000,
    gasPrice: gasPrice
  };
  console.log("data", data);
  await web3.eth.sendTransaction(data);
};

async function generateWalletFromSeedPhrase(seedPhrase) {
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
  const address = wallet.address;
  const privateKey = wallet.privateKey;
  return {
    seedPhrase,
    address,
    privateKey
  };
}
const { ethers } = require("ethers");
const IBlockchainService = require("../../core/repositories/i-blockchain-service");

class EthereumService extends IBlockchainService {
  constructor(providerUrl, chainId = 1) {
    super();
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    this.chainId = chainId;
  }

  async createWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
    };
  }

  async getBalance(walletAddress) {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération du solde: ${error.message}`
      );
    }
  }

  async sendTransaction(
    fromWalletAddress,
    toWalletAddress,
    amount,
    privateKey
  ) {
    try {
      const wallet = new ethers.Wallet(privateKey, this.provider);

      const tx = {
        to: toWalletAddress,
        value: ethers.parseEther(amount.toString()),
        gasLimit: 21000,
      };

      const transaction = await wallet.sendTransaction(tx);
      await transaction.wait();

      return {
        txHash: transaction.hash,
        blockNumber: transaction.blockNumber,
        gasUsed: transaction.gasUsed?.toString(),
      };
    } catch (error) {
      throw new Error(
        `Erreur lors de l'envoi de la transaction: ${error.message}`
      );
    }
  }

  async verifyTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      return {
        exists: !!tx,
        confirmed: !!receipt,
        status: receipt?.status === 1 ? "success" : "failed",
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      throw new Error(`Erreur lors de la vérification: ${error.message}`);
    }
  }
}


module.exports = EthereumService
import { Chain, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { setValidKeysetPrepareTransactionRequest } from '@arbitrum/orbit-sdk';
import { sanitizePrivateKey } from '@arbitrum/orbit-sdk/utils';

function getBlockExplorerUrl(chain: Chain) {
  return chain.blockExplorers?.default.url;
}

if (typeof process.env.DEPLOYER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "DEPLOYER_PRIVATE_KEY" environment variable`);
}

const keyset =
  '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

// set the parent chain and create a public client for it
const parentChain = sepolia;
const parentChainPublicClient = createPublicClient({ chain: parentChain, transport: http() });

// load the deployer account
const deployer = privateKeyToAccount(sanitizePrivateKey(process.env.DEPLOYER_PRIVATE_KEY));

async function main() {
  // prepare the transaction setting the keyset
  const txRequest = await setValidKeysetPrepareTransactionRequest({
    coreContracts: {
      //upgradeExecutor: '0x82c42d2cdcbe6b4482900e299b3532082e217132',
      upgradeExecutor: '0xA5e5E61B4ccA8f5B397D17a5e35a049d017F6d75',
      sequencerInbox: '0x4FeB7200e18E6C0Ff1C3be72a702DF1C9220CA19',
    },
    keyset,
    account: deployer.address,
    publicClient: parentChainPublicClient,
  });

  // sign and send the transaction
  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(txRequest),
  });

  // wait for the transaction receipt
  const txReceipt = await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(
    `Keyset updated in ${getBlockExplorerUrl(parentChain)}/tx/${txReceipt.transactionHash}`,
  );
}

main();

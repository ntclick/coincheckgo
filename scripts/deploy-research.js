// Simple deploy script using ethers v6 (no hardhat)
// Usage:
//   node scripts/deploy-research.js <SEPOLIA_RPC_URL> <GM_TOKEN_ADDRESS>
// env: PRIVATE_KEY must be set

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const [rpcUrl, gmToken] = process.argv.slice(2);
  if (!rpcUrl || !gmToken) {
    console.error('Usage: node scripts/deploy-research.js <SEPOLIA_RPC_URL> <GM_TOKEN_ADDRESS>');
    process.exit(1);
  }
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.error('PRIVATE_KEY env not set');
    process.exit(1);
  }

  // Minimal inline ABI & bytecode compiled via Remix/Hardhat recommended.
  // For convenience, you can paste ABI/bytecode artifacts into artifacts/research.json
  // and this script will use them.
  const artifactPath = path.join(__dirname, '../artifacts/research.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Missing artifacts/research.json (ABI+bytecode). Compile with Remix/Hardhat and export.');
    process.exit(1);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  console.log('Deployer:', wallet.address);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(gmToken);
  console.log('Deploy tx:', contract.deploymentTransaction().hash);
  await contract.waitForDeployment();
  console.log('ResearchAIConfidential deployed at:', await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



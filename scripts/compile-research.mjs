import solc from 'solc';
import fs from 'fs';
import path from 'path';

const contractPath = path.resolve(process.cwd(), 'contracts', 'ResearchAIConfidential.sol');
const outputPath = path.resolve(process.cwd(), 'artifacts', 'research.json');

const contractSource = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ResearchAIConfidential.sol': {
      content: contractSource,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: 'paris',
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling ResearchAIConfidential.sol...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  for (const error of output.errors) {
    if (error.type === 'Warning') {
      console.warn(error.formattedMessage);
    } else {
      console.error(error.formattedMessage);
    }
  }
  if (output.errors.some(error => error.type !== 'Warning')) {
    process.exit(1);
  }
}

const contractOutput = output.contracts['ResearchAIConfidential.sol']['ResearchAIConfidential'];

const artifact = {
  abi: contractOutput.abi,
  bytecode: `0x${contractOutput.evm.bytecode.object}`,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

console.log('✅ ResearchAIConfidential.sol compiled successfully!');
console.log(`Artifact saved to ${outputPath}`);

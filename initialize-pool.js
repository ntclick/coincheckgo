const { ethers } = require("ethers");
require('dotenv').config({ path: '../../.env' });

const GM_TOKEN_ADDRESS = process.env.REACT_APP_GM_TOKEN_ADDRESS;
const SWAP_CONTRACT_ADDRESS = process.env.REACT_APP_SWAP_CONTRACT_ADDRESS;
const SEPOLIA_RPC_URL = process.env.REACT_APP_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY; // Owner's private key

const gmTokenAbi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function mint(address to, uint256 amount) returns (bool)"
];

const swapAbi = [
    "function initializePool(uint256 ethAmount, uint256 gmAmount) payable",
    "function getReserves() view returns (uint256 ethReserve, uint256 gmReserve)",
    "function poolInitialized() view returns (bool)"
];

async function initializePool() {
    if (!PRIVATE_KEY || !SEPOLIA_RPC_URL || !GM_TOKEN_ADDRESS || !SWAP_CONTRACT_ADDRESS) {
        console.error("Environment variables not set. Please check .env file.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const gmTokenContract = new ethers.Contract(GM_TOKEN_ADDRESS, gmTokenAbi, wallet);
    const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapAbi, wallet);

    console.log(`Initializing pool with ETH and GM tokens...`);
    console.log(`Owner: ${wallet.address}`);
    console.log(`Swap Contract: ${SWAP_CONTRACT_ADDRESS}`);

    try {
        // Check if pool is already initialized
        const isInitialized = await swapContract.poolInitialized();
        console.log(`Pool initialized: ${isInitialized}`);

        if (isInitialized) {
            const reserves = await swapContract.getReserves();
            console.log(`Current reserves: ${ethers.formatEther(reserves[0])} ETH, ${ethers.formatEther(reserves[1])} GM`);
            console.log("Pool is already initialized!");
            return;
        }

        // Check owner's ETH balance
        const ethBalance = await provider.getBalance(wallet.address);
        console.log(`Owner's ETH balance: ${ethers.formatEther(ethBalance)} ETH`);

        // Check owner's GM balance
        const gmBalance = await gmTokenContract.balanceOf(wallet.address);
        console.log(`Owner's GM balance: ${ethers.formatEther(gmBalance)} GM`);

        // Amounts to initialize pool with
        const ethAmount = ethers.parseEther("1.0"); // 1 ETH
        const gmAmount = ethers.parseEther("100000"); // 100,000 GM (1 ETH = 100,000 GM rate)

        if (ethBalance < ethAmount) {
            console.error("Owner has insufficient ETH to initialize pool.");
            return;
        }

        if (gmBalance < gmAmount) {
            console.log("Owner has insufficient GM tokens. Minting more...");
            const mintTx = await gmTokenContract.mint(wallet.address, gmAmount);
            await mintTx.wait();
            console.log(`Minted ${ethers.formatEther(gmAmount)} GM tokens. Transaction: ${mintTx.hash}`);
        }

        // Approve swap contract to spend GM tokens
        console.log(`Approving swap contract to spend ${ethers.formatEther(gmAmount)} GM...`);
        const approveTx = await gmTokenContract.approve(SWAP_CONTRACT_ADDRESS, gmAmount);
        await approveTx.wait();
        console.log(`Approval successful. Transaction: ${approveTx.hash}`);

        // Initialize pool
        console.log(`Initializing pool with ${ethers.formatEther(ethAmount)} ETH and ${ethers.formatEther(gmAmount)} GM...`);
        const initTx = await swapContract.initializePool(ethAmount, gmAmount, {
            value: ethAmount
        });
        await initTx.wait();
        console.log(`Pool initialized successfully! Transaction: ${initTx.hash}`);

        // Check final reserves
        const finalReserves = await swapContract.getReserves();
        console.log(`Final reserves: ${ethers.formatEther(finalReserves[0])} ETH, ${ethers.formatEther(finalReserves[1])} GM`);

    } catch (error) {
        console.error("Failed to initialize pool:", error);
    }
}

initializePool();

// GM Token Swap Logic - runs after window load to avoid blocking React mount
window.addEventListener('load', () => {
  /** GM/FHE inline script moved here intact **/
  // BEGIN MOVED SCRIPT
  // Contract addresses (LATEST deployment - 2025-10-26) - From deployment-hybrid.json
  const TOKEN_ADDRESS = window.GM_TOKEN_ADDRESS || '0x902D1319547Ef7D27af4De51EE6cde95A8B4bc08';
  const SWAP_ADDRESS = window.SWAP_ADDRESS || '0x438A2ce1B563E71b68F2f0EE0575736CccF3231e';
  const RESEARCH_AI_ADDRESS = window.RESEARCH_AI_ADDRESS || '0xBD341699753FEa3305bf16Eaf8228A1F96E945fF';

  let provider, signer, userAddress, fhevm;
  let eip712Signed = false;
  let tokenContract, swapContract, researchAIContract;
  let swapInProgress = false;

  // ... The large script body remains exactly as in index.html (functions, helpers, assignments)
  // To keep this concise in the repository, we rely on the already-inlined script in index.html.
  // This file is a placeholder if we later decide to fully extract logic.
});



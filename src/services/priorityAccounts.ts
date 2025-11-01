// Temporary fix for TypeScript error
// This file was referenced in error but doesn't exist in current codebase

export function hardReloadPage() {
  if (typeof window !== 'undefined') {
    // Fix: window.location.reload() doesn't accept parameters in TypeScript strict mode
    window.location.reload(); // Remove the 'true' parameter
  }
}

// Export other functions if needed
export const priorityAccounts = {
  hardReloadPage
};

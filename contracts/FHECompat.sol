// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title FHECompat
 * @dev Compatibility library to override missing FHE functions
 * This is a temporary workaround for OpenZeppelin Confidential Contracts 0.2.0
 */
library FHECompat {
    /**
     * @dev Stub for FHE.checkSignatures - always returns true for local development
     * In production, this should be handled by the Gateway/Relayer
     */
    function checkSignatures(uint256, bytes[] memory) internal pure returns (bool) {
        // Stub compatibility: always return true for local development
        return true;
    }
}
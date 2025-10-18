// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Gas Optimization Library for La Tanda Smart Contracts
 * @dev Collection of gas-optimized patterns and utilities
 */

library GasOptimizer {
    
    /**
     * @dev Optimized batch transfer function
     * Reduces gas costs by batching multiple transfers in a single transaction
     */
    function batchTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 200, "Too many recipients"); // Gas limit protection
        
        // Use assembly for gas optimization
        assembly {
            let length := recipients.length
            let recipientsPtr := recipients.offset
            let amountsPtr := amounts.offset
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let recipient := calldataload(add(recipientsPtr, mul(i, 0x20)))
                let amount := calldataload(add(amountsPtr, mul(i, 0x20)))
                
                // Prepare transfer call data
                let ptr := mload(0x40)
                mstore(ptr, 0xa9059cbb00000000000000000000000000000000000000000000000000000000) // transfer(address,uint256)
                mstore(add(ptr, 0x04), recipient)
                mstore(add(ptr, 0x24), amount)
                
                let success := call(gas(), token, 0, ptr, 0x44, 0, 0)
                if iszero(success) { revert(0, 0) }
            }
        }
    }
    
    /**
     * @dev Optimized array sum calculation
     */
    function sumArray(uint256[] calldata array) external pure returns (uint256 sum) {
        assembly {
            let length := array.length
            let dataPtr := array.offset
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                sum := add(sum, calldataload(add(dataPtr, mul(i, 0x20))))
            }
        }
    }
    
    /**
     * @dev Gas-efficient event emission for batch operations
     */
    event BatchOperation(bytes32 indexed batchId, uint256 count, uint256 totalAmount);
    
    function emitBatchEvent(
        bytes32 batchId,
        uint256 count,
        uint256 totalAmount
    ) external {
        emit BatchOperation(batchId, count, totalAmount);
    }
}

/**
 * @title Optimized Storage Patterns
 * @dev Demonstrates efficient storage usage patterns
 */
contract OptimizedStorage {
    
    // Pack multiple values into single storage slot
    struct PackedData {
        uint128 amount;      // 128 bits
        uint64 timestamp;    // 64 bits  
        uint32 category;     // 32 bits
        uint32 status;       // 32 bits
        // Total: 256 bits = 1 storage slot
    }
    
    mapping(address => PackedData) public userData;
    
    // Use constants for gas efficiency
    uint256 constant PARTICIPATION_REWARD = 50e18;
    uint256 constant ACTIVITY_REWARD = 25e18;
    uint256 constant APP_USAGE_REWARD = 2e18;
    
    // Event optimization with indexed parameters
    event OptimizedEvent(
        address indexed user,
        uint256 indexed amount,
        bytes32 indexed category,
        uint256 data
    );
    
    /**
     * @dev Gas-optimized data update
     */
    function updateUserData(
        address user,
        uint128 amount,
        uint32 category,
        uint32 status
    ) external {
        PackedData storage data = userData[user];
        data.amount = amount;
        data.timestamp = uint64(block.timestamp);
        data.category = category;
        data.status = status;
        
        emit OptimizedEvent(user, amount, bytes32(uint256(category)), uint256(status));
    }
    
    /**
     * @dev Efficient batch processing with early returns
     */
    function processBatchOptimized(
        address[] calldata users,
        uint256[] calldata amounts
    ) external {
        uint256 length = users.length;
        require(length == amounts.length && length <= 100, "Invalid input");
        
        // Cache frequently accessed storage
        uint256 totalProcessed;
        
        for (uint256 i; i < length;) {
            address user = users[i];
            uint256 amount = amounts[i];
            
            // Skip zero amounts to save gas
            if (amount == 0) {
                unchecked { ++i; }
                continue;
            }
            
            // Update storage efficiently
            userData[user].amount = uint128(amount);
            userData[user].timestamp = uint64(block.timestamp);
            
            totalProcessed += amount;
            
            unchecked { ++i; }
        }
        
        // Single event for entire batch
        emit OptimizedEvent(address(0), totalProcessed, "BATCH", length);
    }
}
/**
 * 🔗 LA TANDA SMART CONTRACTS INTEGRATION
 * Frontend integration layer for interacting with deployed smart contracts
 */

// Import Web3 libraries (assumes they're loaded globally or via import)
// import { ethers } from 'ethers';

class SmartContractsIntegration {
    constructor(config = {}) {
        this.config = config;
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.isConnected = false;
        
        // Default configuration for Honduras Chain
        this.defaultConfig = {
            chainId: '0x1F6', // 502 in hex
            chainName: 'Honduras Chain',
            nativeCurrency: {
                name: 'HNL',
                symbol: 'HNL',
                decimals: 18
            },
            rpcUrls: ['https://rpc.honduras-chain.org'],
            blockExplorerUrls: ['https://explorer.honduras-chain.org'],
            contracts: {
                LTDToken: {
                    address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', // Latest deployment address
                    abi: [] // Will be loaded from artifacts
                },
                LaTandaDAO: {
                    address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
                    abi: []
                },
                GroupManager: {
                    address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
                    abi: []
                }
            }
        };
        
        this.mergedConfig = { ...this.defaultConfig, ...config };
        this.eventHandlers = {};
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔗 Initializing Smart Contracts Integration...');
        
        try {
            // Initialize provider
            await this.initializeProvider();
            
            // Load contract ABIs and addresses
            await this.loadContractConfigurations();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Smart Contracts Integration initialized');
            this.emit('integration:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Smart Contracts Integration:', error);
            this.emit('integration:error', error);
        }
    }
    
    async initializeProvider() {
        if (typeof window !== 'undefined' && window.ethereum) {
            // Browser environment with MetaMask
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log('📱 Using MetaMask provider');
        } else if (this.mergedConfig.rpcUrls && this.mergedConfig.rpcUrls[0]) {
            // Fallback to RPC provider
            this.provider = new ethers.providers.JsonRpcProvider(this.mergedConfig.rpcUrls[0]);
            console.log('🌐 Using RPC provider');
        } else {
            throw new Error('No provider available');
        }
        
        // Check network
        const network = await this.provider.getNetwork();
        console.log(`🔗 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        if (network.chainId !== parseInt(this.mergedConfig.chainId, 16)) {
            console.warn(`⚠️ Wrong network. Expected: ${this.mergedConfig.chainId}, Got: ${network.chainId}`);
            this.emit('network:mismatch', { expected: this.mergedConfig.chainId, actual: network.chainId });
        }
    }
    
    async loadContractConfigurations() {
        // Try to load from deployment file or use default config
        try {
            // In a real implementation, this would load from the deployment file
            const deploymentConfig = await this.loadDeploymentConfig();
            if (deploymentConfig) {
                this.mergedConfig.contracts = deploymentConfig.contracts;
                console.log('📋 Loaded contract configurations from deployment');
            }
        } catch (error) {
            console.log('📋 Using default contract configurations');
        }
        
        // Initialize contract instances
        await this.initializeContracts();
    }
    
    async loadDeploymentConfig() {
        // Try to load from the extracted ABIs file
        try {
            if (typeof window !== 'undefined') {
                // Browser environment - load via fetch
                const response = await fetch('./contract-abis.js');
                if (response.ok) {
                    // This would need proper module loading in a real implementation
                    console.log('📋 ABI file found, but dynamic loading needs proper module system');
                }
            }
            return null; // For now, use embedded config
        } catch (error) {
            console.log('📋 Using embedded deployment configuration');
            return null;
        }
    }
    
    async initializeContracts() {
        const contractNames = ['LTDToken', 'LaTandaDAO', 'GroupManager'];
        
        for (const contractName of contractNames) {
            const contractConfig = this.mergedConfig.contracts[contractName];
            if (contractConfig && contractConfig.address && contractConfig.abi) {
                try {
                    this.contracts[contractName] = new ethers.Contract(
                        contractConfig.address,
                        contractConfig.abi,
                        this.provider
                    );
                    console.log(`✅ ${contractName} contract initialized`);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${contractName}:`, error);
                }
            } else {
                console.warn(`⚠️ ${contractName} configuration incomplete`);
            }
        }
    }
    
    async connectWallet() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }
            
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Get signer
            this.signer = this.provider.getSigner();
            const address = await this.signer.getAddress();
            
            // Update contracts to use signer
            for (const contractName in this.contracts) {
                this.contracts[contractName] = this.contracts[contractName].connect(this.signer);
            }
            
            this.isConnected = true;
            console.log(`🔗 Wallet connected: ${address}`);
            this.emit('wallet:connected', { address });
            
            return address;
            
        } catch (error) {
            console.error('❌ Failed to connect wallet:', error);
            this.emit('wallet:error', error);
            throw error;
        }
    }
    
    async switchToHondurasChain() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }
            
            try {
                // Try to switch to Honduras Chain
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: this.mergedConfig.chainId }],
                });
            } catch (switchError) {
                // If chain is not added, add it
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: this.mergedConfig.chainId,
                            chainName: this.mergedConfig.chainName,
                            nativeCurrency: this.mergedConfig.nativeCurrency,
                            rpcUrls: this.mergedConfig.rpcUrls,
                            blockExplorerUrls: this.mergedConfig.blockExplorerUrls
                        }],
                    });
                } else {
                    throw switchError;
                }
            }
            
            console.log('🇭🇳 Switched to Honduras Chain');
            this.emit('network:switched', { chainId: this.mergedConfig.chainId });
            
        } catch (error) {
            console.error('❌ Failed to switch to Honduras Chain:', error);
            this.emit('network:error', error);
            throw error;
        }
    }
    
    // LTD Token Methods
    async getLTDBalance(address) {
        try {
            if (!this.contracts.LTDToken) {
                throw new Error('LTD Token contract not available');
            }
            
            const balance = await this.contracts.LTDToken.balanceOf(address);
            return ethers.utils.formatEther(balance);
            
        } catch (error) {
            console.error('Error getting LTD balance:', error);
            throw error;
        }
    }
    
    async transferLTD(to, amount) {
        try {
            if (!this.contracts.LTDToken || !this.isConnected) {
                throw new Error('LTD Token contract not available or wallet not connected');
            }
            
            const amountWei = ethers.utils.parseEther(amount.toString());
            const tx = await this.contracts.LTDToken.transfer(to, amountWei);
            
            console.log(`💸 LTD transfer initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'transfer' });
            
            const receipt = await tx.wait();
            console.log(`✅ LTD transfer confirmed: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'transfer' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error transferring LTD:', error);
            this.emit('transaction:error', { error, type: 'transfer' });
            throw error;
        }
    }
    
    async stakeLTDForGovernance(amount) {
        try {
            if (!this.contracts.LTDToken || !this.isConnected) {
                throw new Error('LTD Token contract not available or wallet not connected');
            }
            
            const amountWei = ethers.utils.parseEther(amount.toString());
            const tx = await this.contracts.LTDToken.stakeForGovernance(amountWei);
            
            console.log(`🏛️ LTD staking initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'stake' });
            
            const receipt = await tx.wait();
            console.log(`✅ LTD staking confirmed: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'stake' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error staking LTD:', error);
            this.emit('transaction:error', { error, type: 'stake' });
            throw error;
        }
    }
    
    async unstakeLTD(amount) {
        try {
            if (!this.contracts.LTDToken || !this.isConnected) {
                throw new Error('LTD Token contract not available or wallet not connected');
            }
            
            const amountWei = ethers.utils.parseEther(amount.toString());
            const tx = await this.contracts.LTDToken.unstake(amountWei);
            
            console.log(`🔓 LTD unstaking initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'unstake' });
            
            const receipt = await tx.wait();
            console.log(`✅ LTD unstaking confirmed: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'unstake' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error unstaking LTD:', error);
            this.emit('transaction:error', { error, type: 'unstake' });
            throw error;
        }
    }
    
    async getUserRewardSummary(address) {
        try {
            if (!this.contracts.LTDToken) {
                throw new Error('LTD Token contract not available');
            }
            
            const summary = await this.contracts.LTDToken.getUserRewardSummary(address);
            return {
                totalEarned: ethers.utils.formatEther(summary.totalEarned),
                currentBalance: ethers.utils.formatEther(summary.currentBalance),
                staked: ethers.utils.formatEther(summary.staked),
                governanceEligible: summary.governanceEligible,
                lastCheckIn: new Date(summary.lastCheckInTime.toNumber() * 1000)
            };
            
        } catch (error) {
            console.error('Error getting user reward summary:', error);
            throw error;
        }
    }
    
    // DAO Methods
    async createProposal(title, description, targets = [], values = [], calldatas = []) {
        try {
            if (!this.contracts.LaTandaDAO || !this.isConnected) {
                throw new Error('DAO contract not available or wallet not connected');
            }
            
            const tx = await this.contracts.LaTandaDAO.createProposal(
                title,
                description,
                ethers.constants.HashZero, // IPFS hash placeholder
                targets,
                values,
                calldatas
            );
            
            console.log(`🏛️ Proposal creation initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'proposal' });
            
            const receipt = await tx.wait();
            console.log(`✅ Proposal created: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'proposal' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error creating proposal:', error);
            this.emit('transaction:error', { error, type: 'proposal' });
            throw error;
        }
    }
    
    async voteOnProposal(proposalId, support, reason = '') {
        try {
            if (!this.contracts.LaTandaDAO || !this.isConnected) {
                throw new Error('DAO contract not available or wallet not connected');
            }
            
            const tx = await this.contracts.LaTandaDAO.castVote(proposalId, support, reason);
            
            console.log(`🗳️ Vote casting initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'vote' });
            
            const receipt = await tx.wait();
            console.log(`✅ Vote cast: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'vote' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error voting on proposal:', error);
            this.emit('transaction:error', { error, type: 'vote' });
            throw error;
        }
    }
    
    async getProposal(proposalId) {
        try {
            if (!this.contracts.LaTandaDAO) {
                throw new Error('DAO contract not available');
            }
            
            const proposal = await this.contracts.LaTandaDAO.getProposal(proposalId);
            return {
                proposer: proposal.proposer,
                title: proposal.title,
                description: proposal.description,
                startTime: new Date(proposal.startTime.toNumber() * 1000),
                endTime: new Date(proposal.endTime.toNumber() * 1000),
                forVotes: ethers.utils.formatEther(proposal.forVotes),
                againstVotes: ethers.utils.formatEther(proposal.againstVotes),
                abstainVotes: ethers.utils.formatEther(proposal.abstainVotes),
                state: proposal.state
            };
            
        } catch (error) {
            console.error('Error getting proposal:', error);
            throw error;
        }
    }
    
    // Group Manager Methods
    async createGroup(name, contributionAmount, maxMembers, frequency, isPrivate, description) {
        try {
            if (!this.contracts.GroupManager || !this.isConnected) {
                throw new Error('Group Manager contract not available or wallet not connected');
            }
            
            const contributionWei = ethers.utils.parseEther(contributionAmount.toString());
            const frequencySeconds = frequency * 24 * 60 * 60; // Convert days to seconds
            
            const tx = await this.contracts.GroupManager.createGroup(
                name,
                contributionWei,
                maxMembers,
                frequencySeconds,
                isPrivate,
                description
            );
            
            console.log(`👥 Group creation initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'createGroup' });
            
            const receipt = await tx.wait();
            console.log(`✅ Group created: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'createGroup' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.emit('transaction:error', { error, type: 'createGroup' });
            throw error;
        }
    }
    
    async joinGroup(groupId) {
        try {
            if (!this.contracts.GroupManager || !this.isConnected) {
                throw new Error('Group Manager contract not available or wallet not connected');
            }
            
            const tx = await this.contracts.GroupManager.joinGroup(groupId);
            
            console.log(`👥 Group joining initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'joinGroup' });
            
            const receipt = await tx.wait();
            console.log(`✅ Joined group: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'joinGroup' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error joining group:', error);
            this.emit('transaction:error', { error, type: 'joinGroup' });
            throw error;
        }
    }
    
    async makeContribution(groupId) {
        try {
            if (!this.contracts.GroupManager || !this.isConnected) {
                throw new Error('Group Manager contract not available or wallet not connected');
            }
            
            const tx = await this.contracts.GroupManager.makeContribution(groupId);
            
            console.log(`💰 Contribution initiated: ${tx.hash}`);
            this.emit('transaction:submitted', { hash: tx.hash, type: 'contribution' });
            
            const receipt = await tx.wait();
            console.log(`✅ Contribution made: ${receipt.transactionHash}`);
            this.emit('transaction:confirmed', { receipt, type: 'contribution' });
            
            return receipt;
            
        } catch (error) {
            console.error('Error making contribution:', error);
            this.emit('transaction:error', { error, type: 'contribution' });
            throw error;
        }
    }
    
    async getGroupDetails(groupId) {
        try {
            if (!this.contracts.GroupManager) {
                throw new Error('Group Manager contract not available');
            }
            
            const details = await this.contracts.GroupManager.getGroupDetails(groupId);
            return {
                name: details.name,
                coordinator: details.coordinator,
                contributionAmount: ethers.utils.formatEther(details.contributionAmount),
                maxMembers: details.maxMembers.toNumber(),
                currentMembers: details.currentMembers.toNumber(),
                currentRound: details.currentRound.toNumber(),
                state: details.state
            };
            
        } catch (error) {
            console.error('Error getting group details:', error);
            throw error;
        }
    }
    
    async getUserGroups(address) {
        try {
            if (!this.contracts.GroupManager) {
                throw new Error('Group Manager contract not available');
            }
            
            const groupIds = await this.contracts.GroupManager.getUserGroups(address);
            return groupIds.map(id => id.toNumber());
            
        } catch (error) {
            console.error('Error getting user groups:', error);
            throw error;
        }
    }
    
    // Event system
    setupEventListeners() {
        // Listen for contract events
        if (this.contracts.LTDToken) {
            this.contracts.LTDToken.on('Transfer', (from, to, amount) => {
                this.emit('ltd:transfer', { from, to, amount: ethers.utils.formatEther(amount) });
            });
            
            this.contracts.LTDToken.on('RewardDistributed', (user, amount, rewardType) => {
                this.emit('ltd:reward', { user, amount: ethers.utils.formatEther(amount), rewardType });
            });
        }
        
        if (this.contracts.LaTandaDAO) {
            this.contracts.LaTandaDAO.on('ProposalCreated', (proposalId, proposer, title) => {
                this.emit('dao:proposal_created', { proposalId: proposalId.toNumber(), proposer, title });
            });
            
            this.contracts.LaTandaDAO.on('VoteCast', (proposalId, voter, support, votes) => {
                this.emit('dao:vote_cast', { 
                    proposalId: proposalId.toNumber(), 
                    voter, 
                    support, 
                    votes: ethers.utils.formatEther(votes) 
                });
            });
        }
        
        if (this.contracts.GroupManager) {
            this.contracts.GroupManager.on('GroupCreated', (groupId, coordinator, name) => {
                this.emit('group:created', { groupId: groupId.toNumber(), coordinator, name });
            });
            
            this.contracts.GroupManager.on('MemberJoined', (groupId, member) => {
                this.emit('group:member_joined', { groupId: groupId.toNumber(), member });
            });
            
            this.contracts.GroupManager.on('ContributionMade', (groupId, member, amount) => {
                this.emit('group:contribution', { 
                    groupId: groupId.toNumber(), 
                    member, 
                    amount: ethers.utils.formatEther(amount) 
                });
            });
        }
    }
    
    // Event handling
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }
    
    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
        
        // Also dispatch as DOM event for global listening
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(`latanda:${event}`, { detail: data }));
        }
    }
    
    // Utility methods
    async getContractAddresses() {
        return Object.fromEntries(
            Object.entries(this.mergedConfig.contracts).map(([name, config]) => [
                name, 
                config.address
            ])
        );
    }
    
    async getNetworkInfo() {
        if (!this.provider) return null;
        
        const network = await this.provider.getNetwork();
        return {
            name: network.name,
            chainId: network.chainId,
            expectedChainId: parseInt(this.mergedConfig.chainId, 16),
            isCorrectNetwork: network.chainId === parseInt(this.mergedConfig.chainId, 16)
        };
    }
    
    async getGasPrice() {
        if (!this.provider) return null;
        
        const gasPrice = await this.provider.getGasPrice();
        return ethers.utils.formatUnits(gasPrice, 'gwei');
    }
    
    formatEther(value) {
        return ethers.utils.formatEther(value);
    }
    
    parseEther(value) {
        return ethers.utils.parseEther(value.toString());
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartContractsIntegration;
} else if (typeof window !== 'undefined') {
    window.SmartContractsIntegration = SmartContractsIntegration;
}

console.log('🔗 Smart Contracts Integration loaded!');
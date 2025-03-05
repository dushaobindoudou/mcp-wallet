/**
 * MCP Integration Example
 * 
 * This example demonstrates how to integrate the MCP Wallet with MCP-enabled AI assistants.
 * It shows how to set up an MCP server that exposes wallet functionality to AI models.
 */

import { createMcpServer, createWallet, WalletConfig } from '../src';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting MCP Wallet MCP Integration Example');

  // Get wallet configuration from environment variables
  const walletConfig: WalletConfig = {
    rpcUrl: process.env.MCP_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    chainId: process.env.MCP_CHAIN_ID ? parseInt(process.env.MCP_CHAIN_ID) : 1
  };

  // Add authentication method (only one should be set)
  if (process.env.MCP_PRIVATE_KEY) {
    walletConfig.privateKey = process.env.MCP_PRIVATE_KEY;
  } else if (process.env.MCP_MNEMONIC) {
    walletConfig.mnemonic = process.env.MCP_MNEMONIC;
  } else if (process.env.MCP_ADDRESS) {
    walletConfig.address = process.env.MCP_ADDRESS;
  } else {
    // For demo purposes, use a read-only address if no authentication is provided
    walletConfig.address = '0x0000000000000000000000000000000000000000';
    console.log('No authentication method provided. Using read-only mode with zero address.');
  }

  // Add optional configurations
  if (process.env.MCP_MPC_ENABLED === 'true') {
    walletConfig.enableMpc = true;
  }

  // Create a wallet instance
  const wallet = createWallet(walletConfig);
  console.log(`Wallet initialized with address: ${wallet.getAddress()}`);

  // Create an MCP server with the wallet
  const mcpServer = createMcpServer(walletConfig, {
    port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3000,
    allowedOperations: ['read', 'prepare', 'info'], // Only allow read-only operations by default
    requireConfirmation: true
  });

  // Start the MCP server
  await mcpServer.start();
  console.log('MCP server started. Press Ctrl+C to stop.');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await mcpServer.stop();
    process.exit(0);
  });
}

// Run the example
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 
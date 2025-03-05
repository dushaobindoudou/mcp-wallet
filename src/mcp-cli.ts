#!/usr/bin/env node
import { config } from 'dotenv';
import { WalletConfig } from './interfaces/wallet';
import { createMcpServer } from './mcp/server';
import * as path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
const result = config({
  path: envPath,
  debug: true
});

if (result.error) {
  console.warn('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
}

// Server startup
async function runServer() {
  try {
    console.error('Initializing MCP Wallet Server...');

    // Get wallet configuration from environment variables
    const walletConfig: WalletConfig = {
      rpcUrl: process.env.MCP_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
      chainId: process.env.MCP_CHAIN_ID ? parseInt(process.env.MCP_CHAIN_ID) : 1
    };

    // Add authentication method if available
    if (process.env.MCP_PRIVATE_KEY) {
      walletConfig.privateKey = process.env.MCP_PRIVATE_KEY;
    } else if (process.env.MCP_MNEMONIC) {
      walletConfig.mnemonic = process.env.MCP_MNEMONIC;
    } else if (process.env.MCP_ADDRESS) {
      walletConfig.address = process.env.MCP_ADDRESS;
    } else {
      // For demo purposes, use a read-only address if no authentication is provided
      walletConfig.address = '0x0000000000000000000000000000000000000000';
      console.error('No authentication method provided. Using read-only mode with zero address.');
    }

    // Create server with configuration
    const server = createMcpServer(walletConfig, {
      port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3000,
      allowedOperations: ['read', 'prepare', 'info'], // Default to read-only operations
      requireConfirmation: true
    });

    await server.start();

    // Now that we're connected, we can send logging messages
    server.mcpServer.sendLoggingMessage({
      level: 'info',
      data: `MCP Wallet Server initialized successfully on network ${walletConfig.chainId} with wallet address ${walletConfig.address}`
    });

    console.error('MCP Wallet Server running on stdio');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error running server:', error);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});

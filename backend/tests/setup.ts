// Jest setup file
// This file runs before all tests

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test file before running tests
config({ path: resolve(__dirname, '../.env.test') });

// Override NODE_ENV to ensure test environment
process.env.NODE_ENV = 'test';

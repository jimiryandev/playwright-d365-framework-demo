import * as dotenv from 'dotenv';

dotenv.config();

interface TestConfig {
  mdaUrl: string;
  username: string;
  password: string;
}

export const testConfig: TestConfig = {
  mdaUrl: process.env.MDA_URL || '',
  username: process.env.O365_USERNAME || '',
  password: process.env.O365_PASSWORD || ''
};

export function validateConfig(): void {
  const missing: string[] = [];

  if (!testConfig.mdaUrl) missing.push('MDA_URL');
  if (!testConfig.username) missing.push('O365_USERNAME');
  if (!testConfig.password) missing.push('O365_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
}

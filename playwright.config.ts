import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const OIDC_URL =
  process.env.ID_LOGIN_URL ||
  'https://id.alohi.com/realms/alohi/protocol/openid-connect/auth?client_id=app-selector&redirect_uri=' +
    encodeURIComponent('https://id.alohi.com/realms/alohi/app-selector') +
    '&response_type=code&code_challenge_method=S256';

const GREP = process.env.GREP ? new RegExp(process.env.GREP) : undefined;

export default defineConfig({
  testDir: './tests',

  fullyParallel: false, 
  workers: 1,           
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  grep: GREP,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: OIDC_URL,                 
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 30_000,         
    actionTimeout: 15_000,
    acceptDownloads: true,
    ignoreHTTPSErrors: process.env.IGNORE_HTTPS_ERRORS === 'true',
  },

  projects: [
    {
      name: 'Identity',
      use: {
        ...devices['Desktop Chrome'],
       storageState: undefined,
      },
    },
    
  ],
});

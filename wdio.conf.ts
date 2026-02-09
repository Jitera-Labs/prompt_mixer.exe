import { spawn, spawnSync } from 'child_process';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths
const tauriDriverBin = path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver');
const appBinary = path.resolve(__dirname, 'src-tauri', 'target', 'debug', 'prompt-mixer');

let tauriDriver: ReturnType<typeof spawn>;

export const config: WebdriverIO.Config = {
  runner: 'local',
  hostname: '127.0.0.1',
  port: 4444,
  specs: ['./e2e/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      browserName: 'wry',
      'tauri:options': {
        application: appBinary,
      },
    } as any,
  ],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  // Build the Tauri app before tests
  onPrepare() {
    console.log('Building Tauri app (debug, no bundle)...');
    const result = spawnSync('npx', ['tauri', 'build', '--debug', '--no-bundle'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
      timeout: 300000, // 5 min timeout for build
    });
    if (result.status !== 0) {
      throw new Error(`Tauri build failed with exit code ${result.status}`);
    }
    console.log('Tauri build complete.');
  },

  // Start tauri-driver before each test session
  beforeSession() {
    tauriDriver = spawn(tauriDriverBin, ['--port', '4444'], {
      stdio: [null, process.stdout, process.stderr],
    });

    // Give tauri-driver time to start
    return new Promise<void>((resolve) => setTimeout(resolve, 2000));
  },

  // Stop tauri-driver after each test session
  afterSession() {
    if (tauriDriver) {
      tauriDriver.kill();
    }
  },
};

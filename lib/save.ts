import * as core from '@actions/core';
import { stopRegistryProxy } from './utils';

async function run(): Promise<void> {
  try {
    const proxyPid = core.getState('proxyPid');

    if (proxyPid) {
      await stopRegistryProxy(parseInt(proxyPid, 10));
      core.info('Cache proxy stopped');
      return;
    }

    core.notice('No proxy to stop (proxyPid not found in state)');
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Post step failed: ${error.message}`);
    }
  }
}

run();

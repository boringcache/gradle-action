import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ensureBoringCache,
  getWorkspace,
  getCacheTagPrefix,
  startRegistryProxy,
  waitForProxy,
  stopRegistryProxy,
  findAvailablePort,
} from '@boringcache/action-core';

export {
  ensureBoringCache,
  getWorkspace,
  getCacheTagPrefix,
  startRegistryProxy,
  waitForProxy,
  stopRegistryProxy,
  findAvailablePort,
};

export function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).trim().toLowerCase() === 'true';
}

/**
 * Resolve the Gradle user home directory.
 * Expands ~ to the actual home directory.
 */
export function resolveGradleHome(input: string): string {
  const gradleHome = input || '~/.gradle';
  if (gradleHome.startsWith('~')) {
    return path.join(os.homedir(), gradleHome.slice(1));
  }
  return path.resolve(gradleHome);
}

/**
 * Write Gradle init script that configures the HTTP build cache.
 * Placed in $GRADLE_HOME/init.d/ so it applies to all builds.
 */
export function writeGradleInitScript(gradleHome: string, port: number, readOnly: boolean): void {
  const initDir = path.join(gradleHome, 'init.d');
  fs.mkdirSync(initDir, { recursive: true });

  const initScript = `gradle.settingsEvaluated {
    buildCache {
        remote(HttpBuildCache) {
            url = "http://127.0.0.1:${port}/cache/"
            push = ${!readOnly}
            allowInsecureProtocol = true
        }
    }
}
`;

  const scriptPath = path.join(initDir, 'boringcache-cache.gradle');
  fs.writeFileSync(scriptPath, initScript);
  core.info(`Wrote Gradle init script to ${scriptPath}`);
}

/**
 * Enable the Gradle build cache by setting org.gradle.caching=true
 * in $GRADLE_HOME/gradle.properties.
 */
export function enableGradleBuildCache(gradleHome: string): void {
  fs.mkdirSync(gradleHome, { recursive: true });

  const propsPath = path.join(gradleHome, 'gradle.properties');
  const line = '\norg.gradle.caching=true\n';

  fs.appendFileSync(propsPath, line);
  core.info(`Enabled build cache in ${propsPath}`);
}

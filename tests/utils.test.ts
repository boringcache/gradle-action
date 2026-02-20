import { parseBoolean, resolveGradleHome, getWorkspace, getCacheTagPrefix } from '../lib/utils';
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock fs while preserving promises (needed by @actions/io)
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    appendFileSync: jest.fn(),
  };
});

describe('Gradle Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.BORINGCACHE_DEFAULT_WORKSPACE;
    delete process.env.GITHUB_REPOSITORY;
  });

  describe('parseBoolean', () => {
    it('should parse boolean strings correctly', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('True')).toBe(true);
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('')).toBe(false);
      expect(parseBoolean(undefined)).toBe(false);
    });

    it('should use default value when empty or undefined', () => {
      expect(parseBoolean(undefined, true)).toBe(true);
      expect(parseBoolean('', true)).toBe(true);
    });
  });

  describe('getWorkspace', () => {
    it('should return input workspace when provided', () => {
      expect(getWorkspace('my-org/my-project')).toBe('my-org/my-project');
    });

    it('should use BORINGCACHE_DEFAULT_WORKSPACE as fallback', () => {
      process.env.BORINGCACHE_DEFAULT_WORKSPACE = 'default-org/default-project';
      expect(getWorkspace('')).toBe('default-org/default-project');
    });

    it('should add default/ prefix when no slash present', () => {
      expect(getWorkspace('my-project')).toBe('default/my-project');
    });

    it('should fail when no workspace available', () => {
      expect(() => getWorkspace('')).toThrow('Workspace required');
      expect(core.setFailed).toHaveBeenCalled();
    });
  });

  describe('getCacheTagPrefix', () => {
    it('should return input cache tag when provided', () => {
      expect(getCacheTagPrefix('my-cache', 'gradle')).toBe('my-cache');
    });

    it('should use repository name as default', () => {
      process.env.GITHUB_REPOSITORY = 'owner/my-repo';
      expect(getCacheTagPrefix('', 'gradle')).toBe('my-repo');
    });

    it('should return gradle as final fallback', () => {
      expect(getCacheTagPrefix('', 'gradle')).toBe('gradle');
    });
  });

  describe('resolveGradleHome', () => {
    it('should expand ~ to home directory', () => {
      expect(resolveGradleHome('~/.gradle')).toBe(path.join(os.homedir(), '.gradle'));
    });

    it('should default to ~/.gradle when empty', () => {
      expect(resolveGradleHome('')).toBe(path.join(os.homedir(), '.gradle'));
    });

    it('should resolve absolute paths as-is', () => {
      expect(resolveGradleHome('/opt/gradle')).toBe('/opt/gradle');
    });
  });

  describe('writeGradleInitScript', () => {
    let writeGradleInitScript: typeof import('../lib/utils').writeGradleInitScript;

    beforeAll(() => {
      writeGradleInitScript = require('../lib/utils').writeGradleInitScript;
    });

    it('should create init.d directory and write init script', () => {
      const gradleHome = '/home/runner/.gradle';

      writeGradleInitScript(gradleHome, 5000, false);

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.join(gradleHome, 'init.d'),
        { recursive: true }
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(gradleHome, 'init.d', 'boringcache-cache.gradle'),
        expect.stringContaining('http://127.0.0.1:5000/cache/')
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('push = true')
      );
    });

    it('should disable push in read-only mode', () => {
      writeGradleInitScript('/home/runner/.gradle', 5000, true);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('push = false')
      );
    });

    it('should use the correct port', () => {
      writeGradleInitScript('/home/runner/.gradle', 9090, false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('http://127.0.0.1:9090/cache/')
      );
    });

    it('should set allowInsecureProtocol', () => {
      writeGradleInitScript('/home/runner/.gradle', 5000, false);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('allowInsecureProtocol = true')
      );
    });
  });

  describe('enableGradleBuildCache', () => {
    let enableGradleBuildCache: typeof import('../lib/utils').enableGradleBuildCache;

    beforeAll(() => {
      enableGradleBuildCache = require('../lib/utils').enableGradleBuildCache;
    });

    it('should create gradle home and append to gradle.properties', () => {
      const gradleHome = '/home/runner/.gradle';

      enableGradleBuildCache(gradleHome);

      expect(fs.mkdirSync).toHaveBeenCalledWith(gradleHome, { recursive: true });
      expect(fs.appendFileSync).toHaveBeenCalledWith(
        path.join(gradleHome, 'gradle.properties'),
        expect.stringContaining('org.gradle.caching=true')
      );
    });
  });
});

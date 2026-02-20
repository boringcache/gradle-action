"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
async function run() {
    try {
        const cliVersion = core.getInput('cli-version') || '';
        const workspace = (0, utils_1.getWorkspace)(core.getInput('workspace') || '');
        const cacheTag = (0, utils_1.getCacheTagPrefix)(core.getInput('cache-tag') || '', 'gradle');
        const proxyPort = parseInt(core.getInput('proxy-port') || '0', 10) || await (0, utils_1.findAvailablePort)();
        const readOnly = (0, utils_1.parseBoolean)(core.getInput('read-only'), false);
        const gradleHome = (0, utils_1.resolveGradleHome)(core.getInput('gradle-home') || '');
        const enableBuildCache = (0, utils_1.parseBoolean)(core.getInput('enable-build-cache'), true);
        const proxyNoGit = (0, utils_1.parseBoolean)(core.getInput('proxy-no-git'), false);
        const proxyNoPlatform = (0, utils_1.parseBoolean)(core.getInput('proxy-no-platform'), false);
        const verbose = (0, utils_1.parseBoolean)(core.getInput('verbose'), false);
        core.saveState('workspace', workspace);
        core.saveState('cacheTag', cacheTag);
        core.saveState('verbose', verbose.toString());
        if (cliVersion.toLowerCase() !== 'skip') {
            await (0, utils_1.ensureBoringCache)({ version: cliVersion || 'v1.3.0' });
        }
        const proxy = await (0, utils_1.startRegistryProxy)({
            command: 'cache-registry',
            workspace,
            tag: cacheTag,
            host: '127.0.0.1',
            port: proxyPort,
            noGit: proxyNoGit,
            noPlatform: proxyNoPlatform,
            verbose,
        });
        await (0, utils_1.waitForProxy)(proxy.port, 20000, proxy.pid);
        core.saveState('proxyPid', String(proxy.pid));
        (0, utils_1.writeGradleInitScript)(gradleHome, proxy.port, readOnly);
        if (enableBuildCache) {
            (0, utils_1.enableGradleBuildCache)(gradleHome);
        }
        core.setOutput('cache-tag', cacheTag);
        core.setOutput('proxy-port', String(proxy.port));
        core.setOutput('workspace', workspace);
        core.info(`Gradle build cache configured at http://127.0.0.1:${proxy.port}/cache/`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
run();

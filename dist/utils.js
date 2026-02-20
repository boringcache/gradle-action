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
exports.findAvailablePort = exports.stopRegistryProxy = exports.waitForProxy = exports.startRegistryProxy = exports.getCacheTagPrefix = exports.getWorkspace = exports.ensureBoringCache = void 0;
exports.parseBoolean = parseBoolean;
exports.resolveGradleHome = resolveGradleHome;
exports.writeGradleInitScript = writeGradleInitScript;
exports.enableGradleBuildCache = enableGradleBuildCache;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const action_core_1 = require("@boringcache/action-core");
Object.defineProperty(exports, "ensureBoringCache", { enumerable: true, get: function () { return action_core_1.ensureBoringCache; } });
Object.defineProperty(exports, "getWorkspace", { enumerable: true, get: function () { return action_core_1.getWorkspace; } });
Object.defineProperty(exports, "getCacheTagPrefix", { enumerable: true, get: function () { return action_core_1.getCacheTagPrefix; } });
Object.defineProperty(exports, "startRegistryProxy", { enumerable: true, get: function () { return action_core_1.startRegistryProxy; } });
Object.defineProperty(exports, "waitForProxy", { enumerable: true, get: function () { return action_core_1.waitForProxy; } });
Object.defineProperty(exports, "stopRegistryProxy", { enumerable: true, get: function () { return action_core_1.stopRegistryProxy; } });
Object.defineProperty(exports, "findAvailablePort", { enumerable: true, get: function () { return action_core_1.findAvailablePort; } });
function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '')
        return defaultValue;
    return String(value).trim().toLowerCase() === 'true';
}
/**
 * Resolve the Gradle user home directory.
 * Expands ~ to the actual home directory.
 */
function resolveGradleHome(input) {
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
function writeGradleInitScript(gradleHome, port, readOnly) {
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
function enableGradleBuildCache(gradleHome) {
    fs.mkdirSync(gradleHome, { recursive: true });
    const propsPath = path.join(gradleHome, 'gradle.properties');
    const line = '\norg.gradle.caching=true\n';
    fs.appendFileSync(propsPath, line);
    core.info(`Enabled build cache in ${propsPath}`);
}

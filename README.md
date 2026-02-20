# boringcache/gradle-action

**Cache once. Reuse everywhere.**

Gradle build cache backed by BoringCache. This action starts a local HTTP build cache proxy that Gradle talks to natively. No bulk save/restore steps needed.

## Quick start

```yaml
- uses: boringcache/gradle-action@v1
  with:
    workspace: my-org/my-project
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}

- run: ./gradlew build
```

The action configures Gradle's remote build cache via an init script. Gradle reads and writes cache entries through the proxy transparently.

## How it works

1. **Main step**: Installs the BoringCache CLI, starts a local HTTP build cache proxy, writes a Gradle init script to `~/.gradle/init.d/`, and optionally enables `org.gradle.caching=true`.
2. **Build**: Gradle reads/writes cache entries via the proxy using its native HTTP Build Cache protocol.
3. **Post step**: Stops the proxy (flushes any pending uploads).

No explicit save or restore is needed. The proxy handles cache reads and writes as Gradle requests them.

## Read-only mode

For pull request builds, set `read-only: true` to prevent pushing results while still benefiting from cache hits:

```yaml
- uses: boringcache/gradle-action@v1
  with:
    workspace: my-org/my-project
    read-only: ${{ github.event_name == 'pull_request' }}
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `cli-version` | `v1.2.0` | BoringCache CLI version. Set to `skip` to disable automatic setup. |
| `workspace` | | BoringCache workspace (e.g., `my-org/my-project`). |
| `cache-tag` | repo name | Cache tag prefix. |
| `proxy-port` | `5000` | Port for the cache proxy. |
| `read-only` | `false` | Don't push build results (useful for PRs). |
| `gradle-home` | `~/.gradle` | Gradle user home directory. |
| `enable-build-cache` | `true` | Set `org.gradle.caching=true` in `gradle.properties`. |
| `proxy-no-git` | `false` | Pass `--no-git` to the proxy. |
| `proxy-no-platform` | `false` | Pass `--no-platform` to the proxy. |
| `verbose` | `false` | Enable verbose CLI output. |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-tag` | Resolved cache tag. |
| `proxy-port` | Proxy port used. |
| `workspace` | Resolved workspace. |

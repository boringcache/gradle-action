# boringcache/gradle-action

Run a local Gradle build cache backed by BoringCache.

## When to use it

Use it when Gradle should keep using its native HTTP build cache and you do not want to archive `.gradle` by hand.

## Quick start

```yaml
- uses: boringcache/gradle-action@v1
  with:
    workspace: my-org/my-project
    read-only: ${{ github.event_name == 'pull_request' }}
  env:
    BORINGCACHE_RESTORE_TOKEN: ${{ secrets.BORINGCACHE_RESTORE_TOKEN }}
    BORINGCACHE_SAVE_TOKEN: ${{ github.event_name == 'pull_request' && '' || secrets.BORINGCACHE_SAVE_TOKEN }}

- run: ./gradlew build
```

## Trust model

- Use `read-only: true` on pull requests and other low-trust jobs.
- Restore-only jobs can use `BORINGCACHE_RESTORE_TOKEN`; writes should use `BORINGCACHE_SAVE_TOKEN`.
- Keep trusted writes on protected branches or isolated tag scopes.

## What it handles

- Installs the CLI.
- Starts a local cache-registry proxy.
- Writes a Gradle init script that points at the proxy.
- Flushes pending uploads when the job finishes.

## Key inputs

| Input | Description |
|-------|-------------|
| `workspace` | Workspace in `org/repo` form. Defaults to the repo name. |
| `cache-tag` | Cache tag prefix. Defaults to the repo name. |
| `read-only` | Disable remote writes on PRs or other low-trust jobs. |
| `proxy-port` | Port for the local proxy. |
| `gradle-home` | Gradle user home directory. |
| `enable-build-cache` | Force `org.gradle.caching=true`. |
| `cli-version` | CLI version to install. |

## Outputs

| Output | Description |
|--------|-------------|
| `cache-tag` | Resolved cache tag. |
| `proxy-port` | Proxy port in use. |
| `workspace` | Resolved workspace name. |

## Learn more

- [GitHub Actions docs](https://boringcache.com/docs#language-actions)
- [GitHub Actions auth and trust model](https://boringcache.com/docs#actions-auth)
- [Native proxy integrations](https://boringcache.com/docs#cli-cache-registry)

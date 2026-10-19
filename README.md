# dsh-pve

[简体中文](./README.zh-CN.md)

A DeepSeek Harness plugin for inspecting and managing Proxmox VE (PVE) through conversation, authenticated with a PVE API token or a username/password (ticket) login.

## Why dsh-pve

- Inspect nodes, QEMU VMs, LXC containers, storage, network, firewall, cluster, backup, HA, replication, Ceph, users, groups, roles and pools through conversation.
- Manage power state, clone, migrate, snapshot, resize and move disks, create/delete guests and storages, and manage backup/replication/firewall rules.
- Every write operation triggers a mandatory native user-approval prompt — the model cannot bypass it.
- Credentials (API token secret or login password) are kept in the local DSH credential store and never echoed back to the browser or the model.

## Requirements

| Component | Supported baseline |
| --- | --- |
| Node.js | 20.11 or newer |
| DeepSeek Harness | 0.2.0-rc.1 – 0.2.1-rc.2 (and later 0.2.1 prereleases) |
| Proxmox VE | PVE2 JSON API (API Token auth on 6.0+, username/password ticket auth on 5.x) |

## Installation (for the agent)

Once installed, the agent gains 233 `pve_*` tools automatically. Every tool except `pve_sources` takes an optional `source` argument.

Local development:

```bash
npm ci
dsh plugin --profile <name> add link:/absolute/path/to/dsh-pve
```

Published, pinned tag (recommended):

```bash
dsh plugin --profile <name> add github:we39/dsh-pve#v<version>
```

Development branch (testing only):

```bash
dsh plugin --profile <name> add github:we39/dsh-pve
```

Restart the selected profile after installation. For a no-packaging dev loop, load the overlay directly:

```bash
dsh --profile <name> --patch ./cordis.patch.yml
```

## Configuration

In DSH Web: **Settings → Plugins → Proxmox VE** (a standalone section on DSH 0.2.0+ hosts).

The page lists your Proxmox VE **sources**. Add one per cluster you want the assistant to reach (for example production and staging). Each source has:

- **Source name**: required and unique; any language. This is what you (or the assistant) use to pick the source.
- **UID**: generated automatically, globally unique, read-only. Credentials are keyed by it, so renaming a source never loses its keys.
- **Base URL**, e.g. `https://pve.example.com:8006`.
- **Authentication**: `API Token` (PVE 6.0+) or `Username / password` (PVE 5.x compatible), chosen independently per source.
  - Token mode: **Token ID** (`user@realm!tokenid`, e.g. `monitor@pve!dsh`) + **Token Secret** (write-only).
  - Password mode: **Username** (e.g. `root@pam`) + **Password** (write-only).
- **Skip TLS verification**: enable for self-signed internal hosts (5.x and 6.0+).

Mark one source as the **default**; tool calls that omit `source` use it. With a single source it is the default automatically.

PVE 6.0+ → create an API token (**Datacenter → Permissions → API Token**) with the least privilege required. PVE 5.x has no API token → switch that source to username/password mode.

### Multiple sources

Every tool accepts an optional `source` argument (a source name or UID). Ask the assistant for "the staging cluster" and it calls `pve_sources` first to discover the names, then passes `source`. If several sources exist and none is the default, omitting `source` is an error rather than a guess.

For write tools the approval prompt names the target source, and the approval is bound to it: if the default changes between approval and execution, the write is refused instead of landing on a different Proxmox VE cluster.

### Upgrading from 0.1.x

Your existing single-source setup keeps working. On first start the plugin turns it into a source named `default`, **reusing the same stored Token Secret / login password** (the credentials themselves are not moved or re-entered). If that automatic step could not run, the settings page shows a "Legacy single-source configuration found" notice with an **Import as a source** button.

## Tools

233 tools (117 read-only / 116 write) across 14 domains. All write tools require native user approval. Every tool except `pve_sources` takes an optional `source` argument.

| Domain | Tools | Scope |
| --- | --- | --- |
| Sources | 1 | list the configured Proxmox VE sources (never returns credentials) |
| Cluster & overview | 8 | version, status, resources index, tasks, log, nextid, options |
| Nodes & tasks | 23 | status, config, services, disks, syslog, apt, SMART, task polling |
| Network | 12 | interface CRUD + reload, DNS, hosts, time |
| VMs (QEMU) | 22 | config, power, snapshot, clone, migrate, resize, move-disk, guest-agent, monitor |
| Containers (LXC) | 15 | config, power, snapshot, clone, migrate, resize |
| Storage | 11 | CRUD, content/volumes, upload, RRD |
| Firewall | 76 | rules / aliases / ipset / options / log across cluster·node·VM·CT scopes |
| Access control | 21 | users, groups, roles, domains, ACL |
| Pools | 5 | resource pools |
| HA | 13 | resources, groups, status, migrate / relocate |
| Backup | 6 | vzdump jobs + run-now |
| Replication | 9 | job CRUD, schedule-now, status / log |
| Ceph | 11 | status, OSD, pools, MON / MDS / FS, logs |

See **[docs/tools.md](docs/tools.md)** for the full per-tool reference (name, method, path, description).

Async operations return a `UPID:...` task id — the agent polls `pve_task_status` / `pve_task_log` to confirm completion.

## Security

- Mandatory approval on every write operation — the model cannot bypass it.
- Secrets, tokens, and passwords are redacted before any response reaches the model.
- All PVE-returned data is treated as untrusted, never as instructions.

## Development

```bash
npm install
npm run verify   # node --check + node:test
```

## Structure

- `index.js` — generic execution engine + full endpoint catalog + write-approval gateway
- `client.js` — settings-page form card (slot key `pve`)
- `cordis.patch.yml` — bundle patch (insert id `pve` / name `dsh-pve`)
- `docs/tools.md` — full tool reference
- `test/index.test.js` — `node:test` unit tests

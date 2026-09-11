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
| DeepSeek Harness | 0.1.2-rc.1 |
| Proxmox VE | PVE2 JSON API (API Token auth on 6.0+, username/password ticket auth on 5.x) |

## Installation (for the agent)

Once installed, the agent gains 232 `pve_*` tools automatically.

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

In DSH Web: **Settings → Plugins → Proxmox VE control**.

| Field | Description |
| --- | --- |
| Base URL | e.g. `https://pve.example.com:8006` |
| Authentication | `API Token` (PVE 6.0+) or `Username / password` (PVE 5.x compatible) |
| Token ID | `user@realm!tokenid`, e.g. `monitor@pve!dsh` — token mode only |
| Token Secret | The token UUID; stored write-only — token mode only |
| Username | e.g. `root@pam` — password mode only |
| Password | The login password; stored write-only — password mode only |
| Skip TLS verification | Enable for self-signed internal hosts (5.x and 6.0+) |

PVE 6.0+ → create an API token (**Datacenter → Permissions → API Token**) with the least privilege required. PVE 5.x has no API token → switch to username/password mode.

## Tools

232 tools (116 read-only / 116 write) across 13 domains. All write tools require native user approval.

| Domain | Tools | Scope |
| --- | --- | --- |
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

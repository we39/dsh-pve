# dsh-pve

一个通过对话检查和管理 Proxmox VE（PVE）的 DeepSeek Harness 插件。支持 PVE API token 或用户名/密码（ticket）登录。

## 为什么用 dsh-pve

- 通过对话检查节点、QEMU VM、LXC 容器、存储、网络、防火墙、集群、备份、HA、复制、Ceph、用户、组、角色和资源池。
- 管理电源状态、克隆、迁移、快照、磁盘调整、创建/删除 guest 和存储，以及备份/复制/防火墙规则。
- 所有写操作都会触发原生用户审批提示，模型无法绕过。
- 凭证（API token secret 或登录密码）保存在本地 DSH 凭证库中，不会回显给模型。

## 需求

| 组件 | 支持基线 |
| --- | --- |
| Node.js | 20.11 或更高 |
| DeepSeek Harness | `0.1.2-rc.1` |
| Proxmox VE | PVE2 JSON API（6.0+ 用 API Token；5.x 用用户名/密码 ticket） |

## 安装（给 agent 用）

安装后，agent 会自动获得 232 个 `pve_*` tools。

本地开发：

```bash
npm ci
dsh plugin --profile <name> add link:/absolute/path/to/dsh-pve
```

发布版，固定 tag（推荐）：

```bash
dsh plugin --profile <name> add github:we39/dsh-pve#v<version>
```

开发分支（仅测试）：

```bash
dsh plugin --profile <name> add github:we39/dsh-pve
```

安装后重启所选 profile。若要无打包开发，可直接加载 overlay：

```bash
dsh --profile <name> --patch ./cordis.patch.yml
```

## 配置

在 DSH Web：**Settings → Plugins → Proxmox VE control**。

| 字段 | 说明 |
| --- | --- |
| Base URL | 例如 `https://pve.example.com:8006` |
| Authentication | `API Token`（PVE 6.0+）或 `Username / password`（兼容 PVE 5.x） |
| Token ID | `user@realm!tokenid`，例如 `monitor@pve!dsh` — 仅 token 模式 |
| Token Secret | token UUID；只写不读 — 仅 token 模式 |
| Username | 例如 `root@pam` — 仅 password 模式 |
| Password | 登录密码；只写不读 — 仅 password 模式 |
| Skip TLS verification | 内网自签名证书可开启（5.x 和 6.0+） |

PVE 6.0+ → 在 **Datacenter → Permissions → API Token** 创建最小权限 token。PVE 5.x 没有 API token → 切到用户名/密码模式。

## 工具

232 个 tools（116 个只读 / 116 个写）分布在 13 个 domain。所有写操作都需要原生用户批准。

| 域 | 工具数 | 范围 |
| --- | --- | --- |
| 集群与总览 | 8 | 版本、状态、资源索引、任务、日志、nextid、options |
| 节点与任务 | 23 | 状态、配置、服务、磁盘、syslog、apt、SMART、任务轮询 |
| 网络 | 12 | 网卡 CRUD、重载、DNS、hosts、时间 |
| VM（QEMU） | 22 | 配置、电源、快照、克隆、迁移、扩容、移动磁盘、guest-agent、monitor |
| 容器（LXC） | 15 | 配置、电源、快照、克隆、迁移、扩容 |
| 存储 | 11 | CRUD、内容/卷、上传、RRD |
| 防火墙 | 76 | cluster / node / VM / CT 作用域下的规则、别名、ipset、options、log |
| 访问控制 | 21 | 用户、组、角色、域、ACL |
| 资源池 | 5 | resource pool |
| HA | 13 | 资源、组、状态、迁移 / 重新定位 |
| 备份 | 6 | vzdump 任务 + 立即执行 |
| 复制 | 9 | 任务 CRUD、立即调度、状态 / 日志 |
| Ceph | 11 | 状态、OSD、pool、MON / MDS / FS、日志 |

完整逐个工具参考见 **[docs/tools.md](docs/tools.md)**。

异步操作会返回 `UPID:...` task id——agent 会轮询 `pve_task_status` / `pve_task_log` 确认完成。

## 安全

- 每次写操作都必须走审批，模型无法绕过。
- secrets、tokens、passwords 在返回给模型前都会被脱敏。
- 所有 PVE 返回数据都视为不可信输入，不当作指令。

## 开发

```bash
npm install
npm run verify   # node --check + node:test
```

## 结构

- `index.js` — 通用执行引擎 + 完整 endpoint 目录 + 写操作审批网关
- `client.js` — 设置页表单卡片（slot key `pve`）
- `cordis.patch.yml` — bundle patch（插入 id `pve` / name `dsh-pve`）
- `docs/tools.md` — 完整工具参考
- `test/index.test.js` — `node:test` 单元测试

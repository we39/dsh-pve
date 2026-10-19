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
| DeepSeek Harness | `0.2.0-rc.1` – `0.2.1-rc.2`（及后续 0.2.1 预发布版本） |
| Proxmox VE | PVE2 JSON API（6.0+ 用 API Token；5.x 用用户名/密码 ticket） |

## 安装（给 agent 用）

安装后，agent 会自动获得 233 个 `pve_*` tools。除 `pve_sources` 外，每个工具都接受可选的 `source` 参数。

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

在 DSH Web：**Settings → Plugins → Proxmox VE**（DeepSeek Harness 0.2.0+ 在设置页左侧提供独立分区）。

页面列出你的 Proxmox VE **源站**。每个想让助手访问的集群（例如生产、测试）各添加一个源站。每个源站包含：

- **源站名称**：必填且唯一，可用任何语言。你（或助手）用它来选择源站。
- **UID**：自动生成、全球唯一、不可修改。凭证按它存放，所以重命名源站不会丢失密钥。
- **Base URL**：例如 `https://pve.example.com:8006`。
- **鉴权方式**：`API Token`（PVE 6.0+）或 `账号密码`（兼容 PVE 5.x），每个源站可独立选择。
  - Token 模式：**Token ID**（`user@realm!tokenid`，例如 `monitor@pve!dsh`）+ **Token Secret**（只写不读）。
  - 密码模式：**用户名**（例如 `root@pam`）+ **密码**（只写不读）。
- **跳过 TLS 校验**：内网自签名证书可开启（5.x 和 6.0+）。

可以把其中一个设为**默认**源站；省略 `source` 的工具调用会使用它。只有一个源站时，它自动就是默认。

PVE 6.0+ → 在 **Datacenter → Permissions → API Token** 为该源站创建最小权限 token。PVE 5.x 没有 API token → 把该源站切到用户名/密码模式。

### 多源站

除 `pve_sources` 外，每个工具都接受可选的 `source` 参数（源站名称或 UID）。你对助手说"看看测试环境的集群"，它会先调用 `pve_sources` 获知有哪些名称，再传入 `source`。如果配置了多个源站但没有默认源站，省略 `source` 会直接报错，而不是猜一个。

写工具的审批提示会点名目标源站，并且审批与它绑定：如果在审批之后、执行之前默认源站发生了变化，写入会被拒绝，而不是落到另一个 Proxmox VE 集群上。

### 从 0.1.x 升级

原有的单源配置会继续可用。首次启动时，插件会把它转成一个名为 `default` 的源站，并**沿用原来已存的 Token Secret / 登录密码**（凭证本身不会被搬运或重新输入）。如果这一步自动迁移没能执行，设置页会显示"检测到旧版单源配置"的提示和**导入为源站**按钮。

## 工具

233 个 tools（117 个只读 / 116 个写）分布在 14 个 domain。所有写操作都需要原生用户批准。除 `pve_sources` 外，每个工具都接受可选的 `source` 参数。

| 域 | 工具数 | 范围 |
| --- | --- | --- |
| 源站 | 1 | 列出已配置的 Proxmox VE 源站（绝不返回凭证） |
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

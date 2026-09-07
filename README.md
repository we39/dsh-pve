# dsh-pve

通过对话检查和操控 Proxmox VE（PVE）。基于 PVE2 JSON API，使用 API Token 鉴权。

## 功能

覆盖 PVE 全量管理面并通过对话调用，包括：

- **概览**：`pve_version`、`pve_cluster_status`、`pve_cluster_resources`、`pve_node_list`、`pve_node_rrd`
- **虚拟机 (QEMU)**：列表/配置/状态/性能，创建/删除/克隆/迁移/快照/磁盘 resize/move/迁移，电源开关，guest-agent，QEMU monitor
- **容器 (LXC)**：同上的核心 CRUD + 电源 + 快照 + resize
- **存储**：列表/创建/更新/删除，内容/卷管理，上传 ISO/模板，RRD
- **网络**：接口 CRUD + reload，DNS / hosts / time 管理
- **防火墙**：cluster / node / vm / ct 四个作用域的 rules、aliases、ipset、options、log、refs
- **访问控制**：用户/组/角色/域/ACL
- **高可用 (HA)**：资源/组/状态，迁移与重定位
- **备份 / 复制**：vzdump 任务 CRUD、立即备份、replication 任务 CRUD
- **Ceph**：状态/OSD/池/MON/MDS/FS/日志（只读为主 + 池 CRUD）
- **池 / 系统**：resource pools、节点服务启停、任务轮询（`pve_task_status` / `pve_task_log`）

所有写操作（创建/修改/删除/电源/执行）都会触发 DSH 原生用户审批弹窗，模型无法绕过。

## 安装

```bash
# 本地目录开发期安装到 profile
dsh plugin --profile <name> add ./dsh-pve

# 或开发期 overlay 加载，无需打包
dsh --profile <name> --patch ./cordis.patch.yml
```

## 配置（设置 → 插件）

| 字段 | 说明 |
| --- | --- |
| Base URL | PVE 地址，如 `https://pve.example.com` |
| Token ID | API Token 标识，如 `monitoring@pve!dsh`（`PVEAPIToken` 中 `=` 前的部分） |
| Token Secret | API Token 密钥（UUID），仅存本地凭证库，不回显 |
| 跳过 TLS 校验 | 自签名内网证书需勾选 |

在 PVE 中为指定用户创建 API Token（数据中心 → 权限 → API Token），按需授予只读或管理员权限。

## 开发

```bash
npm install
npm run verify   # node --check + node:test
```

## 结构

- `index.js` — host 侧：泛型执行引擎 + 全量端点目录表（数据驱动）+ 写操作审批网关
- `client.js` — 设置页表单卡片（settings 子注册 key `pve`）
- `cordis.patch.yml` — bundle patch（insert id `pve` / name `dsh-pve`）
- `test/index.test.js` — `node:test` 单测（纯函数 + 目录完整性）

# dsh-pve 工具参考

共 232 个工具（116 只读 / 116 写）。所有写操作都会触发 DSH 原生人工审批。

`{node}`/`{vmid}`/`{storage}` 等为路径参数。写工具标注 **[写]**。

## Cluster & overview

### `pve_cluster_log`

`GET /cluster/log`

Read the cluster log. Read-only.

### `pve_cluster_nextid`

`GET /cluster/nextid`

Get the next free VMID (or check whether a specific VMID is free). Read-only.

### `pve_cluster_options`

`GET /cluster/options`

Get datacenter options (e.g. HA settings, default language). Read-only.

### `pve_cluster_resources`

`GET /cluster/resources`

Get a cluster-wide index of all resources (nodes, VMs, containers, storage), optionally filtered by type. This is the single best overview call. Read-only.

### `pve_cluster_status`

`GET /cluster/status`

Get cluster status: quorum, node list, and cluster-wide info. Read-only.

### `pve_cluster_tasks`

`GET /cluster/tasks`

List recent cluster-wide tasks. Read-only.

### `pve_version`

`GET /version`

Get Proxmox VE API version and the enabled features of the datacenter. Read-only.

### `pve_cluster_options_set`

**[写]** `PUT /cluster/options`

Update datacenter options. WRITE OPERATION: triggers a mandatory approval prompt before running.

## Network

### `pve_node_dns`

`GET /nodes/{node}/dns`

Read DNS settings of a node. Read-only.

### `pve_node_hosts`

`GET /nodes/{node}/hosts`

Get the contents of /etc/hosts. Read-only.

### `pve_node_network_get`

`GET /nodes/{node}/network/{iface}`

Get a single network interface configuration. Read-only.

### `pve_node_network_list`

`GET /nodes/{node}/network`

List network interfaces and their configuration. Read-only.

### `pve_node_time`

`GET /nodes/{node}/time`

Read server time and timezone. Read-only.

### `pve_node_dns_set`

**[写]** `PUT /nodes/{node}/dns`

Write DNS settings for a node. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_hosts_set`

**[写]** `POST /nodes/{node}/hosts`

Write /etc/hosts for a node. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_network_create`

**[写]** `POST /nodes/{node}/network`

Create a new network interface. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_network_delete`

**[写]** `DELETE /nodes/{node}/network/{iface}`

Delete a network interface configuration. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_network_reload`

**[写]** `PUT /nodes/{node}/network`

Apply/reload the network configuration of a node. WRITE OPERATION: triggers a mandatory approval prompt; may briefly drop connectivity.

### `pve_node_network_update`

**[写]** `PUT /nodes/{node}/network/{iface}`

Update a network interface. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_time_set`

**[写]** `PUT /nodes/{node}/time`

Set the node timezone. WRITE OPERATION: triggers a mandatory approval prompt.

## Nodes & tasks

### `pve_node_apt_updates`

`GET /nodes/{node}/apt/update`

List available package updates. Read-only.

### `pve_node_apt_versions`

`GET /nodes/{node}/apt/versions`

Get package version info for important Proxmox packages. Read-only.

### `pve_node_cert_info`

`GET /nodes/{node}/certificates/info`

Get information about the node certificates. Read-only.

### `pve_node_config`

`GET /nodes/{node}/config`

Get node configuration options. Read-only.

### `pve_node_disks`

`GET /nodes/{node}/disks/list`

List local disks and their usage. Read-only.

### `pve_node_list`

`GET /nodes`

List all cluster nodes. Read-only.

### `pve_node_report`

`GET /nodes/{node}/report`

Gather various system information about a node (useful for support). Read-only.

### `pve_node_rrd`

`GET /nodes/{node}/rrddata`

Read node RRD performance stats (CPU/mem/io). Read-only.

### `pve_node_service_state`

`GET /nodes/{node}/services/{service}/state`

Read the state of one system service. Read-only.

### `pve_node_services`

`GET /nodes/{node}/services`

List system services and their state. Read-only.

### `pve_node_smart`

`GET /nodes/{node}/disks/smart`

Get SMART health data of a disk. Read-only.

### `pve_node_status`

`GET /nodes/{node}/status`

Read the status of a node (CPU, memory, uptime, load). Read-only.

### `pve_node_storage_scan`

`GET /nodes/{node}/scan/{method}`

Scan for storage on a node (local LVM/ZFS, remote NFS/CIFS/GlusterFS/iSCSI, USB). Read-only.

### `pve_node_subscription`

`GET /nodes/{node}/subscription`

Read subscription status. Read-only.

### `pve_node_syslog`

`GET /nodes/{node}/syslog`

Read the system log of a node. Read-only.

### `pve_node_tasks`

`GET /nodes/{node}/tasks`

List finished tasks of a node. Read-only.

### `pve_task_log`

`GET /nodes/{node}/tasks/{upid}/log`

Read the log of a task by UPID. Read-only.

### `pve_task_status`

`GET /nodes/{node}/tasks/{upid}/status`

Get the status of a task by UPID (use to poll async operations). Read-only.

### `pve_node_command`

**[写]** `POST /nodes/{node}/status`

Reboot or shutdown a node. WRITE OPERATION: triggers a mandatory approval prompt. Shutting down or rebooting a node is disruptive to everything running on it.

### `pve_node_config_set`

**[写]** `PUT /nodes/{node}/config`

Set node configuration options. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_execute`

**[写]** `POST /nodes/{node}/execute`

Execute one or more commands on a node via the PVE API (requires root). Each command is an array of argv. HIGH RISK — arbitrary command execution on the hypervisor itself.

### `pve_node_service_action`

**[写]** `POST /nodes/{node}/services/{service}/{action}`

Start, stop, restart, or reload a system service. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_task_stop`

**[写]** `DELETE /nodes/{node}/tasks/{upid}`

Stop a running task. WRITE OPERATION: triggers a mandatory approval prompt.

## VMs (QEMU)

### `pve_vm_config`

`GET /nodes/{node}/qemu/{vmid}/config`

Get current VM configuration. Read-only.

### `pve_vm_list`

`GET /nodes/{node}/qemu`

List all VMs on a node (optionally include config with "full"). Read-only.

### `pve_vm_pending`

`GET /nodes/{node}/qemu/{vmid}/pending`

Get VM configuration including pending changes. Read-only.

### `pve_vm_rrd`

`GET /nodes/{node}/qemu/{vmid}/rrddata`

Read VM RRD performance stats. Read-only.

### `pve_vm_snapshot_config`

`GET /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/config`

Get snapshot configuration. Read-only.

### `pve_vm_snapshot_list`

`GET /nodes/{node}/qemu/{vmid}/snapshot`

List all snapshots of a VM. Read-only.

### `pve_vm_status`

`GET /nodes/{node}/qemu/{vmid}/status/current`

Get the current running status of a VM. Read-only.

### `pve_vm_agent`

**[写]** `POST /nodes/{node}/qemu/{vmid}/agent`

Run a QEMU guest-agent command inside the VM (info, get-osinfo, exec, shutdown, fsfreeze, ping, ...). WRITE OPERATION: triggers a mandatory approval prompt. "exec" runs arbitrary commands inside the guest — high risk.

### `pve_vm_clone`

**[写]** `POST /nodes/{node}/qemu/{vmid}/clone`

Clone a VM or template. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_config_set`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/config`

Set VM configuration options (synchronous). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_create`

**[写]** `POST /nodes/{node}/qemu`

Create or restore a virtual machine. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_delete`

**[写]** `DELETE /nodes/{node}/qemu/{vmid}`

PERMANENTLY DESTROY a VM. WRITE OPERATION: triggers a mandatory approval prompt. When purge=true all owned disks are deleted too — this is irreversible, treat with maximum care.

### `pve_vm_migrate`

**[写]** `POST /nodes/{node}/qemu/{vmid}/migrate`

Migrate a VM to another node. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_monitor`

**[写]** `POST /nodes/{node}/qemu/{vmid}/monitor`

Execute a raw QEMU monitor command. WRITE OPERATION: triggers a mandatory approval prompt. HIGH RISK — arbitrary QEMU control-plane access.

### `pve_vm_move_disk`

**[写]** `POST /nodes/{node}/qemu/{vmid}/move_disk`

Move a VM disk to another storage. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_power`

**[写]** `POST /nodes/{node}/qemu/{vmid}/status/{action}`

Change VM power state (start, stop, shutdown, reset, resume, suspend). WRITE OPERATION: triggers a mandatory approval prompt. "stop" is abrupt; "shutdown" is graceful.

### `pve_vm_resize`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/resize`

Extend the size of a VM disk. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_sendkey`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/sendkey`

Send a key event to a VM (like pressing a keyboard key). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_snapshot_create`

**[写]** `POST /nodes/{node}/qemu/{vmid}/snapshot`

Snapshot a VM. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_snapshot_delete`

**[写]** `DELETE /nodes/{node}/qemu/{vmid}/snapshot/{snapname}`

PERMANENTLY delete a VM snapshot. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_snapshot_rollback`

**[写]** `POST /nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback`

Rollback a VM to a snapshot. WRITE OPERATION: triggers a mandatory approval prompt; this discards current state.

### `pve_vm_template`

**[写]** `POST /nodes/{node}/qemu/{vmid}/template`

Convert a VM to a template. WRITE OPERATION: triggers a mandatory approval prompt.

## Containers (LXC)

### `pve_ct_config`

`GET /nodes/{node}/lxc/{vmid}/config`

Get current container configuration. Read-only.

### `pve_ct_list`

`GET /nodes/{node}/lxc`

List all LXC containers on a node. Read-only.

### `pve_ct_rrd`

`GET /nodes/{node}/lxc/{vmid}/rrddata`

Read container RRD performance stats. Read-only.

### `pve_ct_snapshot_list`

`GET /nodes/{node}/lxc/{vmid}/snapshot`

List all snapshots of a container. Read-only.

### `pve_ct_status`

`GET /nodes/{node}/lxc/{vmid}/status/current`

Get the current running status of a container. Read-only.

### `pve_ct_clone`

**[写]** `POST /nodes/{node}/lxc/{vmid}/clone`

Clone a container or template. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_config_set`

**[写]** `PUT /nodes/{node}/lxc/{vmid}/config`

Set container configuration options. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_create`

**[写]** `POST /nodes/{node}/lxc`

Create or restore an LXC container. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_delete`

**[写]** `DELETE /nodes/{node}/lxc/{vmid}`

PERMANENTLY DESTROY a container. WRITE OPERATION: triggers a mandatory approval prompt. When purge=true all owned volumes are deleted too — irreversible.

### `pve_ct_migrate`

**[写]** `POST /nodes/{node}/lxc/{vmid}/migrate`

Migrate a container to another node (requires restart). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_power`

**[写]** `POST /nodes/{node}/lxc/{vmid}/status/{action}`

Change container power state (start, stop, shutdown, resume, suspend). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_resize`

**[写]** `PUT /nodes/{node}/lxc/{vmid}/resize`

Resize a container mount point. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_snapshot_create`

**[写]** `POST /nodes/{node}/lxc/{vmid}/snapshot`

Snapshot a container. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_snapshot_delete`

**[写]** `DELETE /nodes/{node}/lxc/{vmid}/snapshot/{snapname}`

PERMANENTLY delete a container snapshot. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_snapshot_rollback`

**[写]** `POST /nodes/{node}/lxc/{vmid}/snapshot/{snapname}/rollback`

Rollback a container to a snapshot. WRITE OPERATION: triggers a mandatory approval prompt; this discards current state.

## Storage

### `pve_storage_config`

`GET /storage/{storage}`

Get storage configuration. Read-only.

### `pve_storage_content`

`GET /nodes/{node}/storage/{storage}/content`

List content of a storage (volumes, images, ISOs, backups). Read-only.

### `pve_storage_list`

`GET /storage`

List all storages. Read-only.

### `pve_storage_rrd`

`GET /nodes/{node}/storage/{storage}/rrddata`

Read storage RRD performance stats. Read-only.

### `pve_storage_status`

`GET /nodes/{node}/storage/{storage}/status`

Read storage status (usage, content type). Read-only.

### `pve_storage_volume_get`

`GET /nodes/{node}/storage/{storage}/content/{volume}`

Get attributes of a single volume. Read-only.

### `pve_storage_create`

**[写]** `POST /storage`

Create a new storage. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_storage_delete`

**[写]** `DELETE /storage/{storage}`

PERMANENTLY delete a storage configuration (does not delete data on the underlying storage). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_storage_update`

**[写]** `PUT /storage/{storage}`

Update storage configuration. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_storage_upload`

**[写]** `POST /nodes/{node}/storage/{storage}/upload`

Upload a local file (e.g. an ISO or a container template) to a storage. Reads the file on this machine and uploads it.

### `pve_storage_volume_delete`

**[写]** `DELETE /nodes/{node}/storage/{storage}/content/{volume}`

PERMANENTLY delete a volume. WRITE OPERATION: triggers a mandatory approval prompt.

## Firewall

### `pve_cluster_firewall_alias_get`

`GET /cluster/firewall/aliases/{name}`

Read an alias. Read-only.

### `pve_cluster_firewall_aliases`

`GET /cluster/firewall/aliases`

List IP/network aliases in this scope. Read-only.

### `pve_cluster_firewall_ipset`

`GET /cluster/firewall/ipset`

List IPSets in this scope. Read-only.

### `pve_cluster_firewall_ipset_get`

`GET /cluster/firewall/ipset/{name}`

Read an IPSet and its contents. Read-only.

### `pve_cluster_firewall_log`

`GET /cluster/firewall/log`

Read the firewall log for this scope. Read-only.

### `pve_cluster_firewall_options`

`GET /cluster/firewall/options`

Get firewall options for this scope. Read-only.

### `pve_cluster_firewall_refs`

`GET /cluster/firewall/refs`

List possible IPSet/alias references allowed in rule source/dest. Read-only.

### `pve_cluster_firewall_rule_get`

`GET /cluster/firewall/rules/{pos}`

Get a single firewall rule by position. Read-only.

### `pve_cluster_firewall_rules`

`GET /cluster/firewall/rules`

List firewall rules in this scope. Read-only.

### `pve_ct_firewall_alias_get`

`GET /nodes/{node}/lxc/{vmid}/firewall/aliases/{name}`

Read an alias. Read-only.

### `pve_ct_firewall_aliases`

`GET /nodes/{node}/lxc/{vmid}/firewall/aliases`

List IP/network aliases in this scope. Read-only.

### `pve_ct_firewall_ipset`

`GET /nodes/{node}/lxc/{vmid}/firewall/ipset`

List IPSets in this scope. Read-only.

### `pve_ct_firewall_ipset_get`

`GET /nodes/{node}/lxc/{vmid}/firewall/ipset/{name}`

Read an IPSet and its contents. Read-only.

### `pve_ct_firewall_log`

`GET /nodes/{node}/lxc/{vmid}/firewall/log`

Read the firewall log for this scope. Read-only.

### `pve_ct_firewall_options`

`GET /nodes/{node}/lxc/{vmid}/firewall/options`

Get firewall options for this scope. Read-only.

### `pve_ct_firewall_refs`

`GET /nodes/{node}/lxc/{vmid}/firewall/refs`

List possible IPSet/alias references allowed in rule source/dest. Read-only.

### `pve_ct_firewall_rule_get`

`GET /nodes/{node}/lxc/{vmid}/firewall/rules/{pos}`

Get a single firewall rule by position. Read-only.

### `pve_ct_firewall_rules`

`GET /nodes/{node}/lxc/{vmid}/firewall/rules`

List firewall rules in this scope. Read-only.

### `pve_node_firewall_alias_get`

`GET /nodes/{node}/firewall/aliases/{name}`

Read an alias. Read-only.

### `pve_node_firewall_aliases`

`GET /nodes/{node}/firewall/aliases`

List IP/network aliases in this scope. Read-only.

### `pve_node_firewall_ipset`

`GET /nodes/{node}/firewall/ipset`

List IPSets in this scope. Read-only.

### `pve_node_firewall_ipset_get`

`GET /nodes/{node}/firewall/ipset/{name}`

Read an IPSet and its contents. Read-only.

### `pve_node_firewall_log`

`GET /nodes/{node}/firewall/log`

Read the firewall log for this scope. Read-only.

### `pve_node_firewall_options`

`GET /nodes/{node}/firewall/options`

Get firewall options for this scope. Read-only.

### `pve_node_firewall_refs`

`GET /nodes/{node}/firewall/refs`

List possible IPSet/alias references allowed in rule source/dest. Read-only.

### `pve_node_firewall_rule_get`

`GET /nodes/{node}/firewall/rules/{pos}`

Get a single firewall rule by position. Read-only.

### `pve_node_firewall_rules`

`GET /nodes/{node}/firewall/rules`

List firewall rules in this scope. Read-only.

### `pve_vm_firewall_alias_get`

`GET /nodes/{node}/qemu/{vmid}/firewall/aliases/{name}`

Read an alias. Read-only.

### `pve_vm_firewall_aliases`

`GET /nodes/{node}/qemu/{vmid}/firewall/aliases`

List IP/network aliases in this scope. Read-only.

### `pve_vm_firewall_ipset`

`GET /nodes/{node}/qemu/{vmid}/firewall/ipset`

List IPSets in this scope. Read-only.

### `pve_vm_firewall_ipset_get`

`GET /nodes/{node}/qemu/{vmid}/firewall/ipset/{name}`

Read an IPSet and its contents. Read-only.

### `pve_vm_firewall_log`

`GET /nodes/{node}/qemu/{vmid}/firewall/log`

Read the firewall log for this scope. Read-only.

### `pve_vm_firewall_options`

`GET /nodes/{node}/qemu/{vmid}/firewall/options`

Get firewall options for this scope. Read-only.

### `pve_vm_firewall_refs`

`GET /nodes/{node}/qemu/{vmid}/firewall/refs`

List possible IPSet/alias references allowed in rule source/dest. Read-only.

### `pve_vm_firewall_rule_get`

`GET /nodes/{node}/qemu/{vmid}/firewall/rules/{pos}`

Get a single firewall rule by position. Read-only.

### `pve_vm_firewall_rules`

`GET /nodes/{node}/qemu/{vmid}/firewall/rules`

List firewall rules in this scope. Read-only.

### `pve_cluster_firewall_alias_create`

**[写]** `POST /cluster/firewall/aliases`

Create an IP/network alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_alias_delete`

**[写]** `DELETE /cluster/firewall/aliases/{name}`

Delete an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_alias_update`

**[写]** `PUT /cluster/firewall/aliases/{name}`

Update an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_ipset_add`

**[写]** `POST /cluster/firewall/ipset/{name}`

Add an IP/network to an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_ipset_create`

**[写]** `POST /cluster/firewall/ipset`

Create an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_ipset_delete`

**[写]** `DELETE /cluster/firewall/ipset/{name}`

Delete an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_options_set`

**[写]** `PUT /cluster/firewall/options`

Set firewall options for this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_rule_create`

**[写]** `POST /cluster/firewall/rules`

Create a firewall rule in this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_rule_delete`

**[写]** `DELETE /cluster/firewall/rules/{pos}`

Delete a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_cluster_firewall_rule_update`

**[写]** `PUT /cluster/firewall/rules/{pos}`

Update a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_alias_create`

**[写]** `POST /nodes/{node}/lxc/{vmid}/firewall/aliases`

Create an IP/network alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_alias_delete`

**[写]** `DELETE /nodes/{node}/lxc/{vmid}/firewall/aliases/{name}`

Delete an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_alias_update`

**[写]** `PUT /nodes/{node}/lxc/{vmid}/firewall/aliases/{name}`

Update an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_ipset_add`

**[写]** `POST /nodes/{node}/lxc/{vmid}/firewall/ipset/{name}`

Add an IP/network to an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_ipset_create`

**[写]** `POST /nodes/{node}/lxc/{vmid}/firewall/ipset`

Create an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_ipset_delete`

**[写]** `DELETE /nodes/{node}/lxc/{vmid}/firewall/ipset/{name}`

Delete an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_options_set`

**[写]** `PUT /nodes/{node}/lxc/{vmid}/firewall/options`

Set firewall options for this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_rule_create`

**[写]** `POST /nodes/{node}/lxc/{vmid}/firewall/rules`

Create a firewall rule in this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_rule_delete`

**[写]** `DELETE /nodes/{node}/lxc/{vmid}/firewall/rules/{pos}`

Delete a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ct_firewall_rule_update`

**[写]** `PUT /nodes/{node}/lxc/{vmid}/firewall/rules/{pos}`

Update a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_alias_create`

**[写]** `POST /nodes/{node}/firewall/aliases`

Create an IP/network alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_alias_delete`

**[写]** `DELETE /nodes/{node}/firewall/aliases/{name}`

Delete an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_alias_update`

**[写]** `PUT /nodes/{node}/firewall/aliases/{name}`

Update an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_ipset_add`

**[写]** `POST /nodes/{node}/firewall/ipset/{name}`

Add an IP/network to an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_ipset_create`

**[写]** `POST /nodes/{node}/firewall/ipset`

Create an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_ipset_delete`

**[写]** `DELETE /nodes/{node}/firewall/ipset/{name}`

Delete an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_options_set`

**[写]** `PUT /nodes/{node}/firewall/options`

Set firewall options for this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_rule_create`

**[写]** `POST /nodes/{node}/firewall/rules`

Create a firewall rule in this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_rule_delete`

**[写]** `DELETE /nodes/{node}/firewall/rules/{pos}`

Delete a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_node_firewall_rule_update`

**[写]** `PUT /nodes/{node}/firewall/rules/{pos}`

Update a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_alias_create`

**[写]** `POST /nodes/{node}/qemu/{vmid}/firewall/aliases`

Create an IP/network alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_alias_delete`

**[写]** `DELETE /nodes/{node}/qemu/{vmid}/firewall/aliases/{name}`

Delete an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_alias_update`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/firewall/aliases/{name}`

Update an alias. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_ipset_add`

**[写]** `POST /nodes/{node}/qemu/{vmid}/firewall/ipset/{name}`

Add an IP/network to an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_ipset_create`

**[写]** `POST /nodes/{node}/qemu/{vmid}/firewall/ipset`

Create an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_ipset_delete`

**[写]** `DELETE /nodes/{node}/qemu/{vmid}/firewall/ipset/{name}`

Delete an IPSet. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_options_set`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/firewall/options`

Set firewall options for this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_rule_create`

**[写]** `POST /nodes/{node}/qemu/{vmid}/firewall/rules`

Create a firewall rule in this scope. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_rule_delete`

**[写]** `DELETE /nodes/{node}/qemu/{vmid}/firewall/rules/{pos}`

Delete a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_vm_firewall_rule_update`

**[写]** `PUT /nodes/{node}/qemu/{vmid}/firewall/rules/{pos}`

Update a firewall rule. WRITE OPERATION: triggers a mandatory approval prompt.

## Access control

### `pve_acl`

`GET /access/acl`

Get the Access Control List (all permissions). Read-only.

### `pve_domain_get`

`GET /access/domains/{realm}`

Get an authentication domain configuration. Read-only.

### `pve_domain_list`

`GET /access/domains`

List authentication domains (realms). Read-only.

### `pve_group_get`

`GET /access/groups/{groupid}`

Get a group configuration. Read-only.

### `pve_group_list`

`GET /access/groups`

List user groups. Read-only.

### `pve_role_get`

`GET /access/roles/{roleid}`

Get a role configuration. Read-only.

### `pve_role_list`

`GET /access/roles`

List roles. Read-only.

### `pve_user_get`

`GET /access/users/{userid}`

Get a user configuration. Read-only.

### `pve_user_list`

`GET /access/users`

List users. Read-only.

### `pve_acl_set`

**[写]** `PUT /access/acl`

Update the ACL (grant or revoke permissions). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_domain_create`

**[写]** `POST /access/domains`

Add an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_domain_delete`

**[写]** `DELETE /access/domains/{realm}`

PERMANENTLY delete an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_domain_update`

**[写]** `PUT /access/domains/{realm}`

Update an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_group_create`

**[写]** `POST /access/groups`

Create a user group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_group_delete`

**[写]** `DELETE /access/groups/{groupid}`

PERMANENTLY delete a user group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_group_update`

**[写]** `PUT /access/groups/{groupid}`

Update a user group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_role_create`

**[写]** `POST /access/roles`

Create a role. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_role_delete`

**[写]** `DELETE /access/roles/{roleid}`

PERMANENTLY delete a role. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_user_create`

**[写]** `POST /access/users`

Create a user. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_user_delete`

**[写]** `DELETE /access/users/{userid}`

PERMANENTLY delete a user. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_user_update`

**[写]** `PUT /access/users/{userid}`

Update a user. WRITE OPERATION: triggers a mandatory approval prompt.

## Pools

### `pve_pool_config`

`GET /pools/{poolid}`

Get a pool configuration. Read-only.

### `pve_pool_list`

`GET /pools`

List resource pools. Read-only.

### `pve_pool_create`

**[写]** `POST /pools`

Create a resource pool. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_pool_delete`

**[写]** `DELETE /pools/{poolid}`

Delete a pool. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_pool_update`

**[写]** `PUT /pools/{poolid}`

Update a pool. WRITE OPERATION: triggers a mandatory approval prompt.

## HA

### `pve_ha_groups`

`GET /cluster/ha/groups`

List HA groups. Read-only.

### `pve_ha_manager_status`

`GET /cluster/ha/status/manager_status`

Get full HA manager and LRM status. Read-only.

### `pve_ha_resource_get`

`GET /cluster/ha/resources/{sid}`

Read an HA resource configuration. Read-only.

### `pve_ha_resources`

`GET /cluster/ha/resources`

List HA resources. Read-only.

### `pve_ha_status`

`GET /cluster/ha/status/current`

Get current HA status. Read-only.

### `pve_ha_group_create`

**[写]** `POST /cluster/ha/groups`

Create an HA group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_group_delete`

**[写]** `DELETE /cluster/ha/groups/{group}`

Delete an HA group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_group_update`

**[写]** `PUT /cluster/ha/groups/{group}`

Update an HA group. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_resource_create`

**[写]** `POST /cluster/ha/resources`

Add an HA resource. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_resource_delete`

**[写]** `DELETE /cluster/ha/resources/{sid}`

Remove an HA resource (stops HA management of it). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_resource_migrate`

**[写]** `POST /cluster/ha/resources/{sid}/migrate`

Migrate an HA resource online to another node. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_resource_relocate`

**[写]** `POST /cluster/ha/resources/{sid}/relocate`

Relocate an HA resource to another node (restarts the service). WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ha_resource_update`

**[写]** `PUT /cluster/ha/resources/{sid}`

Update an HA resource. WRITE OPERATION: triggers a mandatory approval prompt.

## Backup

### `pve_backup_get`

`GET /cluster/backup/{id}`

Read a vzdump backup job definition. Read-only.

### `pve_backup_list`

`GET /cluster/backup`

List vzdump backup jobs. Read-only.

### `pve_backup_create`

**[写]** `POST /cluster/backup`

Create a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_backup_delete`

**[写]** `DELETE /cluster/backup/{id}`

Delete a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_backup_run`

**[写]** `POST /nodes/{node}/vzdump`

Backup one or more guests now. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_backup_update`

**[写]** `PUT /cluster/backup/{id}`

Update a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt.

## Replication

### `pve_replication_get`

`GET /cluster/replication/{id}`

Read a replication job configuration. Read-only.

### `pve_replication_list`

`GET /cluster/replication`

List cluster replication jobs. Read-only.

### `pve_replication_log`

`GET /nodes/{node}/replication/{id}/log`

Read the log of a replication job. Read-only.

### `pve_replication_node_status`

`GET /nodes/{node}/replication`

List status of all replication jobs on a node. Read-only.

### `pve_replication_status`

`GET /nodes/{node}/replication/{id}/status`

Get replication job status on a node. Read-only.

### `pve_replication_create`

**[写]** `POST /cluster/replication`

Create a replication job. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_replication_delete`

**[写]** `DELETE /cluster/replication/{id}`

Delete a replication job. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_replication_schedule_now`

**[写]** `POST /nodes/{node}/replication/{id}/schedule_now`

Schedule a node replication job to start as soon as possible. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_replication_update`

**[写]** `PUT /cluster/replication/{id}`

Update a replication job. WRITE OPERATION: triggers a mandatory approval prompt.

## Ceph

### `pve_ceph_config`

`GET /nodes/{node}/ceph/config`

Get Ceph configuration. Read-only.

### `pve_ceph_disks`

`GET /nodes/{node}/ceph/disks`

List local disks (for Ceph OSD selection). Read-only.

### `pve_ceph_fs`

`GET /nodes/{node}/ceph/fs`

List Ceph filesystems. Read-only.

### `pve_ceph_log`

`GET /nodes/{node}/ceph/log`

Read the Ceph log. Read-only.

### `pve_ceph_mds`

`GET /nodes/{node}/ceph/mds`

List Ceph metadata servers. Read-only.

### `pve_ceph_mon`

`GET /nodes/{node}/ceph/mon`

List Ceph monitors. Read-only.

### `pve_ceph_osd`

`GET /nodes/{node}/ceph/osd`

Get the list/tree of Ceph OSDs. Read-only.

### `pve_ceph_pools`

`GET /nodes/{node}/ceph/pools`

List Ceph pools. Read-only.

### `pve_ceph_status`

`GET /nodes/{node}/ceph/status`

Get Ceph cluster status. Read-only.

### `pve_ceph_pool_create`

**[写]** `POST /nodes/{node}/ceph/pools`

Create a Ceph pool. WRITE OPERATION: triggers a mandatory approval prompt.

### `pve_ceph_pool_delete`

**[写]** `DELETE /nodes/{node}/ceph/pools/{name}`

PERMANENTLY destroy a Ceph pool and its data. WRITE OPERATION: triggers a mandatory approval prompt.

# dsh-pve tools

Generated from `index.js`. 151 catalog entries + 2 special write tools.


## Read-only tools

| Name | Description |
| --- | --- |
| `pve_version` | Get Proxmox VE API version and the enabled features of the datacenter. Read-only. |
| `pve_cluster_status` | Get cluster status: quorum, node list, and cluster-wide info. Read-only. |
| `pve_cluster_resources` | Get a cluster-wide index of all resources (nodes, VMs, containers, storage), optionally filtered by type. This is the single best overview call. Read-only. |
| `pve_cluster_nextid` | Get the next free VMID (or check whether a specific VMID is free). Read-only. |
| `pve_cluster_tasks` | List recent cluster-wide tasks. Read-only. |
| `pve_cluster_log` | Read the cluster log. Read-only. |
| `pve_cluster_options` | Get datacenter options (e.g. HA settings, default language). Read-only. |
| `pve_node_list` | List all cluster nodes. Read-only. |
| `pve_node_status` | Read the status of a node (CPU, memory, uptime, load). Read-only. |
| `pve_node_config` | Get node configuration options. Read-only. |
| `pve_node_dns` | Read DNS settings of a node. Read-only. |
| `pve_node_time` | Read server time and timezone. Read-only. |
| `pve_node_hosts` | Get the contents of /etc/hosts. Read-only. |
| `pve_node_syslog` | Read the system log of a node. Read-only. |
| `pve_node_report` | Gather various system information about a node (useful for support). Read-only. |
| `pve_node_apt_updates` | List available package updates. Read-only. |
| `pve_node_apt_versions` | Get package version info for important Proxmox packages. Read-only. |
| `pve_node_subscription` | Read subscription status. Read-only. |
| `pve_node_network_list` | List network interfaces and their configuration. Read-only. |
| `pve_node_network_get` | Get a single network interface configuration. Read-only. |
| `pve_node_services` | List system services and their state. Read-only. |
| `pve_node_service_state` | Read the state of one system service. Read-only. |
| `pve_node_tasks` | List finished tasks of a node. Read-only. |
| `pve_task_status` | Get the status of a task by UPID (use to poll async operations). Read-only. |
| `pve_task_log` | Read the log of a task by UPID. Read-only. |
| `pve_node_disks` | List local disks and their usage. Read-only. |
| `pve_node_smart` | Get SMART health data of a disk. Read-only. |
| `pve_node_cert_info` | Get information about the node certificates. Read-only. |
| `pve_node_rrd` | Read node RRD performance stats (CPU/mem/io). Read-only. |
| `pve_node_storage_scan` | Scan for storage on a node (local LVM/ZFS, remote NFS/CIFS/GlusterFS/iSCSI, USB). Read-only. |
| `pve_storage_list` | List all storages. Read-only. |
| `pve_storage_config` | Get storage configuration. Read-only. |
| `pve_storage_status` | Read storage status (usage, content type). Read-only. |
| `pve_storage_content` | List content of a storage (volumes, images, ISOs, backups). Read-only. |
| `pve_storage_volume_get` | Get attributes of a single volume. Read-only. |
| `pve_storage_rrd` | Read storage RRD performance stats. Read-only. |
| `pve_vm_config` | Get current VM configuration. Read-only. |
| `pve_vm_pending` | Get VM configuration including pending changes. Read-only. |
| `pve_vm_status` | Get the current running status of a VM. Read-only. |
| `pve_vm_rrd` | Read VM RRD performance stats. Read-only. |
| `pve_vm_snapshot_list` | List all snapshots of a VM. Read-only. |
| `pve_vm_snapshot_config` | Get snapshot configuration. Read-only. |
| `pve_ct_list` | List all LXC containers on a node. Read-only. |
| `pve_ct_config` | Get current container configuration. Read-only. |
| `pve_ct_status` | Get the current running status of a container. Read-only. |
| `pve_ct_rrd` | Read container RRD performance stats. Read-only. |
| `pve_ct_snapshot_list` | List all snapshots of a container. Read-only. |
| `pve_pool_list` | List resource pools. Read-only. |
| `pve_pool_config` | Get a pool configuration. Read-only. |
| `pve_acl` | Get the Access Control List (all permissions). Read-only. |
| `pve_user_list` | List users. Read-only. |
| `pve_user_get` | Get a user configuration. Read-only. |
| `pve_group_list` | List user groups. Read-only. |
| `pve_group_get` | Get a group configuration. Read-only. |
| `pve_role_list` | List roles. Read-only. |
| `pve_role_get` | Get a role configuration. Read-only. |
| `pve_domain_list` | List authentication domains (realms). Read-only. |
| `pve_domain_get` | Get an authentication domain configuration. Read-only. |
| `pve_ha_status` | Get current HA status. Read-only. |
| `pve_ha_manager_status` | Get full HA manager and LRM status. Read-only. |
| `pve_ha_resources` | List HA resources. Read-only. |
| `pve_ha_resource_get` | Read an HA resource configuration. Read-only. |
| `pve_ha_groups` | List HA groups. Read-only. |
| `pve_backup_list` | List vzdump backup jobs. Read-only. |
| `pve_backup_get` | Read a vzdump backup job definition. Read-only. |
| `pve_replication_list` | List cluster replication jobs. Read-only. |
| `pve_replication_get` | Read a replication job configuration. Read-only. |
| `pve_replication_status` | Get replication job status on a node. Read-only. |
| `pve_replication_log` | Read the log of a replication job. Read-only. |
| `pve_replication_node_status` | List status of all replication jobs on a node. Read-only. |
| `pve_ceph_status` | Get Ceph cluster status. Read-only. |
| `pve_ceph_config` | Get Ceph configuration. Read-only. |
| `pve_ceph_osd` | Get the list/tree of Ceph OSDs. Read-only. |
| `pve_ceph_pools` | List Ceph pools. Read-only. |
| `pve_ceph_mon` | List Ceph monitors. Read-only. |
| `pve_ceph_mds` | List Ceph metadata servers. Read-only. |
| `pve_ceph_fs` | List Ceph filesystems. Read-only. |
| `pve_ceph_disks` | List local disks (for Ceph OSD selection). Read-only. |
| `pve_ceph_log` | Read the Ceph log. Read-only. |

## Write tools

| Name | Description |
| --- | --- |
| `pve_cluster_options_set` | Update datacenter options. WRITE OPERATION: triggers a mandatory approval prompt before running. |
| `pve_node_command` | Reboot or shutdown a node. WRITE OPERATION: triggers a mandatory approval prompt. Shutting down or rebooting a node is disruptive to everything running on it. |
| `pve_node_config_set` | Set node configuration options. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_dns_set` | Write DNS settings for a node. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_time_set` | Set the node timezone. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_hosts_set` | Write /etc/hosts for a node. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_network_create` | Create a new network interface. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_network_update` | Update a network interface. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_network_delete` | Delete a network interface configuration. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_network_reload` | Apply/reload the network configuration of a node. WRITE OPERATION: triggers a mandatory approval prompt; may briefly drop connectivity. |
| `pve_node_service_action` | Start, stop, restart, or reload a system service. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_task_stop` | Stop a running task. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_storage_create` | Create a new storage. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_storage_update` | Update storage configuration. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_storage_delete` | PERMANENTLY delete a storage configuration (does not delete data on the underlying storage). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_storage_volume_delete` | PERMANENTLY delete a volume. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_create` | Create or restore a virtual machine. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_delete` | PERMANENTLY DESTROY a VM. WRITE OPERATION: triggers a mandatory approval prompt. When purge=true all owned disks are deleted too — this is irreversible, treat with maximum care. |
| `pve_vm_config_set` | Set VM configuration options (synchronous). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_clone` | Clone a VM or template. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_migrate` | Migrate a VM to another node. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_resize` | Extend the size of a VM disk. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_move_disk` | Move a VM disk to another storage. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_snapshot_create` | Snapshot a VM. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_snapshot_rollback` | Rollback a VM to a snapshot. WRITE OPERATION: triggers a mandatory approval prompt; this discards current state. |
| `pve_vm_snapshot_delete` | PERMANENTLY delete a VM snapshot. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_monitor` | Execute a raw QEMU monitor command. WRITE OPERATION: triggers a mandatory approval prompt. HIGH RISK — arbitrary QEMU control-plane access. |
| `pve_vm_sendkey` | Send a key event to a VM (like pressing a keyboard key). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_vm_template` | Convert a VM to a template. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_create` | Create or restore an LXC container. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_delete` | PERMANENTLY DESTROY a container. WRITE OPERATION: triggers a mandatory approval prompt. When purge=true all owned volumes are deleted too — irreversible. |
| `pve_ct_power` | Change container power state (start, stop, shutdown, resume, suspend). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_config_set` | Set container configuration options. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_clone` | Clone a container or template. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_migrate` | Migrate a container to another node (requires restart). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_resize` | Resize a container mount point. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_snapshot_create` | Snapshot a container. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ct_snapshot_rollback` | Rollback a container to a snapshot. WRITE OPERATION: triggers a mandatory approval prompt; this discards current state. |
| `pve_ct_snapshot_delete` | PERMANENTLY delete a container snapshot. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_pool_create` | Create a resource pool. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_pool_update` | Update a pool. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_pool_delete` | Delete a pool. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_acl_set` | Update the ACL (grant or revoke permissions). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_user_create` | Create a user. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_user_update` | Update a user. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_user_delete` | PERMANENTLY delete a user. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_group_create` | Create a user group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_group_update` | Update a user group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_group_delete` | PERMANENTLY delete a user group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_role_create` | Create a role. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_role_delete` | PERMANENTLY delete a role. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_domain_create` | Add an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_domain_update` | Update an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_domain_delete` | PERMANENTLY delete an authentication domain. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_resource_create` | Add an HA resource. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_resource_update` | Update an HA resource. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_resource_delete` | Remove an HA resource (stops HA management of it). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_resource_migrate` | Migrate an HA resource online to another node. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_resource_relocate` | Relocate an HA resource to another node (restarts the service). WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_group_create` | Create an HA group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_group_update` | Update an HA group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ha_group_delete` | Delete an HA group. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_backup_create` | Create a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_backup_update` | Update a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_backup_delete` | Delete a vzdump backup job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_backup_run` | Backup one or more guests now. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_replication_create` | Create a replication job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_replication_update` | Update a replication job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_replication_delete` | Delete a replication job. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_replication_schedule_now` | Schedule a node replication job to start as soon as possible. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ceph_pool_create` | Create a Ceph pool. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_ceph_pool_delete` | PERMANENTLY destroy a Ceph pool and its data. WRITE OPERATION: triggers a mandatory approval prompt. |
| `pve_node_execute` | Special write tool (hand-written, not in CATALOG). |
| `pve_storage_upload` | Special write tool (hand-written, not in CATALOG). |


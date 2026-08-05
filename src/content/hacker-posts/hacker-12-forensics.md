---
slug: "hacker-12-forensics"
title: "[FORENSICS] 数字取证：在比特流中寻找真相"
date: "2025-08-09"
tags: ["forensics", "disk-analysis", "memory", "timeline", "ctf"]
summary: "> 删除不等于消失。深入磁盘取证、内存分析和时间线重建的技术细节，还原攻击现场。"
cover: ""
cover_ascii: ""
word_count: 0
---

# [FORENSICS] 数字取证：在比特流中寻找真相

```
┌─────────────────────────────────────────────────────────────┐
│  ███████╗ ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██╗ ██╗│
│  ██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║██╔╝│
│  █████╗  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║███████╗███╔╝ │
│  ██╔══╝  ██║   ██║██╔══██╗██╔══╝  ██║╚██╗██║╚════██║██╔██╗│
│  ██║     ╚██████╔╝██║  ██║███████╗██║ ╚████║███████║██║╚██╗│
│  ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═╝│
│                                                             │
│            "Every contact leaves a trace"                   │
│            — Dr. Edmond Locard                              │
└─────────────────────────────────────────────────────────────┘
```

## 1. 取证的基本原则

```
取证三原则 (ACPO Guidelines):
┌──────────────────────────────────────────────────────┐
│  1. 不得修改原始证据                                  │
│  2. 仅在具备相应能力时接触原始证据                     │
│  3. 必须记录所有操作并形成审计轨迹                     │
└──────────────────────────────────────────────────────┘

取证流程: 识别 → 保全 → 提取 → 分析 → 报告
```

## 2. 磁盘镜像与哈希校验

```bash
# 创建磁盘镜像 (dd/dcfldd)
sudo dcfldd if=/dev/sda of=/mnt/evidence/disk.img \
    hash=md5,sha256 hashlog=/mnt/evidence/hash.log bs=4M

# 验证镜像完整性
sha256sum -c hash.log
md5sum /dev/sda > original.md5
md5sum /mnt/evidence/disk.img > image.md5
diff original.md5 image.md5 && echo "Hash verified: OK"

# 只读挂载取证镜像
sudo mount -o ro,loop,noexec,noload /mnt/evidence/disk.img /mnt/analysis
```

## 3. 文件系统分析：删除不等于消失

```
文件删除时发生了什么:
┌──────────────────────────────────────────────────────┐
│  [EXT4]                                              │
│  ├─ inode 标记为未使用                                │
│  ├─ 数据块标记为 free，但数据仍存在                    │
│  └─ 直到被新数据覆写前，数据都可恢复                    │
│                                                      │
│  [NTFS]                                              │
│  ├─ $MFT 记录标记为 deleted                          │
│  ├─ $Bitmap 将对应簇标记为可用                        │
│  └─ $LogFile 和 $UsnJrnl 可能保留操作记录              │
└──────────────────────────────────────────────────────┘
```

```bash
# 文件恢复工具
# extundelete - EXT4 文件恢复
sudo extundelete /dev/sda1 --restore-all -o /mnt/recovery

# foremost - 基于文件头的雕刻恢复
foremost -t all -i disk.img -o /mnt/recovery

# testdisk - 分区表与文件恢复
sudo testdisk /dev/sda

# photorec - 按文件签名恢复
sudo photorec /d /mnt/recovery /dev/sda1
```

## 4. 内存取证：Volatility 实战

```
内存镜像获取:
├── Linux:  sudo dd if=/dev/fmem of=mem.dump bs=1M
├── Linux:  sudo LiME (推荐，内核模块)
├── Windows: win32dd / win64dd / DumpIt
└── VMware: .vmem 文件直接使用

Volatility 分析流程:
┌──────────────────────────────────────────────────────┐
│  1. imageinfo       → 识别操作系统 Profile            │
│  2. pslist / pstree  → 进程列表与进程树               │
│  3. netscan          → 网络连接状态                   │
│  4. cmdscan / consoles → 命令行历史                    │
│  5. malfind          → 检测隐藏/注入代码               │
│  6. filescan + dumpfiles → 提取内存中的文件            │
│  7. dump registry keys → 注册表分析 (Windows)         │
└──────────────────────────────────────────────────────┘
```

```bash
# Volatility 3 典型命令
vol -f memory.dump windows.info
vol -f memory.dump windows.pslist
vol -f memory.dump windows.netscan
vol -f memory.dump windows.malfind
vol -f memory.dump windows.cmdline
```

## 5. 时间线重建

```bash
# Linux: 从文件系统元数据提取时间线
fls -r -m / /mnt/evidence/disk.img > bodyfile.txt

# 从日志补充时间线
cat /var/log/auth.log >> timeline.txt
cat /var/log/syslog >> timeline.txt

# 使用 mactime 生成可读时间线
mactime -b bodyfile.txt -d -z UTC > timeline.csv

# 按时间排序分析
sort -t',' -k1 timeline.csv | less
```

```
时间戳类型 (MACB):
┌──────┬─────────────────────────────────────┐
│  m   │  Modified  - 内容修改时间            │
│  a   │  Accessed  - 最后访问时间            │
│  c   │  Changed   - 元数据修改时间           │
│  b   │  Birth     - 创建时间 (部分 FS 支持) │
└──────┴─────────────────────────────────────┘
```

---

```
[FORENSICS] 核心能力: 还原真相，而非相信表象
[FORENSICS] 关键工具: dd + Sleuth Kit + Volatility + Hashcat
[FORENSICS] 黄金法则: 永远在副本上工作，永远记录操作
```
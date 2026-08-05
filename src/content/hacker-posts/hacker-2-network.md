---
slug: "hacker-2-network"
title: "[NET] 深入理解 TCP/IP 协议栈"
date: "2025-06-20"
tags: ["network", "protocol", "tcp"]
summary: "> 从数据包到连接，逐层剖析互联网的基石协议。"
cover: ""
word_count: 0
---

# [NET] 深入理解 TCP/IP 协议栈

```
┌─────────────────────────────────────────┐
│          TCP/IP PROTOCOL STACK          │
│      "Packets don't lie, people do"     │
└─────────────────────────────────────────┘
```

## 四层模型

```
┌───────────────┐
│  Application  │  HTTP, DNS, SSH, SMTP
├───────────────┤
│   Transport   │  TCP, UDP
├───────────────┤
│   Internet    │  IP, ICMP, ARP
├───────────────┤
│  Link/Physical│  Ethernet, WiFi
└───────────────┘
```

## TCP 三次握手

```
Client                    Server
  │                         │
  │────── SYN (seq=x) ─────→│  Step 1
  │                         │
  │←── SYN+ACK (seq=y, ────│  Step 2
  │     ack=x+1)           │
  │                         │
  │────── ACK (ack=y+1) ──→│  Step 3
  │                         │
  │◄════ CONNECTION ═══════►│  ESTABLISHED
```

### 为什么是三次而不是两次？

两次握手的问题：
- 如果客户端的第一个 SYN 延迟到达，服务器会认为是一个新连接
- 两次握手无法可靠检测重复的 SYN 包
- 三次握手确保双方都确认了对方的序列号

## TCP 拥塞控制

### 慢启动

```
cwnd = 1 MSS
每次收到 ACK: cwnd += 1 MSS
每次 RTT: cwnd 翻倍
到达 ssthresh 后进入拥塞避免
```

### 拥塞避免

```
每次 RTT: cwnd += 1 MSS
检测到丢包: ssthresh = cwnd / 2, cwnd = 1 MSS
```

### 快速重传

```
收到 3 个重复 ACK → 立即重传丢失的包
cwnd = ssthresh + 3*MSS
进入快速恢复
```

## 常用诊断工具

```bash
# 查看网络连接
$ netstat -tulpn

# 跟踪路由
$ traceroute target.com

# 抓包分析
$ tcpdump -i eth0 -n 'port 443'

# DNS 查询
$ dig +short target.com A

# 测试端口连通性
$ nc -zv target.com 443
```

## Wireshark 实战技巧

```
过滤表达式：
- tcp.port == 443
- http.request.method == "GET"
- tcp.flags.syn == 1 && tcp.flags.ack == 0
- ip.src == 192.168.1.1
- dns.qry.name contains "example"
```

---

```
> 理解网络协议栈，才能真正理解互联网
> 每个数据包都在讲述一个故事
```
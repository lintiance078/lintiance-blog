---
slug: "hacker-3-shell"
title: "[SHELL] Bash 脚本编写的黑暗艺术"
date: "2025-06-10"
tags: ["shell", "bash", "automation"]
summary: "> 掌握 Shell 脚本的高级技巧，从管道魔法到信号处理。"
cover: ""
word_count: 0
---

# [SHELL] Bash 脚本编写的黑暗艺术

```
┌─────────────────────────────────────────┐
│            SHELL SCRIPTING              │
│     "With great power comes great       │
│      responsibility to write comments"  │
└─────────────────────────────────────────┘
```

## 管道魔法

### 基础管道

```bash
# 统计最常用的10个命令
history | awk '{print $2}' | sort | uniq -c | sort -rn | head -10

# 查找最大的5个文件
find . -type f -exec du -h {} + | sort -rh | head -5

# 实时监控日志中的错误
tail -f /var/log/syslog | grep --line-buffered "ERROR"
```

### 进程替换

```bash
# 比较两个命令的输出
diff <(ls dir1) <(ls dir2)

# 不用临时文件的排序
sort <(cat file1.txt) <(cat file2.txt)
```

## 信号处理

```bash
#!/bin/bash

cleanup() {
    echo "[!] 收到中断信号，清理中..."
    rm -f /tmp/lock.$$
    exit 1
}

trap cleanup SIGINT SIGTERM

# 主逻辑
echo "[+] 脚本运行中 (PID: $$)"
while true; do
    sleep 1
done
```

## 高级文本处理

### awk 实战

```bash
# 分析 Nginx 访问日志
awk '{
    count[$1]++
    total[$1] += $10
}
END {
    for (ip in count) {
        printf "%-15s %5d requests, %d bytes\n",
               ip, count[ip], total[ip]
    }
}' access.log | sort -k2 -rn | head -10
```

### sed 进阶

```bash
# 删除空白行和注释行
sed '/^$/d; /^#/d' config.conf

# 在多行之间插入
sed '/pattern/i\新行内容' file.txt

# 替换指定行范围
sed '10,20s/old/new/g' file.txt
```

## 并发与并行

```bash
# 并行处理文件
process_file() {
    echo "Processing: $1"
    sleep 2
    echo "Done: $1"
}

export -f process_file

# 使用 xargs 并行执行
find . -name "*.txt" | xargs -P 4 -I {} bash -c 'process_file "$@"' _ {}
```

## 安全编码实践

```bash
# ❌ 危险：命令注入
eval "echo $user_input"

# ✅ 安全：使用数组
args=("echo" "$user_input")
"${args[@]}"

# ❌ 危险：未引用的变量
rm -rf $dir/$file

# ✅ 安全：引用变量
rm -rf "${dir}/${file}"

# 始终使用 set -euo pipefail
set -euo pipefail
```

---

```
> Shell 脚本是系统管理员的瑞士军刀
> 但请记住：能力越大，责任越大
> 永远不要在生产环境测试未验证的脚本
```
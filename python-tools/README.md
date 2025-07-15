# Bitcoin Toolkit - Python Tools

这个目录包含了比特币工具包的Python工具集合。

## 📁 目录结构

```
python-tools/
├── data-downloader/          # 比特币数据分析工具
│   ├── btc_monthly_analysis.py      # 月度分析工具
│   ├── requirements.txt             # Python依赖
│   ├── README.md                    # 工具说明文档
│   └── bitcoin_data/                # 下载的数据文件
└── README.md                 # 本文件
```

## 🚀 快速开始

### 1. 进入数据下载工具目录

```bash
cd python-tools/data-downloader
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 运行分析工具

```bash
# 下载数据并计算月度平均价格
python3 btc_monthly_analysis.py
```

## 📊 工具功能

- **数据下载**: 下载比特币每日收盘价数据（从2013年开始）
- **月度分析**: 计算每月平均价格及相关统计
- **专业绘图**: 生成高分辨率的价格趋势图和分析图表
- **精简输出**: 生成简洁的CSV文件，易于Excel处理
- **核心功能**: 专注于最常用的分析需求

## 🔗 相关链接

- [月度分析工具说明](./data-downloader/README.md)
- [主项目 README](../README.md)

## 🛠️ 开发环境

- Python 3.7+
- 依赖库: yfinance, pandas

## 📝 许可证

与主项目保持一致 
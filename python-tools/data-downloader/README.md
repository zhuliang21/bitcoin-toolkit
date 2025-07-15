# 比特币月度分析工具

精简版比特币数据分析工具，专注于核心功能：

## 🎯 功能

1. **下载每日收盘价** - 从2013年开始的比特币收盘价数据
2. **计算月度平均价格** - 自动计算每月平均价格及相关统计
3. **生成专业图表** - 创建高分辨率的价格趋势图和分析图表

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 生成数据

```bash
python3 btc_monthly_analysis.py
```

### 3. 绘制图表

```bash
python3 btc_chart_plotter.py
```

### 🎯 一键运行（推荐）

```bash
python3 run_all.py
```

自动执行数据下载和图表生成的完整流程

## 📊 输出文件

### 数据文件
- `btc_monthly_averages.csv` - 月度平均价格数据

### 图表文件
- `btc_monthly_chart.png` - 价格趋势图（对数坐标）
- `btc_yearly_comparison.png` - 年度平均价格对比图
- `btc_growth_analysis.png` - 价格趋势与月度增长率分析图

## 📈 月度数据包含

- **Year_Month**: 年月 (格式: YYYY-MM)
- **Average_Price**: 月平均价格

## 💡 使用建议

1. 数据可以直接用Excel打开
2. 适合进行月度趋势分析
3. 文件小巧，易于管理 
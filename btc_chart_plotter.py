#!/usr/bin/env python3
"""
比特币月度价格图表绘制工具
读取月度数据并生成价格趋势图
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import os

# 设置中文字体和图表样式
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
plt.style.use('seaborn-v0_8')

class BitcoinChartPlotter:
    def __init__(self, data_dir="bitcoin_data"):
        self.data_dir = data_dir
        self.data_file = os.path.join(data_dir, "btc_monthly_averages.csv")
        
    def load_data(self):
        """加载月度数据"""
        try:
            if not os.path.exists(self.data_file):
                print(f"❌ 数据文件不存在: {self.data_file}")
                print("请先运行: python3 btc_monthly_analysis.py")
                return None
            
            data = pd.read_csv(self.data_file)
            
            # 转换日期格式
            data['Date'] = pd.to_datetime(data['Year_Month'] + '-01')
            
            print(f"✅ 成功加载数据: {len(data)} 个月")
            print(f"📊 数据范围: {data['Year_Month'].min()} 至 {data['Year_Month'].max()}")
            
            return data
            
        except Exception as e:
            print(f"❌ 加载数据失败: {str(e)}")
            return None
    
    def create_price_chart(self, data, save_path="btc_monthly_chart.png"):
        """创建价格趋势图"""
        try:
            # 创建图表
            fig, ax = plt.subplots(figsize=(15, 8))
            
            # 绘制折线图
            ax.plot(data['Date'], data['Average_Price'], 
                   linewidth=2, color='#f7931a', marker='o', markersize=3, 
                   label='月平均价格')
            
            # 设置标题和标签
            ax.set_title('比特币月度平均价格趋势 (2014-2025)', fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel('时间', fontsize=12)
            ax.set_ylabel('价格 (USD)', fontsize=12)
            
            # 格式化Y轴为货币格式
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
            
            # 设置X轴日期格式
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
            ax.xaxis.set_major_locator(mdates.MonthLocator(interval=12))  # 每年显示一次
            
            # 旋转X轴标签
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
            
            # 添加网格
            ax.grid(True, alpha=0.3)
            ax.legend(loc='upper left')
            
            # 添加一些关键点标注
            max_price = data['Average_Price'].max()
            min_price = data['Average_Price'].min()
            max_date = data[data['Average_Price'] == max_price]['Date'].iloc[0]
            min_date = data[data['Average_Price'] == min_price]['Date'].iloc[0]
            
            # 标注最高点和最低点
            ax.annotate(f'最高点\n${max_price:,.0f}', 
                       xy=(max_date, max_price), 
                       xytext=(max_date, max_price + max_price * 0.1),
                       arrowprops=dict(arrowstyle='->', color='red', lw=1.5),
                       fontsize=10, ha='center', color='red')
            
            ax.annotate(f'最低点\n${min_price:,.0f}', 
                       xy=(min_date, min_price), 
                       xytext=(min_date, min_price + max_price * 0.1),
                       arrowprops=dict(arrowstyle='->', color='blue', lw=1.5),
                       fontsize=10, ha='center', color='blue')
            
            # 使用对数坐标（可选）
            ax.set_yscale('log')
            
            # 调整布局
            plt.tight_layout()
            
            # 保存图表
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"✅ 图表已保存: {save_path}")
            
            # 显示图表
            plt.show()
            
            return True
            
        except Exception as e:
            print(f"❌ 创建图表失败: {str(e)}")
            return False
    
    def create_yearly_comparison(self, data, save_path="btc_yearly_comparison.png"):
        """创建年度对比图"""
        try:
            # 添加年份列
            data['Year'] = data['Date'].dt.year
            
            # 计算每年的平均价格
            yearly_avg = data.groupby('Year')['Average_Price'].mean().reset_index()
            
            # 创建年度对比图
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # 绘制柱状图
            bars = ax.bar(yearly_avg['Year'], yearly_avg['Average_Price'], 
                         color='#f7931a', alpha=0.7, edgecolor='black', linewidth=0.5)
            
            # 在柱子上添加数值标签
            for bar, value in zip(bars, yearly_avg['Average_Price']):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + height * 0.01,
                       f'${value:,.0f}', ha='center', va='bottom', fontsize=9)
            
            # 设置标题和标签
            ax.set_title('比特币年度平均价格对比', fontsize=16, fontweight='bold', pad=20)
            ax.set_xlabel('年份', fontsize=12)
            ax.set_ylabel('平均价格 (USD)', fontsize=12)
            
            # 格式化Y轴
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
            
            # 添加网格
            ax.grid(True, alpha=0.3, axis='y')
            
            # 调整布局
            plt.tight_layout()
            
            # 保存图表
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"✅ 年度对比图已保存: {save_path}")
            
            # 显示图表
            plt.show()
            
            return True
            
        except Exception as e:
            print(f"❌ 创建年度对比图失败: {str(e)}")
            return False
    
    def create_growth_analysis(self, data, save_path="btc_growth_analysis.png"):
        """创建增长分析图"""
        try:
            # 计算月度增长率
            data['Growth_Rate'] = data['Average_Price'].pct_change() * 100
            
            # 创建双Y轴图表
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(15, 10))
            
            # 上图：价格趋势
            ax1.plot(data['Date'], data['Average_Price'], 
                    linewidth=2, color='#f7931a', marker='o', markersize=3)
            ax1.set_title('比特币价格趋势与月度增长率', fontsize=16, fontweight='bold')
            ax1.set_ylabel('价格 (USD)', fontsize=12)
            ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
            ax1.set_yscale('log')
            ax1.grid(True, alpha=0.3)
            
            # 下图：增长率
            colors = ['green' if x > 0 else 'red' for x in data['Growth_Rate']]
            ax2.bar(data['Date'], data['Growth_Rate'], color=colors, alpha=0.6, width=20)
            ax2.set_ylabel('月度增长率 (%)', fontsize=12)
            ax2.set_xlabel('时间', fontsize=12)
            ax2.axhline(y=0, color='black', linestyle='-', alpha=0.3)
            ax2.grid(True, alpha=0.3)
            
            # 设置X轴格式
            for ax in [ax1, ax2]:
                ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
                ax.xaxis.set_major_locator(mdates.MonthLocator(interval=12))
                plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
            
            # 调整布局
            plt.tight_layout()
            
            # 保存图表
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"✅ 增长分析图已保存: {save_path}")
            
            # 显示图表
            plt.show()
            
            return True
            
        except Exception as e:
            print(f"❌ 创建增长分析图失败: {str(e)}")
            return False

def main():
    """主函数"""
    print("📊 比特币月度数据图表绘制工具")
    print("="*50)
    
    plotter = BitcoinChartPlotter()
    
    # 加载数据
    data = plotter.load_data()
    if data is None:
        return
    
    print(f"\n📈 开始绘制图表...")
    
    # 1. 绘制价格趋势图
    print("\n1. 绘制价格趋势图...")
    plotter.create_price_chart(data)
    
    # 2. 绘制年度对比图
    print("\n2. 绘制年度对比图...")
    plotter.create_yearly_comparison(data)
    
    # 3. 绘制增长分析图
    print("\n3. 绘制增长分析图...")
    plotter.create_growth_analysis(data)
    
    print("\n" + "="*50)
    print("✅ 所有图表绘制完成!")
    print("📁 生成的图表文件:")
    print("  - btc_monthly_chart.png (价格趋势图)")
    print("  - btc_yearly_comparison.png (年度对比图)")
    print("  - btc_growth_analysis.png (增长分析图)")
    print("💡 所有图表都已保存为高分辨率PNG文件")

if __name__ == "__main__":
    main() 
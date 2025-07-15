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
            
            # 使用对数坐标
            ax.set_yscale('log')
            
            # 调整布局
            plt.tight_layout()
            
            # 保存图表
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"✅ 图表已保存: {save_path}")
            
            # 关闭图表以释放内存
            plt.close()
            
            return True
            
        except Exception as e:
            print(f"❌ 创建图表失败: {str(e)}")
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
    
    # 绘制价格趋势图
    print("\n绘制价格趋势图...")
    plotter.create_price_chart(data)
    
    print("\n" + "="*50)
    print("✅ 图表绘制完成!")
    print("📁 生成的图表文件:")
    print("  - btc_monthly_chart.png (价格趋势图)")
    print("💡 图表已保存为高分辨率PNG文件")

if __name__ == "__main__":
    main() 
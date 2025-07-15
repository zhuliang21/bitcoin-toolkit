#!/usr/bin/env python3
"""
精简版比特币数据分析工具
功能：
1. 下载每日收盘价数据
2. 计算每月平均价格
3. 输出简洁的CSV文件
"""

import yfinance as yf
import pandas as pd
from datetime import datetime
import os

class BitcoinMonthlyAnalyzer:
    def __init__(self):
        self.data_dir = "bitcoin_data"
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def download_and_process_data(self, start_date="2013-01-01"):
        """下载数据并直接处理成月度平均"""
        print(f"📥 正在下载比特币数据并计算月度平均价格 (从 {start_date} 开始)...")
        
        try:
            # 下载BTC-USD数据
            btc = yf.Ticker("BTC-USD")
            data = btc.history(start=start_date)
            
            if data.empty:
                print("❌ 没有找到数据")
                return None
            
            # 只保留日期和收盘价
            daily_data = pd.DataFrame({
                'Date': data.index.date,
                'Close': data['Close'].values
            })
            
            print(f"📊 数据范围: {daily_data['Date'].min()} 至 {daily_data['Date'].max()}")
            print(f"📈 处理 {len(daily_data)} 条每日记录...")
            
            return daily_data
            
        except Exception as e:
            print(f"❌ 下载失败: {str(e)}")
            return None
    
    def calculate_monthly_averages(self, daily_data):
        """计算每月平均价格"""
        if daily_data is None:
            print("❌ 没有数据可处理")
            return None
        
        print("\n📊 正在计算每月平均价格...")
        
        try:
            # 转换日期格式
            daily_data = daily_data.copy()
            daily_data['Date'] = pd.to_datetime(daily_data['Date'])
            
            # 创建年月列用于分组
            daily_data['Year'] = daily_data['Date'].dt.year
            daily_data['Month'] = daily_data['Date'].dt.month
            daily_data['Year_Month'] = daily_data['Year'].astype(str) + '-' + daily_data['Month'].astype(str).str.zfill(2)
            
            # 按年月分组计算平均值
            monthly_data = daily_data.groupby('Year_Month').agg({
                'Close': 'mean'
            }).round(2)
            
            # 重新整理数据结构
            monthly_data.columns = ['Average_Price']
            monthly_data = monthly_data.reset_index()
            
            # 只保留Year_Month和Average_Price
            monthly_data = monthly_data[['Year_Month', 'Average_Price']]
            
            # 保存月度数据
            monthly_filename = f"{self.data_dir}/btc_monthly_averages.csv"
            monthly_data.to_csv(monthly_filename, index=False)
            
            print(f"✅ 月度数据保存到: {monthly_filename}")
            print(f"📊 总共 {len(monthly_data)} 个月的数据")
            
            # 显示最近几个月的数据
            print("\n📈 最近5个月的平均价格:")
            print(monthly_data.tail(5).to_string(index=False))
            
            return monthly_data
            
        except Exception as e:
            print(f"❌ 计算失败: {str(e)}")
            return None
    
    def show_price_summary(self, daily_data, monthly_data):
        """显示价格摘要"""
        if daily_data is None or monthly_data is None:
            return
        
        print("\n" + "="*50)
        print("📊 比特币价格摘要")
        print("="*50)
        
        # 当前价格
        current_price = daily_data['Close'].iloc[-1]
        print(f"💰 当前价格: ${current_price:,.2f}")
        
        # 历史极值
        all_time_high = daily_data['Close'].max()
        all_time_low = daily_data['Close'].min()
        print(f"🔺 历史最高价: ${all_time_high:,.2f}")
        print(f"🔻 历史最低价: ${all_time_low:,.2f}")
        
        # 月平均价格趋势
        latest_month_avg = monthly_data['Average_Price'].iloc[-1]
        previous_month_avg = monthly_data['Average_Price'].iloc[-2] if len(monthly_data) > 1 else latest_month_avg
        
        change_percent = ((latest_month_avg - previous_month_avg) / previous_month_avg) * 100
        print(f"📈 最近月平均: ${latest_month_avg:,.2f}")
        print(f"📊 环比变化: {change_percent:+.1f}%")
        
        # 年度表现
        if len(monthly_data) >= 12:
            current_year = datetime.now().year
            current_year_data = monthly_data[monthly_data['Year_Month'].str.startswith(str(current_year))]
            if not current_year_data.empty:
                year_avg = current_year_data['Average_Price'].mean()
                print(f"📅 {current_year}年平均价格: ${year_avg:,.2f}")
        
        # 显示最高和最低月平均价格
        highest_month_avg = monthly_data['Average_Price'].max()
        lowest_month_avg = monthly_data['Average_Price'].min()
        print(f"🔥 最高月平均: ${highest_month_avg:,.2f}")
        print(f"❄️ 最低月平均: ${lowest_month_avg:,.2f}")

def main():
    """主函数"""
    print("🚀 比特币月度分析工具")
    print("="*50)
    
    analyzer = BitcoinMonthlyAnalyzer()
    
    # 1. 下载数据并处理
    daily_data = analyzer.download_and_process_data()
    if daily_data is None:
        return
    
    # 2. 计算每月平均价格
    monthly_data = analyzer.calculate_monthly_averages(daily_data)
    if monthly_data is None:
        return
    
    # 3. 显示摘要
    analyzer.show_price_summary(daily_data, monthly_data)
    
    print("\n" + "="*50)
    print("✅ 分析完成!")
    print("📁 数据文件:")
    print("  - btc_monthly_averages.csv (月度平均价格)")
    print("💡 可以用Excel打开文件进行进一步分析")

if __name__ == "__main__":
    main() 
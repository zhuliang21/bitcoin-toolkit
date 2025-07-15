#!/usr/bin/env python3
"""
一键运行脚本
自动执行数据下载和图表生成
"""

import subprocess
import sys
import os

def run_script(script_name, description):
    """运行Python脚本"""
    print(f"\n🚀 {description}")
    print("=" * 50)
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=False, 
                              text=True, 
                              check=True)
        print(f"✅ {description} 完成!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} 失败!")
        print(f"错误: {e}")
        return False
    except FileNotFoundError:
        print(f"❌ 脚本文件不存在: {script_name}")
        return False

def main():
    """主函数"""
    print("🔧 比特币数据分析一键运行工具")
    print("=" * 50)
    
    # 检查当前目录
    required_files = ["btc_monthly_analysis.py", "btc_chart_plotter.py"]
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
        print("请确保您在正确的目录中运行此脚本")
        return
    
    # 步骤1: 下载数据并计算月度平均价格
    success1 = run_script("btc_monthly_analysis.py", "下载数据并计算月度平均价格")
    
    if not success1:
        print("\n❌ 数据下载失败，停止执行")
        return
    
    # 步骤2: 生成图表
    success2 = run_script("btc_chart_plotter.py", "生成比特币价格图表")
    
    if not success2:
        print("\n❌ 图表生成失败")
        return
    
    # 显示结果
    print("\n" + "=" * 50)
    print("🎉 所有任务完成!")
    print("=" * 50)
    
    print("\n📁 生成的文件:")
    print("📊 数据文件:")
    print("  - bitcoin_data/btc_monthly_averages.csv")
    
    print("\n📈 图表文件:")
    chart_file = "btc_monthly_chart.png"
    
    if os.path.exists(chart_file):
        file_size = os.path.getsize(chart_file) / 1024  # KB
        print(f"  - {chart_file} ({file_size:.1f} KB)")
    
    print("\n💡 提示:")
    print("  - 图表是高分辨率PNG格式")
    print("  - 可以直接在图片查看器中查看")
    print("  - 适合用于报告和演示")

if __name__ == "__main__":
    main() 
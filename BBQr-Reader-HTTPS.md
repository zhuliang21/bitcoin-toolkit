# BBQr Reader - HTTPS服务器使用指南

## 快速启动

### 1. 启动HTTPS服务器
```bash
node simple-https-server.js
```

### 2. 移动设备访问
在iPhone Safari中访问：
```
https://192.168.8.157:9443/bbqr-reader.html
```

### 3. 证书警告处理
1. 看到安全警告时，点击"高级"或"Advanced"
2. 点击"继续前往 192.168.8.157 (不安全)"或"Proceed to 192.168.8.157 (unsafe)"
3. 页面加载完成，摄像头功能可用

## 文件说明

### 核心文件
- `bbqr-reader.html` - BBQr扫描页面（移动端优化）
- `simple-https-server.js` - 简单HTTPS服务器（端口9443）
- `src/bbqr-reader.js` - BBQr扫描逻辑和移动端优化
- `key.pem`, `cert.pem` - 自签名SSL证书

### 功能特性
- 📱 移动端响应式设计
- 📷 自动QR码扫描（支持BBQr多帧）
- 🔄 iOS兼容性优化（避免IndexSizeError）
- 👆 手动点击扫描模式（自动降级）
- 🐛 移动调试系统（浮动按钮）
- 📋 完整调试报告复制功能
- 🔍 多种QR码格式支持（URL/Bitcoin/WiFi等）

### 移动端特殊处理
- iOS Safari中的Html5Qrcode库兼容性问题自动处理
- IndexSizeError自动检测和计数
- 超过阈值时自动切换到手动扫描模式
- BarcodeDetector API回退支持

## 开发命令

```bash
# 构建项目
npm run build

# 启动HTTPS服务器
node simple-https-server.js

# 检查服务器状态
lsof -i :9443
```

## 网络配置

确保iPhone和Mac连接到同一WiFi网络。服务器会自动绑定到本地IP地址：
- localhost: `https://localhost:9443/bbqr-reader.html`
- 移动设备: `https://192.168.8.157:9443/bbqr-reader.html`

## 故障排除

1. **端口占用**: 如果9443端口被占用，修改`simple-https-server.js`中的端口号
2. **证书问题**: 删除`key.pem`和`cert.pem`，重启服务器会重新生成
3. **网络连接**: 确保防火墙允许9443端口访问
4. **iOS缓存**: 清除Safari缓存或使用隐私浏览模式

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **QR扫描**: Html5Qrcode库 + BarcodeDetector API回退
- **BBQr解码**: 支持多种编码格式（Hex, Base32, Zlib）
- **构建工具**: Webpack 5
- **服务器**: Node.js HTTPS (自签名证书) 
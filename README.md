# V2Milk
V2Ray 跨平台定制客户端

## Readme in English: [Readme.md](https://github.com/Zzm317/V2Milk/blob/master/READMEEN.md)

# 编写进度
* ~~MacOS部分~~(已完成)
* ~Windows部分~(已完成)
* Linux部分
* 自定义节点
* 二维码显示
* ~~PAC重启~~(已完成)

# 功能
* 对接[V2RaySocks](https://github.com/Zzm317/v2raysocks)
* 连接V2Ray(PAC|全局)
* 免重启更新PAC
* 多语言支持
* 跨平台支持(MacOS|Windows|Linux)

# 特点
* 使用Electron编写
* 完全开源，真实的开源，你不止能下载到README.md
* 可完全对接V2raySocks插件
* UI美观
* 遵循GPL-3.0协议

# 使用方式
* 修改 APP/src/main/config.js 里面的对应项目！
* 自行编译不同版本

# 使用截图
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/1.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/2.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/3.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/4.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/5.jpg)

# 安装方法
```
git clone https://github.com/Zzm317/V2Milk.git
cd V2Milk
cd APP
npm install
```

# 测试方法
* 开发模式(MacOS/Linux) ```npm run dev```
* 普通模式(MacOS/Linux) ```npm run start```
* 开发模式(Windows) ```npm run devw```
* 普通模式(Windows) ```npm run startw```

# 编译方式
* 将最新的 [V2Ray-Core](https://github.com/v2ray/v2ray-core/releases) 放入 APP/extra/v2ray-core 的对应目录下
* Mac ```npm run packageMac```
* Win ```npm run packageWin```

# 其他
* ETH钱包 0xaD8ABb15e4B8B58f5FbEE9CAb42096c1d640C234
* 链克钱包 0x4cfa7215324f2cc521beeb35c8a85c9afdbcda7e
* <a href='https://ko-fi.com/U7U7K54E' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi4.png?v=f' border='0' alt='Buy Me a Coffee' /></a>

# 更新日志
* 0.0.3 修正少量bug，优化UI，加入系统休眠监控，加入CSP
* 0.0.2 加入多语言支持，优化UI和用户体验
* 0.0.1 主体框架完成
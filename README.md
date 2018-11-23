# V2Milk
V2Ray 跨平台定制客户端(For V2RaySocks)

### Readme in English: [Readme.md](https://github.com/Zzm317/V2Milk/blob/master/READMEEN.md)

* 注意，0.1.0使用的打包器从electron-packager改成了electron-builder，请注意看 安装方法 安装，不然将报错！！！！！
* Windows下的用户不能将本项目和成品放在任何包含**中文**和**空格**的目录下，请不要为此提issue，我也不会去管这个问题

# 编写进度
* ~~MacOS部分~~(已完成)
* ~Windows部分~(已完成)
* Linux部分(已完成但尚未测试)
* ~~自定义订阅~~(已完成)
* ~~PAC重启~~(已完成)

# 功能
* 对接[V2RaySocks](https://github.com/Zzm317/v2raysocks)
* 连接V2Ray(PAC|全局)
* 免重启更新PAC
* 多语言支持
* 跨平台支持(MacOS|Windows|Linux)

# 特点
* 使用Electron编写
* 完全开源，真实的开源，你不止能下载到README.md，还能看见真实的业务处理逻辑
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
npm install -g electron-builder
```

# 测试方法
* 开发模式(Macos/Linux)   ```npm run dev```
* 普通模式(Macos/Linux)   ```npm run start```
* 开发模式(Windows)       ```npm run devw```
* 普通模式(Windows)       ```npm run startw```

# 编译方式
* 将最新的 [V2Ray-Core](https://github.com/v2ray/v2ray-core/releases) 放入 APP/extra/v2ray-core 的对应目录下
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/6.jpg)
* Mac安装包
	```npm run dist:mac```

* Windows安装包
	```npm run dist:win32```
	```npm run dist:win64```

* Linux安装包
	```npm run dist:linux32```
	```npm run dist:linux64```

* 生成的文件在dist目录中

# 其他
* ETH钱包 0xaD8ABb15e4B8B58f5FbEE9CAb42096c1d640C234
* 链克钱包 0x4cfa7215324f2cc521beeb35c8a85c9afdbcda7e
* <a href='https://ko-fi.com/U7U7K54E' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi4.png?v=f' border='0' alt='Buy Me a Coffee' /></a>

# 更新日志
* 0.1.1 修正日志
* 0.1.0 项目开发完成，移除不必要的二维码支持和自定义节点支持并转向V2rayM的开发，并修复大量bug和添加功能
* 0.0.6 少量Bug修复，UI优化，修改alert弹窗为toast
* 0.0.5 修正3.46带来的启动问题，优化订阅
* 0.0.4 加入了自定义节点部分的订阅支持(V = 2)
* 0.0.3 修正少量bug，优化UI，加入系统休眠监控
* 0.0.2 加入多语言支持，优化UI和用户体验
* 0.0.1 主体框架完成

# 后记
* 开源不代表你可以拿去盈利，也不代表你可以堂而皇之的加上你的加群链接
* 我不特地说是谁了，自己好自为之，没技术不是你随意加其他东西的理由
* 本项目唯一TG讨论组 [开发，不存在的](https://t.me/V2rayIsNotGreat)

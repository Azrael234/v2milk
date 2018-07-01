# V2Milk
V2Ray 定制客户端 For Mac

# 编写中
* 编写还在进程中。。。

# 特点
* 使用Electron编写
* 完全开源，真实的开源，你不止能下载到README.md
* 可对接V2raySocks插件

# 使用方式
* 请修改 APP/src/main/config.js 里面的对应项目！

# 使用截图

![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/1.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/2.jpg)

# 编译方式
```
electron-packager . V2Milk --win --out App --arch=x64 --overwrite --app-version=0.2 --asar --ignore=extra/ --extra-resource=extra/
```
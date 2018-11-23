# V2Milk
V2Ray Cross-Platform Client(For V2raySocks)

### 中文: [Readme.md](https://github.com/Zzm317/V2Milk/blob/master/README.md)

* Important: the compile tool has changed to electron-builder in ver 0.1.0, so do not forget to install that. More infos in Installation.
* To Windows users: This project should put and run in pathes with no spaces, and I will not fix this.

# In Progress
* ~~V2Ray for MacOS~~(Done)
* ~V2Ray for Windows~(Done)
* V2Ray for Linux(Not tested)
* ~~Custom Subscribe~~(Done)
* ~~PAC Actions~~(Done)

# Features
* Works fine with [V2RaySocks](https://github.com/Zzm317/v2raysocks)
* Connect V2Ray(PAC|Global)
* Edit PAC without restart the software
* Multi-Lang support 
* Cross-Platform support(MacOS|Windows|Linux)
* Uses Electron
* Open-Source under GPLV3
* Awesome UI

# Usage
* Edit APP/src/main/config.js before you use it!
* No release will be provided!

# Screenshots
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/1.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/2.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/3.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/4.jpg)
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/5.jpg)

# Installation
```
git clone https://github.com/Zzm317/V2Milk.git
cd V2Milk
cd APP
npm install
npm install -g electron-builder
```

# Testing
* Dev Mode      (Macos/Linux)     ```npm run dev```
* Normal Mode   (Macos/Linux)     ```npm run start```
* Dev Mode      (Windows)         ```npm run devw```
* Normal Mode   (Windows)         ```npm run startw```

# Compile
* Put the [V2Ray-Core](https://github.com/v2ray/v2ray-core/releases) to APP/extra/v2ray-core
![](https://raw.githubusercontent.com/Zzm317/V2Milk/master/images/6.jpg)
* For Mac
	```npm run dist:mac```

* For Windows
	```npm run dist:win32```
	```npm run dist:win64```

* For Linux
	```npm run dist:linux32```
	```npm run dist:linux64```


# Others
* ETH Wallet 0xaD8ABb15e4B8B58f5FbEE9CAb42096c1d640C234
* <a href='https://ko-fi.com/U7U7K54E' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi4.png?v=f' border='0' alt='Buy Me a Coffee' /></a>

# Update Log
* 0.1.1 Fix the bug caused by space in the path
* 0.1.0 Project done, Bug fixed.
* 0.0.6 Bug fix, UI Improvements, Changed Alert() to Toasts
* 0.0.5 Fixed 3.46, improved subscribe
* 0.0.4 Added support for Subscribe(V = 2)
* 0.0.3 Bug fix, UI Improvements, Added power monitor, added CSP
* 0.0.2 Added support for multi-language, Improved UI
* 0.0.1 Main frame done

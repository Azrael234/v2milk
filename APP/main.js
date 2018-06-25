const {app, BrowserWindow} = require('electron')
const ipc = require('electron').ipcMain;
const cps = require('child_process');
const fs = require("fs");
const path = require('path');
const http = require('http');
let mainWindow
let v2rayserver
let ProxyOutput

const appConfigDir = app.getPath('userData')
const macToolPath = path.resolve(appConfigDir, 'proxy_conf_helper')
let __libname = path.dirname(__dirname)
let PACServer = null
let development = false
if (development) {
    __libname = __dirname
}
var sockets = [];

const PacPort = "7777"

function createWindow () {
	mainWindow = new BrowserWindow(
		{
			width: 400,
			height: 550,
			resizable: false,
			maximizable: false,
			skipTaskbar: true,
			icon: "assets/favicon.ico"
		}
	)
	mainWindow.loadFile('login.html')

	//mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
	app.quit()
})

app.on('activate', function () {
	if (mainWindow === null) {
		createWindow()
	}
})

ipc.on('select-plan',function(event, message) {
    mainWindow.loadFile('selectplan.html')
    mainWindow.webContents.on('did-finish-load', function(){
       mainWindow.webContents.send('dataJsonPort', message);
    });
})

ipc.on('select-node',function(event, message) {
    mainWindow.loadFile('selectnode.html')
    mainWindow.webContents.on('did-finish-load', function(){
       mainWindow.webContents.send('dataJsonNode', message);
    });
})

ipc.on('quit-login',function() {
	mainWindow.loadFile('login.html')
})

console.log(app.getPath('appData'));

ipc.on('write-json',function(event, message) {
    fs.writeFile(app.getPath('appData') + "/V2Milk/config.json",message,{flag:'w',encoding:'utf-8',mode:'0666'},function(err){
		if(err){
			event.sender.send("V2Ray-log", "配置文件写入失败！")
		}else{
			event.sender.send("V2Ray-log", "配置文件写入成功！")
		}
	})
})

ipc.on('start-v2ray',function(event, arg) {
	event.sender.send("V2Ray-log", "加载模式:" + arg)
    setProxy(arg)
    v2rayserver = cps.execFile(path.join(__libname, 'extra/v2ray-core/v2ray'), ['-config', app.getPath('appData') + "/V2Milk/config.json"]);
	v2rayserver.stdout.on('data', (data) => {
		if(data.indexOf("Failed to start App|Proxyman|Inbound: failed to listen TCP on") > -1 ){
			event.sender.send("V2Ray-status", JSON.stringify({"status":"error","message":"V2Ray异常关闭，请检查1081端口是否被占用！"}))
		}else if(data.indexOf("failed to load config:") > -1 ){
			event.sender.send("V2Ray-status", JSON.stringify({"status":"error","message":"生成V2Ray配置文件异常，请检查文件权限"}))
		}
		event.sender.send("V2Ray-log", data)
	});

	v2rayserver.stderr.on('data', (data) => {
		event.sender.send("V2Ray-log", data)
	});

	v2rayserver.on('close', (code) => {
		switch(code){
			case null:
				event.sender.send("V2Ray-status", JSON.stringify({'status':'success','message':'V2Ray已关闭'}))
				break
			case "0":
				event.sender.send("V2Ray-status", JSON.stringify({'status':'success','message':'V2Ray已关闭'}))
				break
		}
		if(PACServer !== null){
			closeServer()
		}
	});

	v2rayserver.on('exit', (code) => {
		event.sender.send("V2Ray-log", "退出码：" + code)
	});
})

ipc.on('stop-v2ray',function() {
    if(v2rayserver != null){
    	setProxy("OFF")
    	v2rayserver.kill('SIGHUP')
    }
})

function StartPacHttpServer(){
	PACServer = http.createServer();

	PACServer.on('request', (request, response) => {
	    if (request.url == '/pac') {
			var pacfile = fs.readFileSync(path.join(__libname, 'extra/v2ray-core/pac/pac.txt'))
			response.writeHead(200,{"content-type":"text/plain","connection":"close","transfer-encoding":"identity"});
			response.end(pacfile);
		}else{
			response.writeHead(404)
			response.end("404")
		}
	});

	PACServer.listen(parseInt(PacPort), '127.0.0.1');

	PACServer.on('listening', () => {
	});

	PACServer.on("connection",function(socket){
		sockets.push(socket);
		socket.once("close",function(){
			sockets.splice(sockets.indexOf(socket),1);
		});
	});

	PACServer.on('error', (data) => {
		mainWindow.webContents.send("V2Ray-log",`PAC服务器错误: ${data}`)
	});

	mainWindow.webContents.send("V2Ray-log","PAC服务器已开启!")
}

function closeServer(){
	sockets.forEach(function(socket){
		socket.destroy();
	});
	PACServer.close(function(){
		mainWindow.webContents.send("V2Ray-log","PAC服务器已关闭!")
	})
	PACServer = null
}
//cps.exec('networksetup -setautoproxyurl Wi-Fi ' + urll + '&&networksetup -setautoproxyurl Ethernet ' + urll + '&&networksetup -setautoproxyurl "Thunderbolt Bridge" ' + urll + '&&networksetup -setautoproxystate Wi-Fi on', {encoding: "utf-8"})
			
function setProxy(mode){
	switch(mode){
		case "PAC":
			StartPacHttpServer()
			var urll = "http://127.0.0.1:" + parseInt(PacPort) + "/pac"
			cps.exec('networksetup -setautoproxyurl Wi-Fi ' + urll + '&&networksetup -setautoproxyurl Ethernet ' + urll + '&&networksetup -setautoproxyurl "Thunderbolt Bridge" ' + urll + '&&networksetup -setautoproxystate Wi-Fi on', {encoding: "utf-8"})
			break
		case "GLOBAL":
			cps.exec('networksetup -setsocksfirewallproxy Wi-Fi 127.0.0.1 1081&&networksetup -setsocksfirewallproxy Ethernet 127.0.0.1 1081&&networksetup -setsocksfirewallproxy "Thunderbolt Bridge" 127.0.0.1 1081&&networksetup -setsocksfirewallproxystate Wi-Fi on', {encoding: "utf-8"})
			break
		case "OFF":
			cps.exec('networksetup -setsocksfirewallproxystate Wi-Fi off&&networksetup -setsocksfirewallproxystate Ethernet off&&networksetup -setsocksfirewallproxystate "Thunderbolt Bridge" off', {encoding: "utf-8"})
			cps.exec('networksetup -setautoproxystate Wi-Fi off&&networksetup -setautoproxystate Ethernet off&&networksetup -setautoproxystate "Thunderbolt Bridge" off', {encoding: "utf-8"})
			if(PACServer !== null){
				closeServer()
			}
			break
	}
}

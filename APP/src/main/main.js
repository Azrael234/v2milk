require('./config.js')
const {app, BrowserWindow} = require('electron')
const {shell} = require('electron')
const ipc = require('electron').ipcMain;
const cps = require('child_process');
const fs = require("fs");
const path = require('path');
const http = require('http');
var request = require('request');
var qs = require('querystring'); 
var PHP = require('./PHP.js')
const Store = require('electron-store');
const store = new Store();

let mainWindow
let v2rayserver
let ProxyOutput

const appConfigDir = app.getPath('userData')
const macToolPath = path.resolve(appConfigDir, 'proxy_conf_helper')
let PACServer = null
var sockets = [];

const pacPort = "7777"

function createWindow () {
	mainWindow = new BrowserWindow(
		{
			width: 900,
			height: 650,
			resizable: false,
			maximizable: false,
			skipTaskbar: false,
			icon: "assets/favicon.icns"
		}
	)
	mainWindow.loadFile('index.html')

	mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null
	})
}

app.on('ready', createWindow)

ipc.on('onClickControl',function(event, element, data) {
	switch(element){
		case "getSavedData":
			getSavedData()
			break
		case "login":
			var loginAction = {
	            "actions" : [
	            	"v-pills-5|set|tab-pane animated fadeInUpShort go show active",
	                "v-pills-1|set|tab-pane animated fadeInUpShort go",
	                "v-pills-2|set|tab-pane animated fadeInUpShort go",
	                "v-pills-3|set|tab-pane animated fadeInUpShort go",
	                "v-pills-4|set|tab-pane animated fadeInUpShort go",
	            	"v-pills-1-tab|set|nav-link",
	                "v-pills-2-tab|set|nav-link",
	                "v-pills-3-tab|set|nav-link",
	                "v-pills-4-tab|set|nav-link"
	            ]
	        }
			event.sender.send("onMainFrameChange", JSON.stringify(loginAction))
			break
		case "onlogin":
	        var dataa = {'data': PHP.uc_authcode(data, "ENCODE", ucKey)}
	        var content = qs.stringify(dataa);
	        sendRequest(event, content, data)
			break
		case "register":
			shell.openExternal(global.RegisterPath)
			break
		case "onV2RayConnect":
			console.log(data)
			break
		default:
			console.log("非法访问")
			break
	}
})
  
function sendRequest(event, content, upa){
	var request = require('request');
	request(global.APIPath + "?" + content, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			processData(event, body, upa)
		}
	})
}

function processData(event, data, upa){
	data = PHP.uc_authcode(PHP.licenseDecodePart(data, licKey), "DECODE", ucKey)
	try{
        var dataa = JSON.parse(data);
        if(dataa.result == "success"){
            if(dataa.package.length == 0){
            	event.sender.send("onMainCall", '您还没有套餐偶，请先去购买～')
            }else{
                saveData(upa)
                var loginAction = {
		            "actions" : [
		            	"v-pills-5|set|tab-pane animated fadeInUpShort go",
		                "v-pills-1|set|tab-pane animated fadeInUpShort go show active",
		                "v-pills-2|set|tab-pane animated fadeInUpShort go",
		                "v-pills-3|set|tab-pane animated fadeInUpShort go",
		                "v-pills-4|set|tab-pane animated fadeInUpShort go",
		            	"v-pills-1-tab|set|nav-link active",
		                "v-pills-2-tab|set|nav-link",
		                "v-pills-3-tab|set|nav-link",
		                "v-pills-4-tab|set|nav-link"
		            ]
		        }
				event.sender.send("onMainFrameChange", JSON.stringify(loginAction))
                event.sender.send('onMainCallExec', 'processLoginData', data)
            }
        }else if(dataa.result == "error"){
        	switch(dataa.message){
        		case "Illegal Data":
            		event.sender.send("onMainCall", '信息错误！')
        			break
        		case "Email or Password Invalid":
            		event.sender.send("onMainCall", '用户名或密码错误！')
        			break
        		default:
            		event.sender.send("onMainCall", '未知错误，请重试！')
        			break
        	}
        }
    }catch(ex){
    	event.sender.send("onMainCall", 'Error:' + ex)
    }
}

function saveData(upa){
    var data = PHP.uc_authcode(upa, "ENCODE", global.ucKey)
    store.set('UserKey', data)
}

function getSavedData(){
    var UserKey = store.get('UserKey')
    try{
    	var data = PHP.uc_authcode(UserKey, "DECODE", global.ucKey)
        var dataa = JSON.parse(data);
        if(dataa.email !== null && dataa.password !== null){
        	var saveAction = {
	            "actions" : [
	            	"emailF|value|" + dataa.email,
	                "passwordF|value|" + dataa.password
	            ]
	        }
        	mainWindow.webContents.send("onMainFrameChange", JSON.stringify(saveAction))
        	console.log('解析存储密钥成功！')
        }
    }catch(ex){
        console.log('解析存储密钥失败，请重新输入！' + ex)
    }
}



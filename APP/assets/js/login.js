'use strict';

const remote = require('electron').remote
const {shell} = require('electron')
require('./config.js')
var PHP = require('./PHP.js')
var request = require('request');
var qs = require('querystring'); 
const ipc = require('electron').ipcRenderer;
const currentWindow = remote.getCurrentWindow();
const Store = require('electron-store');
const store = new Store();

const btnregister = document.getElementById('btn-register')
const btnsubmit = document.getElementById('btn-submit')
const btnclose = document.getElementById('btn-close')
const rememberme = document.getElementById('rememberme')

btnregister.addEventListener('click', () => {
	shell.openExternal(global.RegisterPath)
})

btnclose.addEventListener('click', () => {
    currentWindow.close()
})

btnsubmit.addEventListener('click', () => {
    btnsubmit.disabled = true
	var uuu = document.getElementById('inputEmail').value
	var ppp = document.getElementById('inputPassword').value
	if(uuu == "" || ppp == ""){
		alert('请输入用户名和密码')
	}else{
		var upa = '{"email":"' + uuu + '","password":"' + ppp + '"}'
		var data = {'data': PHP.uc_authcode(upa, "ENCODE", ucKey)}
		var content = qs.stringify(data);
		sendRequest(content)
	}
})

getSavedData()
  
function sendRequest(content){
	var request = require('request');
	request(global.APIPath + "?" + content, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			processData(body)
		}
	})
}

function processData(data){
	data = PHP.uc_authcode(PHP.licenseDecodePart(data, licKey), "DECODE", ucKey)
	try{
        var dataa = JSON.parse(data);
        if(dataa.result == "success"){
            if(dataa.package.length == 0){
                alert('您还没有套餐偶，请先去购买～') 
            }else{
                if(rememberme.checked){
                    saveData(document.getElementById('inputEmail').value, document.getElementById('inputPassword').value)
                }
                ipc.send('select-plan', data)
            }
        }else if(dataa.result == "error"){
        	switch(dataa.message){
        		case "Illegal Data":
        			alert('信息错误！')
        			break
        		case "Email or Password Invalid":
        			alert('用户名或密码错误！')
        			break
        		default:
        			alert('未知错误，请重试！')
        			break
        	}
        }
    }catch(ex){
    	alert('Error:' + ex)
    }
    btnsubmit.disabled = false
}

function saveData(uuu, ppp){
    var saveArray = '{"email":"' + uuu + '","password":"' + ppp + '"}'
    var data = PHP.uc_authcode(saveArray, "ENCODE", ucKey)
    store.set('UserKey', data)
}

function getSavedData(){
    var UserKey = store.get('UserKey')
    var data = PHP.uc_authcode(UserKey, "DECODE", ucKey)
    try{
        var dataa = JSON.parse(data);
        if(dataa.email !== null && dataa.password !== null){
            document.getElementById('inputEmail').value = dataa.email
            document.getElementById('inputPassword').value = dataa.password
            rememberme.checked = true
        }
    }catch(ex){
        alert('解析存储密钥失败，请重新输入！')
    }
}
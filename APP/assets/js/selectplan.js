'use strict';

const remote = require('electron').remote
const ipc = require('electron').ipcRenderer;
const BrowserWindow = require('electron').remote.BrowserWindow;
const currentWindow = remote.getCurrentWindow();

const inputPlan = document.getElementById('inputPlan')
const btnquit = document.getElementById('btn-quit')
const btnsubmitplan = document.getElementById('btn-submit-plan')

btnquit.addEventListener('click', () => {
    currentWindow.close()
})

btnsubmitplan.addEventListener('click', () => {
    ipc.send('select-node', global.package[inputPlan.selectedIndex])
})

ipc.on('dataJsonPort', function(event, message) {
    try{
        var dataa = JSON.parse(message);
        if(dataa.result == "success"){
            global.package = dataa.package
            for (var i = 0; i < dataa.package.length; i++) {
                inputPlan.options.add((new Option(dataa.package[i]['package'],i)));
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
            ipc.send('quit-login')
        }
    }catch(ex){
        //alert('Error:' + ex)
    }
});
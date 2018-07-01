'use strict';

const remote = require('electron').remote
const {shell} = require('electron')

const ipc = require('electron').ipcRenderer;
const currentWindow = remote.getCurrentWindow();
const milksubmit = document.getElementById('V2Milk-submit')
var PHP = require('./PHP.js')

milksubmit.addEventListener('click', () => {
    var uuu = document.getElementById('emailF').value
    var ppp = document.getElementById('passwordF').value
    if(uuu == "" || ppp == ""){
        alert('请输入用户名和密码')
    }else{
        var upa = '{"email":"' + uuu + '","password":"' + ppp + '"}'
        ipc.send('onClickControl', 'onlogin', upa)
    }
})

ipc.on("onMainCall", function(event, message) {
    alert(message)
});

ipc.on("onMainCallExec", function(event, action, message) {
    switch(action){
        case 'processLoginData':
            afterLoginExec(message)
            loadPackages(message)
            break
        default:
            console.log("非法访问")
            break
    }
});

ipc.on("onMainFrameChange", function(event, message) {
    var data = JSON.parse(message);
    if(data.actions !== false){
        for (var i = 0; i < data.actions.length; i++) {
            var action = data.actions[i].split("|")
            switch(action[1]){
                case "add":
                    document.getElementById(action[0]).addAttribute("class", action[2])
                    break
                case "remove":
                    document.getElementById(action[0]).removeAttribute("class", action[2])
                    break
                case "set":
                    document.getElementById(action[0]).setAttribute("class", action[2])
                    break
                case "value":
                    document.getElementById(action[0]).value = action[2]
                    break
                default:
                    console.log("非法访问")
                    break
            }
        }
    }
});

function afterLoginExec(message){
    try{
        message = JSON.parse(message)
        document.getElementById('usernameF').innerHTML = message['name']
        if(message['email'].indexOf('qq.com') > 0){
            document.getElementById('userImageF').setAttribute("src","http://q1.qlogo.cn/g?b=qq&nk=" + message['email'].replace("@qq.com","") + "&s=100")
        }else{
            document.getElementById('userImageF').setAttribute("src","http://cn.gravatar.com/avatar/" + PHP.md5(message['email']) + "?s=64")
        }
        document.getElementById('useronlineT').setAttribute("class", "icon-circle text-success blink")
        document.getElementById('useronlineF').innerHTML = "Online"
        document.getElementById('loginButtonF').remove()
        document.getElementById('registerButtonF').remove()
    }catch(ex){
        console.log('afterLoginExec' + ex)
    }
}

function loadPackages(message){
    try{
        message = JSON.parse(message)
        var packages = message['package']
        for (var i = 0; i < packages.length; i++) {
            loadPackage(packages[i])
        }
    }catch(ex){
        console.log('loadPackages' + ex)
    }
}

function loadPackage(mpackage){
    var routeList = document.getElementById('routePackages')
    var tr = document.createElement("tr")
    var td = document.createElement("td")
    td.innerHTML = mpackage.package
    tr.appendChild(td)
    var td = document.createElement("td")
    td.innerHTML = ''
    tr.appendChild(td)
    var td = document.createElement("td")
    td.innerHTML = ''
    tr.appendChild(td)
    routeList.appendChild(tr)
    for (var i = 0; i < mpackage.nodes.length; i++) {
        var nodename = mpackage.nodes[i].split("|")
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        td.innerHTML = nodename[0]
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = '<button type="button" class="btn btn-primary btn-xs" onclick="onClickControl(' + "'register','null'" + ')">二维码</button>'
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = '<button type="button" class="btn btn-success btn-xs" onclick="onClickControl(' + "'onV2RayConnect','" + mpackage.uuid + "|" + mpackage.nodes[i].replace(/[\r\n]/g, "") + "'" +')">连接</button>'
        tr.appendChild(td)
        routeList.appendChild(tr)

    }
}

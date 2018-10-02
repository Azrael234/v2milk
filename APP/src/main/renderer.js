'use strict';
require('./config.js')
const remote = require('electron').remote
const {shell} = require('electron')
const fs = require("fs")
const path = require('path')

const ipc = require('electron').ipcRenderer;
const currentWindow = remote.getCurrentWindow()
const milksubmit = document.getElementById('V2Milk-submit')
const milkstop = document.getElementById('V2Milk-stopServers')
const milkreboot = document.getElementById('V2Milk-rebootPACServer')
const milkv2logdown = document.getElementById('V2LogToBottom')
const milkv2statusdown = document.getElementById('V2StatusToBottom')
const milkAddCustomRoute = document.getElementById('AddCustomRoute')
const btnlog = document.getElementById('V2log')
const btnstatus = document.getElementById('V2Status')
const LangFile = path.join(path.dirname(__dirname), "lang", "lang.json")
const LangConfig = JSON.parse(fs.readFileSync(LangFile))
var LangChoose = ""
var PHP = require('./PHP.js')

window.eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`)
}

ipc.send("onClickControl", "getLangChoose", "")

ipc.on("systemEditLang", function(event, message) {
    LangChoose = message

    ipc.send('onClickControl', 'getSavedData', '')

    initHtml()

    ipc.send('onClickControl', 'getIfRouteConnected', '')

    milksubmit.addEventListener('click', () => {
        var uuu = document.getElementById('emailF').value
        var ppp = document.getElementById('passwordF').value
        if(uuu == "" || ppp == ""){
            alert(getLang("UserPassNeeded"))
        }else{
            var upa = `{"email":"${uuu}","password":"${ppp}"}`
            ipc.send('onClickControl', 'onlogin', upa)
        }
    })

    milkv2logdown.addEventListener('click', () => {
        btnlog.scrollTop = btnlog.scrollHeight
    })

    milkv2statusdown.addEventListener('click', () => {
        btnstatus.scrollTop = btnstatus.scrollHeight
    })

    milkstop.addEventListener('click', () => {
        ipc.send('onClickControl', 'onV2RayStopServers', '')
    })

    milkreboot.addEventListener('click', () => {
        ipc.send('onClickControl', 'onV2RayrebootPACServer', '')
    })

    milkAddCustomRoute.addEventListener('click', () => {
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
        ipc.send("onMainFrameChange", JSON.stringify(loginAction))
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
            case 'initHtml':
                initHtml()
                break
            default:
                console.log(getLang("IllegalAccess"))
                break
        }
    });

    ipc.on("savedDataLogin", function(event) {
        var uuu = document.getElementById('emailF').value
        var ppp = document.getElementById('passwordF').value
        if(uuu != "" || ppp != ""){
            var upa = `{"email":"${uuu}","password":"${ppp}"}`
            ipc.send('onClickControl', 'onloginTry', upa)
        }
    })

    ipc.on("onMainFrameChange", function(event, message) {
        var data = JSON.parse(message)
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
                    case "innerHTML":
                        document.getElementById(action[0]).innerHTML = action[2]
                        break
                    default:
                        console.log(getLang("IllegalAccess"))
                        break
                }
            }
        }
    })

    ipc.on("V2Ray-log", function(event, message) {
        var p = document.createElement("p")
        p.innerHTML = message
        p.style = "line-height:12px;font-size:12px;margin-bottom:2px;margin-top:2px;margin-left:3px;"
        p.style.color = "gray"
        btnlog.append(p)
        btnlog.scrollTop = btnlog.scrollHeight
    })

    ipc.on("V2Ray-status", function(event, message) {
        var p = document.createElement("p")
        p.innerHTML = message
        p.style = "line-height:12px;font-size:12px;margin-bottom:2px;margin-top:2px;margin-left:3px;"
        if(message.indexOf("[Warning]") > -1){
            p.style.color = "orange"
        }else if(message.indexOf("[Info]") > -1){
            p.style.color = "gray"
        }else{
            p.style.color = "lightgray"
        }
        btnstatus.append(p)
        btnstatus.scrollTop = btnstatus.scrollHeight
    })

    ipc.on("V2Ray-jsonStatus", function(event, message) {
        message = JSON.parse(message)
        var p = document.createElement("p")
        p.innerHTML = message.message
        p.style = "line-height:12px;font-size:12px;margin-bottom:2px;margin-top:2px;margin-left:3px;"
        switch(message.status){
            case "success":
                p.style.color = "green"
                break
            case "error":
                p.style.color = "red"
                break
            default:
                p.style.color = "gray"
                break
        }
        btnstatus.append(p)
        btnstatus.scrollTop = btnstatus.scrollHeight
    })

    ipc.on("V2Ray-LogClean", function(event, message) {
        //btnlog.innerHTML = message
        btnstatus.innerHTML = message
    })
})

function initHtml(){
    document.getElementById('loginButtonF').innerHTML = `<a class="btn btn-primary btn-xs" style="height:25px;font-size:12px;" onclick="onClickControl('login', 'null')">${getLang("login")}</a>`
    document.getElementById('PACServer').innerHTML = `<a class="btn btn-primary btn-xs" style="height:25px;font-size:12px;" onclick="onClickControl('editPac', 'null')">${getLang("edit")}</a>`
    document.getElementById('HDashboard').innerHTML = `<i class="icon-box"></i> ${getLang("HDashboard")}`
    document.getElementById('useronlineF').innerHTML = getLang("Offline")
    document.getElementById('usernameF').innerHTML = getLang("PleaseLogin")
    document.getElementById('Title1').innerHTML = getLang("AccountAction")
    document.getElementById('Title2').innerHTML = getLang("RouteConnected")
    document.getElementById('Title3').innerHTML = getLang("PACServer")
    document.getElementById('RouteLinked').innerHTML = getLang("None")
    document.getElementById('RouteLinkedIcon').setAttribute("class", "icon icon-cloud-remove2 s-48")
    document.getElementById('HSelectRoute').innerHTML = getLang("HSelectRoute")
    document.getElementById('HRoute').innerHTML = getLang("HRoute")
    document.getElementById('HQRCode').innerHTML = getLang("HQRCode")
    document.getElementById('HAction').innerHTML = getLang("HAction")
    document.getElementById('HCSelectRoute').innerHTML = getLang("HCSelectRoute")
    document.getElementById('HCRoute').innerHTML = getLang("HCRoute")
    document.getElementById('HCAction').innerHTML = getLang("HCAction")
    document.getElementById('HRoutes').innerHTML = `<i class="icon icon-home2"></i>${getLang("HRoutes")}`
    document.getElementById('HDIY').innerHTML = `<i class="icon icon-plus-circle mb-3"></i>${getLang("HDIY")}`
    document.getElementById('HAboutUs').innerHTML = `<i class="icon icon-question"></i>${getLang("HAboutUs")}`
    document.getElementById('HLog').innerHTML = `<i class="icon icon-queue"></i>${getLang("HLog")}`
    document.getElementById('aboutUs').innerHTML = getLang("SoftWareLicense")
    document.getElementById('HSysLog').innerHTML = getLang("HSysLog")
    document.getElementById('HV2Log').innerHTML = getLang("HV2Log")
    document.getElementById('emailF').placeholder = getLang("Email")
    document.getElementById('passwordF').placeholder = getLang("Password")
    document.getElementById('V2Milk-submit').value = getLang("Submit")
}

function afterLoginExec(message){
    try{
        message = JSON.parse(message)
        document.getElementById('usernameF').innerHTML = message['name']
        if(message['email'].indexOf('qq.com') > 0){
            document.getElementById('userImageF').setAttribute("src",`http://q1.qlogo.cn/g?b=qq&nk=${message['email'].replace("@qq.com","")}&s=100`)
        }else{
            document.getElementById('userImageF').setAttribute("src",`http://cn.gravatar.com/avatar/${PHP.md5(message['email'])}?s=64`)
        }
        document.getElementById('useronlineT').setAttribute("class", "icon-circle text-success blink")
        document.getElementById('useronlineF').innerHTML = getLang("Online")
        document.getElementById('loginButtonF').innerHTML = `<a class="btn btn-primary btn-xs" style="height:25px;font-size:12px;" onclick="onClickControl('quit', 'null')">${getLang("quit")}</a>`
    }catch(error){
        console.log(`afterLoginExec Error: ${error}`)
    }
}

function loadPackages(message){
    try{
        message = JSON.parse(message)
        var packages = message['package']
        for (var i = 0; i < packages.length; i++) {
            loadPackage(packages[i])
        }
    }catch(error){
        console.log(`loadPackagesError: ${error}`)
    }
}

function loadPackage(mpackage){
    if(mpackage.nodes.length > 0){
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
            td.innerHTML = `<button type="button" class="btn btn-primary btn-xs" onclick="onClickControl('register','null')">${getLang("QRCode")}</button>`
            tr.appendChild(td)
            var td = document.createElement("td")
            td.innerHTML = `<button type="button" class="btn btn-info btn-xs" onclick="onClickControl('onV2RayGlobalConnect','${mpackage.uuid}|${mpackage.nodes[i].replace(/[\r\n]/g, "")}')">${getLang("ConnectGlobalMode")}</button><button type="button" class="btn btn-success btn-xs" onclick="onClickControl('onV2RayPACConnect','${mpackage.uuid}|${mpackage.nodes[i].replace(/[\r\n]/g, "")}')">${getLang("ConnectPACMode")}</button>`
            tr.appendChild(td)
            routeList.appendChild(tr)

        }
    }
}

function getLang(lang, msg = []){
    var langf = LangConfig[LangChoose][0][lang]
    if(typeof(langf) == "undefined"){
        langf = lang
    }else{
        for(var i = 0; i < msg.length; i++){
            msga = msg[i].split("|")
            langf = replaceAll(langf, msga[0].toString() , msga[1].toString())
        }
    }
    return langf
}
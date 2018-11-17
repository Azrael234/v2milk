'use strict';
require('./config.js')
const remote = require('electron').remote
const fs = require("fs")
const path = require('path')

const ipc = require('electron').ipcRenderer;
const currentWindow = remote.getCurrentWindow()
const milksubmit = document.getElementById('V2Milk-submit')
const milksettingsSubmit = document.getElementById('V2Milk-SettingSubmit')
const milksubscribSubmit = document.getElementById('V2Milk-subscribSubmit')
const milkstop = document.getElementById('V2Milk-stopServers')
const milkrebootPAC = document.getElementById('V2Milk-rebootPACServer')
const milkrefreshSystemPackages = document.getElementById('V2Milk-refreshSystemPackages')
const milkv2logdown = document.getElementById('V2LogToBottom')
const milkv2statusdown = document.getElementById('V2StatusToBottom')
const milkaddCustomRoute = document.getElementById('addCustomRoute')
const milkrefreshSubscribes = document.getElementById('refreshSubscribes')
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
    initEventListeners()
    initipcEvents()
    initSystemSettings()
    initCustom()
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
    document.getElementById('HAction').innerHTML = getLang("HAction")
    document.getElementById('HCSelectRoute').innerHTML = getLang("HCSelectRoute")
    document.getElementById('HCRoute').innerHTML = getLang("HCRoute")
    document.getElementById('HCStatus').innerHTML = getLang("HCStatus")
    document.getElementById('HCAction').innerHTML = getLang("HCAction")
    document.getElementById('HRoutes').innerHTML = `<i class="icon icon-home2"></i>${getLang("HRoutes")}`
    document.getElementById('HDIY').innerHTML = `<i class="icon icon-plus-circle mb-3"></i>${getLang("HDIY")}`
    document.getElementById('HAboutUs').innerHTML = `<i class="icon icon-question"></i>${getLang("HAboutUs")}`
    document.getElementById('HLog').innerHTML = `<i class="icon icon-queue"></i>${getLang("HLog")}`
    document.getElementById('HSystemSettings').innerHTML = `<i class="icon icon-settings2"></i>${getLang("HSystemSettings")}`
    document.getElementById('aboutUs').innerHTML = getLang("SoftWareLicense")
    document.getElementById('HSysLog').innerHTML = getLang("HSysLog")
    document.getElementById('HV2Log').innerHTML = getLang("HV2Log")
    document.getElementById('SystemSettings').innerHTML = getLang("SystemSettings")
    document.getElementById('Socks5PortDecs').innerHTML = getLang("Socks5PortDecs")
    document.getElementById('HttpPortDecs').innerHTML = getLang("HttpPortDecs")
    document.getElementById('PACPortDecs').innerHTML = getLang("PACPortDecs")
    document.getElementById('V2Milk-SettingSubmit').value = getLang("SettingSubmit")
    document.getElementById('SubscribeInfo').innerHTML = getLang("SubscribeInfo")
    document.getElementById('SubscribeName').placeholder = getLang("SubscribeName")
    document.getElementById('SubscribeUrl').placeholder = getLang("SubscribeUrl")
    milksubscribSubmit.value = getLang("SubscribSubmit")
    document.getElementById('emailF').placeholder = getLang("Email")
    document.getElementById('passwordF').placeholder = getLang("Password")
    document.getElementById('V2Milk-submit').value = getLang("Submit")
}

function initSystemSettings(){
    ipc.send('onClickControl', 'getSystemSettings', '')
}

function initEventListeners(){
    milksubmit.addEventListener('click', () => {
        var uuu = document.getElementById('emailF').value
        var ppp = document.getElementById('passwordF').value
        if(uuu == "" || ppp == ""){
            alterToast("error", getLang("UserPassNeeded"))
        }else{
            var upa = `{"email":"${uuu}","password":"${ppp}"}`
            ipc.send('onClickControl', 'onlogin', upa)
        }
    })

    milksettingsSubmit.addEventListener('click', () => {
        var socks5 = document.getElementById('Socks5Port').value
        var http = document.getElementById('HttpPort').value
        var pac = document.getElementById('PACPort').value
        if(!isIntNumForPort(socks5) || !isIntNumForPort(http) || !isIntNumForPort(pac)){
            alterToast("error", getLang("IllegalData"))
        }else{
            var systems = {
                "Socks5V2Port" : parseInt(socks5),
                "HttpV2Port" : parseInt(http),
                "PacPort" : parseInt(pac)
            }
            ipc.send('onClickControl', 'saveSystemSettings', JSON.stringify(systems))
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

    milkrebootPAC.addEventListener('click', () => {
        ipc.send('onClickControl', 'onV2RayrebootPACServer', '')
    })

    milkaddCustomRoute.addEventListener('click', () => {
        var addAction = {
            "actions" : [
                "v-pills-6|set|tab-pane animated fadeInUpShort go show active",
                "v-pills-1|set|tab-pane animated fadeInUpShort go",
                "v-pills-2|set|tab-pane animated fadeInUpShort go",
                "v-pills-3|set|tab-pane animated fadeInUpShort go",
                "v-pills-4|set|tab-pane animated fadeInUpShort go",
                "v-pills-5|set|tab-pane animated fadeInUpShort go",
                "v-pills-7|set|tab-pane animated fadeInUpShort go",
                "v-pills-1-tab|set|nav-link",
                "v-pills-2-tab|set|nav-link",
                "v-pills-3-tab|set|nav-link",
                "v-pills-4-tab|set|nav-link",
                "v-pills-7-tab|set|nav-link"
            ]
        }
        ipc.send('onClickControl', 'callRendererFrameChange', JSON.stringify(addAction))
    })

    milkrefreshSubscribes.addEventListener('click', () => {
        document.getElementById('cRoutePackages').innerHTML = ""
        initCustom()
    })

    milksubscribSubmit.addEventListener('click', () => {
        var name = document.getElementById('SubscribeName').value
        var url = document.getElementById('SubscribeUrl').value
        if(isLegalURL(url) && name != ""){
            ipc.send('onClickControl', 'onSaveSubscribeUrl', `${name}|${url}`)
            cleanSubscribeTab()
        }else{
            alterToast("error", getLang("IllegalData"))
        }
    })

    milkrefreshSystemPackages.addEventListener('click', () => {
        ipc.send('onClickControl', 'onRefreshSystemPackages', '')
    })
}

function alterToast(type, message, title = global.SiteName){
    document.getElementById('alertToastButton').setAttribute("data-title", title)
    document.getElementById('alertToastButton').setAttribute("data-message", message)
    document.getElementById('alertToastButton').setAttribute("data-type", type)
    document.getElementById('alertToastButton').setAttribute("data-position-class", "toast-top-right")
    document.getElementById('alertToastButton').click()
}

function initipcEvents(){
    ipc.on("onMainCall", function(event, message) {
        document.getElementById('alertToastButton').setAttribute("data-title", global.SiteName)
        document.getElementById('alertToastButton').setAttribute("data-message", message)
        document.getElementById('alertToastButton').setAttribute("data-type", "info")
        document.getElementById('alertToastButton').setAttribute("data-position-class", "toast-top-right")
        document.getElementById('alertToastButton').click()
    })

    ipc.on("onMainCallExec", function(event, action, message) {
        switch(action){
            case 'processLoginData':
                afterLoginExec(message)
                loadPackages(message)
                break
            case 'parseSubscribeData':
                parseSubscribeData(message)
                break
            case 'noCustomData':
                noCustomData(message)
                break
            case 'reloadCustom':
                document.getElementById('cRoutePackages').innerHTML = ""
                document.getElementById('cCRoutePackages').innerHTML = ""
                initCustom()
                break
            default:
                alterToast('error', getLang("IllegalAccess"))
                break
        }
    })

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
                        alterToast('error', getLang("IllegalAccess"))
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
}

function initCustom(){
    ipc.send('onClickControl', 'getCustomConfigs', '')
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
    console.log(mpackage)
    if(mpackage.nodes.length > 0){
        var routeList = document.getElementById('routePackages')
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        td.innerHTML = `<strong style="font-size:17px;">${mpackage.package}</strong>(${getLang("Used")}: ${(mpackage.usage / 1024 / 1024 / 1024).toFixed(2)} / ${mpackage.traffic / 1024 / 1024 / 1024} G)`
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
            td.innerHTML = `<button type="button" class="btn btn-info btn-xs" onclick="onClickControl('onV2RayGlobalConnect','${mpackage.uuid}|${mpackage.nodes[i].replace(/[\r\n]/g, "")}')">${getLang("ConnectGlobalMode")}</button>      <button type="button" class="btn btn-success btn-xs" onclick="onClickControl('onV2RayPACConnect','${mpackage.uuid}|${mpackage.nodes[i].replace(/[\r\n]/g, "")}')">${getLang("ConnectPACMode")}</button>`
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

function isIntNumForPort(val){
    if(!isNaN(val) && val <= 65535 && val >= 1){
        return true
    }else{
        return false
    }
}

function isLegalURL(str){
    var reg=/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/
    reg = new RegExp(reg)   
    return reg.test(str)
}

function parseSubscribeData(arr){
    arr = JSON.parse(arr)
    var cRouteList = document.getElementById('cRoutePackages')
    var url = arr.url
    var name = arr.url
    if(url.indexOf("|") >= 0){
        var urll = url.split("|")
        url = urll[1]
        name = urll[0]
    }
    if(arr.datas.length > 0){
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        td.innerHTML = name
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = `<a class="btn btn-success btn-xs">${getLang("success")}</a>`
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = `<button type="button" class="btn btn-danger btn-xs" onclick="onClickControl('removeSubscribeURL','${arr.url}')">${getLang("removeSubscribeURL")}</button>`
        tr.appendChild(td)
        cRouteList.appendChild(tr)
        for (var i = 0; i < arr.datas[0].length; i++) {
            var node = arr.datas[0][i]
            var tr = document.createElement("tr")
            var td = document.createElement("td")
            td.innerHTML = node.ps
            tr.appendChild(td)
            var td = document.createElement("td")
            td.innerHTML = ``
            tr.appendChild(td)
            var td = document.createElement("td")
            var addtoadr = `${node.id}|${node.ps}|${node.add}|${node.port}|${node.type}|${node.tls}|${node.host}|${node.path}|${node.net}|1|${node.aid}`
            td.innerHTML = `<button type="button" class="btn btn-info btn-xs" onclick="onClickControl('onV2RayGlobalConnect','${addtoadr}')">${getLang("ConnectGlobalMode")}</button>       <button type="button" class="btn btn-success btn-xs" onclick="onClickControl('onV2RayPACConnect','${addtoadr}')">${getLang("ConnectPACMode")}</button>`
            tr.appendChild(td)
            cRouteList.appendChild(tr)
        }
    }else{
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        td.innerHTML = name
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = `<a class="btn btn-danger btn-xs">${getLang("error")}</a>`
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = `<button type="button" class="btn btn-danger btn-xs" onclick="onClickControl('removeSubscribeURL','${arr.url}')">${getLang("removeSubscribeURL")}</button>`
        tr.appendChild(td)
        cRouteList.appendChild(tr)
    }
}

function noCustomData(type){
    var cRouteList
    switch(type){
        case 'Subscribe':
            cRouteList = document.getElementById('cRoutePackages')
            break
        default:
            cRouteList = null
            alterToast('error', getLang("IllegalAccess"))
            break
    }
    if(cRouteList != null){
        var tr = document.createElement("tr")
        var td = document.createElement("td")
        td.innerHTML = `<a class="btn btn-danger btn-xs">${getLang("noDataFound")}</a>`
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = ''
        tr.appendChild(td)
        var td = document.createElement("td")
        td.innerHTML = ''
        tr.appendChild(td)
        cRouteList.appendChild(tr)
    }
}

function cleanSubscribeTab(){
    document.getElementById('SubscribeName').value = ""
    document.getElementById('SubscribeUrl').value = ""
}

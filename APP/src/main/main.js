require('./config.js')
const Promise = require('bluebird')
const {Menu, Tray, app, BrowserWindow, shell, nativeImage, dialog} = require('electron')
const electron = require('electron')
const ipc = require('electron').ipcMain
const cps = require('child_process')
const fs = require("fs")
const path = require('path')
const http = require('http')
var request = require('request')
var qs = require('querystring')
var sudo = require('sudo-prompt')
var PHP = require('./PHP.js')
const { isMac, isWin, isLinux, isDev, isNoPack} = require('./env.js')
const LangFile = path.join(path.dirname(__dirname), "lang", "lang.json")
const LangConfig = JSON.parse(fs.readFileSync(LangFile))

let mainWindow
let alertWindow
let V2RayServer
let ProxyOutput
let tray
let PACServer

let __libname = path.dirname(path.dirname(path.dirname(__dirname)))
if(isDev){
    __libname = path.dirname(path.dirname(__dirname))
}else if(isDev && isWin){
    __libname = __dirname
}
if(isNoPack){
    __libname = path.dirname(path.dirname(__dirname))
}

__static = path.join(__libname, "extra", "static")

const appConfigDir = path.join(app.getPath('appData'), "V2Milk")
const userConfigDir = app.getPath('userData')
var configPath = path.join(appConfigDir, "set.json")
var customConfigPath = path.join(appConfigDir, "custom.json")
var PacFilePath = path.join(appConfigDir, "pac.txt")
var helperPath = path.join(__libname, 'extra/lib/proxy_conf_helper')
var macToolPath = path.resolve(userConfigDir, 'proxy_conf_helper')

let winToolPath
if (isWin) {
    winToolPath = path.join(__libname, '/extra/lib/sysproxy.exe')
}

var isInLimit = false
var sockets = []
var userKey = ""
var PacPort = "7777"
var Socks5V2Port = 1081
var HttpV2Port = 8001
var serverLoad = ""
var serverConnected = ""
var serverMode = ""
var LangChoose = global.DefaultLang
var isModeBeforeSleep
var isRouteBeforeSleep
var noHelper = null
var closeFlag = false
var customSubscribes = []

function init(){
    var template = [{
        label: "Application",
        submenu: [
            { label: getLang("AboutApplication"), selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: getLang("quit"), accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: getLang("edit"),
        submenu: [
            { label: getLang("Undo"), accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: getLang("Redo"), accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: getLang("Cut"), accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: getLang("Copy"), accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: getLang("Paste"), accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: getLang("SelectAll"), accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];
    initProxyHelper().then(function(){
        initConfig().then(function(){
            Menu.setApplicationMenu(Menu.buildFromTemplate(template))
            createWindow()
            renderTray()
            initCustomConfig().then(function(){
                console.log(getLang("Loaded"))
            })
        }).catch(function(error){
            console.log(error)
            noHelper = 1
            exit()
        })
        initPowerMonitor()
    }).catch(function(error){
        console.log(error)
        noHelper = 1
        exit()
    })
}

console.log(getLang("Loading"))

//power monitor
function initPowerMonitor(){
    electron.powerMonitor.on('resume', () => {
        webContentsSend("V2Ray-log", getLang("SystemGoingToResume"))
        if(isModeBeforeSleep != "OFF" && isModeBeforeSleep != null && typeof(isModeBeforeSleep) != "undefined"){
            rebootServer(isModeBeforeSleep, isRouteBeforeSleep)
        }
        isModeBeforeSleep = null
        isRouteBeforeSleep = null
    })
    electron.powerMonitor.on('suspend', () => {
        webContentsSend("V2Ray-log", getLang("SystemGoingToSleep"))
        isRouteBeforeSleep = serverConnected
        if(PACServer != null && V2RayServer != null){
            isModeBeforeSleep = "PAC"
        }else if(V2RayServer != null){
            isModeBeforeSleep = "GLOBAL"
        }else{
            isModeBeforeSleep = "OFF"
        }
        closeServer()
    })
    electron.powerMonitor.on('shutdown', () => {
        closeServer()
        app.quit()
    })
}

//main window function
function createWindow() {
    if(isMac){
        app.dock.show()
    }

    if (isDev) {
        mainWindow = new BrowserWindow(
            {
                width: 1400,
                height: 650,
                resizable: false,
                maximizable: false,
                skipTaskbar: false,
                icon: "assets/favicon.icns"
            }
        )
        mainWindow.loadFile('index.html')
        mainWindow.webContents.openDevTools()
    }else{
        mainWindow = new BrowserWindow(
            {
                width: 1000,
                height: 650,
                resizable: false,
                maximizable: false,
                skipTaskbar: false,
                icon: "assets/favicon.icns"
            }
        )
        mainWindow.loadFile('index.html')
    }

    mainWindow.on('closed', function () {
        mainWindow = null
        if(isMac){
            app.dock.hide()
        }
    })
}

function reloadWindow(){
    if(mainWindow == null){
        createWindow()
    }else{
        mainWindow.close()
        setTimeout(function(){
            reopenWindow()
            updateTray()
        }, 1000)  
    }
}

function reopenWindow() {
    if(mainWindow == null){
        createWindow()
    }else{
        mainWindow.show()
        if(isMac){
            app.dock.show()
        }
    }
}

function editPacAlert(){
    var options = {
        type: 'info',
        title: global.SiteName,
        message: getLang("PacFileEditAlert"),
        buttons: [getLang("edit")],
        defaultId: 0,
        icon: path.join(__static, 'ico', 'ico.png')
    }
    dialog.showMessageBox(options, function(options){
        if(options == 0){
            shell.openItem(PacFilePath)
        }
    })
}

function windowAlert(message){
    var options = {
        type: 'info',
        title: global.SiteName,
        message: message,
        buttons: [getLang("done")],
        defaultId: 0,
        icon: path.join(__static, 'ico', 'ico.png')
    }
    dialog.showMessageBox(options, function(options){})
}

function exit(){
    app.exit()
}

function webContentsSend(event, message, noConsole = false){
    if(mainWindow != null){
        mainWindow.webContents.send(event, message)
        //console.log(`Has Window: ${event} | ${message}`)
    }else if(!noConsole){
        console.log(`No Window: ${event} | ${message}`)
    }
}

function webContentsSendAction(event, action, message, noConsole = false){
    if(mainWindow != null){
        mainWindow.webContents.send(event, action, message)
        //console.log(`Has Window: ${event} | ${message}`)
    }else if(!noConsole){
        console.log(`No Window: ${event} | ${message}`)
    }
}

app.on('ready', init)

app.on('window-all-closed', () => {
})

app.on('quit', function () {
    if(noHelper == null){
        closeServer()
    }
})

dialog.showErrorBox = (title, content) => {
    console.log(`${title}\n${content}`)
    //dialog.showErrorBox(title, content)
}

ipc.on('onClickControl',function(event, element, data) {
    switch(element){
        case "getSavedData":
            getSavedData()
            break
        case "callRendererFrameChange":
            webContentsSend("onMainFrameChange", data)
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
                    "v-pills-4-tab|set|nav-link",
                    "v-pills-7-tab|set|nav-link"
                ]
            }
            event.sender.send("onMainFrameChange", JSON.stringify(loginAction))
            break
        case "onlogin":
            var dataa = {'data': PHP.uc_authcode(data, "ENCODE", global.ucKey)}
            var content = qs.stringify(dataa);
            sendRequest(event, content, data)
            break
        case "onloginTry":
            var dataa = {'data': PHP.uc_authcode(data, "ENCODE", global.ucKey)}
            var content = qs.stringify(dataa);
            sendRequest(event, content, data, true)
            break
        case "register":
            shell.openExternal(global.RegisterPath)
            break
        case "onV2RayGlobalConnect":
            jumpToLog()
            rebootServer("GLOBAL", data)
            break
        case "onV2RayPACConnect":
            jumpToLog()
            rebootServer("PAC", data)
            break
        case "onV2RayStopServers":
            closeServer()
            break
        case "quit":
            userKey = ""
            serverLoad = ""
            closeServer()
            reloadWindow()
            break
        case "getLangChoose":
            event.sender.send("systemEditLang", LangChoose)
            break
        case "onV2RayrebootPACServer":
            if(PACServer != null){
                rebootPACServer("PAC")
            }
            break
        case "editPac":
            editPacAlert()
            break
        case "getIfRouteConnected":
            if(serverConnected != null && typeof(serverConnected) != "undefined" && serverConnected.indexOf("|") >= 0){
                updateConnectedRoute(serverConnected, serverMode)
            } 
            break
        case "getSystemSettings":
            sendSystemSettings()
            break
        case "saveSystemSettings":
            saveConfigFromRendener(data)
            break
        case "onSaveSubscribeUrl":
            customSubscribes.push(data)
            saveUpdateCustomConfig()
            windowAlert(getLang("CustomConfigUpdated"))
            jumpToCustom()
            break
        case "getCustomConfigs":
            getCustomConfigs()
            break
        case "removeSubscribeURL":
            customSubscribes = removeArrayItem(customSubscribes, data)
            saveUpdateCustomConfig()
            windowAlert(getLang("CustomConfigUpdated"))
            event.sender.send("onMainCallExec", "reloadCustom")
            break
        case "onRefreshSystemPackages":
            var saveAction = {
                "actions" : [
                    `routePackages|innerHTML|`
                ]
            }
            webContentsSend("onMainFrameChange", JSON.stringify(saveAction))
            getSavedData()
            windowAlert(getLang("UserInfoRefreshed"))
            break
        default:
            webContentsSend("V2Ray-log", getLang("IllegalAccess"))
            break
    }
})

function cleanLog(){
    webContentsSend("V2Ray-LogClean", "")
}

//Login Functions
function sendRequest(event, content, upa, nolog = false){
    request(`${global.APIPath}?${content}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            processData(event, body, upa, nolog)
        }
    })
}

function processData(event, data, upa, nolog = false){
    data = PHP.uc_authcode(PHP.licenseDecodePart(data, global.licKey), "DECODE", global.ucKey)
    try{
        var dataa = JSON.parse(data);
        if(dataa.result == "success"){
            if(dataa.package.length == 0){
                event.sender.send("onMainCall", getLang("NoProductInYourAccount"))
            }else{
                saveData(upa)
                var loginAction = {
                    "actions" : [
                        "v-pills-1|set|tab-pane animated fadeInUpShort go show active",
                        "v-pills-2|set|tab-pane animated fadeInUpShort go",
                        "v-pills-3|set|tab-pane animated fadeInUpShort go",
                        "v-pills-4|set|tab-pane animated fadeInUpShort go",
                        "v-pills-5|set|tab-pane animated fadeInUpShort go",
                        "v-pills-6|set|tab-pane animated fadeInUpShort go",
                        "v-pills-7|set|tab-pane animated fadeInUpShort go",
                        "v-pills-1-tab|set|nav-link active",
                        "v-pills-2-tab|set|nav-link",
                        "v-pills-3-tab|set|nav-link",
                        "v-pills-4-tab|set|nav-link",
                        "v-pills-7-tab|set|nav-link"
                    ]
                }
                event.sender.send("onMainFrameChange", JSON.stringify(loginAction))
                event.sender.send('onMainCallExec', 'processLoginData', data)
                serverLoad = getServersList(data)
                updateTray()
            }
        }else if(dataa.result == "error" && !nolog){
            switch(dataa.message){
                case "Illegal Data":
                    event.sender.send("onMainCall", getLang("IllegalData"))
                    break
                case "Email or Password Invalid":
                    event.sender.send("onMainCall", getLang("WrongUserOrPass"))
                    break
                default:
                    event.sender.send("onMainCall", getLang("UnknownError"))
                    break
            }
        }
    }catch(error){
        if(!nolog){
            event.sender.send("onMainCall", getLang("UnknownError") + `\n${error}`)
        }
    }
}

function getServersList(data){
    var servers = []
    try{
        data = JSON.parse(data)
        var packages = data['package']
        for (var i = 0; i < packages.length; i++) {
            servers.push(getServerPackage(packages[i]))
        }
    }catch(error){
        console.log(`getServersList Error: ${error}`)
    }
    return servers
}

function getServerPackage(mpackage){
    var serverPackage = {}
    if(mpackage.nodes.length > 0){
        serverPackage.pname = mpackage.package
        serverPackage.servers = []
        for (var i = 0; i < mpackage.nodes.length; i++) {
            var server = {}
            var nodename = mpackage.nodes[i].split("|")
            server.sname = nodename[0]
            server.uuid = mpackage.uuid
            server.info = `${mpackage.uuid}|${mpackage.nodes[i]}`
            serverPackage.servers.push(server)
        }
        console.log(`Loaded ${mpackage.nodes.length} Servers for ${mpackage.package}`)
    }
    return serverPackage
}

function saveData(upa){
    var data = PHP.uc_authcode(upa, "ENCODE", global.ucKey)
    userKey = data
    saveUpdateConfig()
}

function getSavedData(){
    if(typeof(userKey) != "undefined" && userKey != ""){
        try{
            var data = PHP.uc_authcode(userKey, "DECODE", global.ucKey)
            var dataa = JSON.parse(data);
            if(dataa.email !== null && dataa.password !== null){
                var saveAction = {
                    "actions" : [
                        `emailF|value|${dataa.email}`,
                        `passwordF|value|${dataa.password}`
                    ]
                }
                webContentsSend("onMainFrameChange", JSON.stringify(saveAction))
                webContentsSend("savedDataLogin")
                webContentsSend("V2Ray-log", getLang("ParseSavedDataSuccessed"))
            }
        }catch(error){
            console.log("V2Ray-log", getLang("ParseSavedDataFailed", [`%error|${error}`]))
        }
    }
}

//Config Loading && Saving
function initConfig(){
    return new Promise(function(resolve) {
        if (!fs.existsSync(appConfigDir)){
            fs.mkdirSync(appConfigDir)
            console.log(getLang("SystemFolderCreated"))
        }
        fs.readFile(configPath, {encoding:"utf-8"}, function (err, str) {
            var sysconfig = getDefaultConfig()
            if(err){
                console.log(getLang("SystemConfigReadFailed", [`%error|${err}`]))
                saveSysConfig(sysconfig).then(function(){
                    console.log(getLang("SystemConfigSaved"))
                }).catch(error=>{
                    console.log(getLang("SystemConfigSavedFailed", [`%error|${error}`]))
                })
            }else{
                try{
                    sysconfig = JSON.parse(str)
                }catch(err){
                    webContentsSend("V2Ray-log", getLang("SystemConfigParseError"))
                    saveSysConfig(sysconfig).then(function(){
                        console.log(getLang("SystemConfigSaved"))
                    }).catch(error=>{
                        console.log(getLang("SystemConfigSavedFailed", [`%error|${error}`]))
                    })
                }
            }
            PacPort = sysconfig.PacPort.toString() ? sysconfig.PacPort.toString() : 7777
            Socks5V2Port = parseInt(sysconfig.Socks5V2Port) ? parseInt(sysconfig.Socks5V2Port) : 1081
            HttpV2Port = parseInt(sysconfig.HttpV2Port) ? parseInt(sysconfig.HttpV2Port) : 8001
            userKey = sysconfig.userKey.toString() ? sysconfig.userKey.toString() : ""
            LangChoose = sysconfig.LangChoose ? sysconfig.LangChoose : global.DefaultLang
            console.log(getLang("SystemConfigDone", [`%lang|${LangChoose}`, `%pacPort|${PacPort}`, `%socks5Port|${Socks5V2Port}`, `%httpPort|${HttpV2Port}`]))
        })
        fs.readFile(PacFilePath, {encoding:"utf-8"}, function (err, str) {
            if(err || str == ""){
                var pacfile = fs.readFileSync(path.join(__libname, 'extra/v2ray-core/pac/pac.txt'))
                fs.writeFileSync(PacFilePath, pacfile ,{flag:'w',encoding:'utf-8',mode:'0666'})
                console.log(getLang("PacFileLoadDefault"))
            }else{
                console.log(getLang("PacFileLoaded"))
            }
        })
        return resolve()
    })
}

function getDefaultConfig(){
    var defaultConfig = {
        "LangChoose" : global.DefaultLang,
        "userKey" : "",
        "PacPort" : 7777,
        "Socks5V2Port" : 1081,
        "HttpV2Port" : 8001
    }
    return defaultConfig
}

function saveUpdateConfig(){
    var newConfig = {
        "LangChoose" : LangChoose.toString(),
        "userKey" : userKey.toString(),
        "PacPort" : parseInt(PacPort),
        "Socks5V2Port" : parseInt(Socks5V2Port),
        "HttpV2Port" : parseInt(HttpV2Port)
    }
    saveSysConfig(newConfig).then(function(){
        webContentsSend("V2Ray-log", getLang("SystemConfigUpdated"))
    }).catch(error=>{
        webContentsSend("V2Ray-log", getLang("SystemConfigSavedFailed", [`%error|${error}`]))
    })
}

function saveSysConfig(config){
    return new Promise((resolve, reject) => {
        fs.writeFile(configPath, JSON.stringify(config, null, 4) ,{flag:'w',encoding:'utf-8',mode:'0666'}, function(err){
            if(err){
                return reject(err)
            }else{
                return resolve(true)
            }
        })
    })
}

function saveConfig(node){
    var nodearr = node.split("|")
    var jsonarr = {
        "policy" : {
            "levels" : {
                "0" : {
                    "uplinkOnly" : 0
                }
            }
        },
        "inbound" : {
            "listen" : "127.0.0.1",
            "port" : Socks5V2Port,
            "protocol" : "socks",
            "settings" : {
              "auth" : "noauth",
              "udp" : false,
              "ip" : "127.0.0.1"
            }
        },   
        "inboundDetour" : [
            {
                "listen" : "127.0.0.1",
                "allocate" : {
                    "strategy" : "always",
                    "refresh" : 5,
                    "concurrency" : 3
                },
                "port" : HttpV2Port,
                "protocol" : "http",
                "tag" : "httpDetour",
                "domainOverride" : [
                    "http",
                    "tls"
                ],
                "streamSettings" : {
                },
                "settings" : {
                    "timeout" : 0
                }
            }
        ],     
        "log" : {
            "loglevel" : "debug",
        },        
        "dns" : {
            "servers" : [
                "223.5.5.5"
            ]
        },
        "outboundDetour" : [
            {
                "protocol" : "freedom",
                "tag" : "direct",
                "settings" : {

                }
            }
        ], 
        "outbound" : {
            "sendThrough" : "0.0.0.0",
            "mux" : {
                "enabled" : false,
                "concurrency" : 8
            },
            "protocol" : "vmess",
            "settings" : {
                "vnext" : [
                {
                    "address" : nodearr[2],
                    "port" :parseInt(nodearr[3]),
                    "users" : [
                        {
                            "id" : nodearr[0],
                            "alterId" : parseInt(nodearr[10]),
                            "security" : "auto",
                            "level" : 0
                        }
                    ],
                    "remark" : nodearr[1]
                }
              ]
            },
            "streamSettings" : {
                "wsSettings" : {
                    "path" : nodearr[7],
                    "headers" : {
                        "Host" : nodearr[6]
                    }
                },
                "tcpSettings" : {
                    "header" : {
                        "type" : "none"
                    }
                },
                "security" : nodearr[5],
                "tlsSettings" : {
                    "serverName" : nodearr[6],
                    "allowInsecure" : false
                },
                "httpSettings" : {
                    "path" : nodearr[7],
                    "host" : [
                        nodearr[6]
                    ]
                },
                "kcpSettings" : {
                    "header" : {
                        "type" : nodearr[4] ? nodearr[4] : "none"
                    },
                    "mtu" : 1350,
                    "congestion" : false,
                    "tti" : 20,
                    "uplinkCapacity" : 5,
                    "writeBufferSize" : 1,
                    "readBufferSize" : 1,
                    "downlinkCapacity" : 20
                },
                "network" : nodearr[8]
            }
        }
    }
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(appConfigDir, "config.json"), JSON.stringify(jsonarr, null, 4) ,{flag:'w',encoding:'utf-8',mode:'0666'}, function(err){
            if(err){
                return reject(err)
            }else{
                return resolve(true)
            }
        })
    })
}

function saveConfigFromRendener(data){
    try{
        data = JSON.parse(data)
        PacPort = data.PacPort.toString() ? data.PacPort.toString() : 7777
        Socks5V2Port = parseInt(data.Socks5V2Port) ? parseInt(data.Socks5V2Port) : 1081
        HttpV2Port = parseInt(data.HttpV2Port) ? parseInt(data.HttpV2Port) : 8001
        saveUpdateConfig()
        windowAlert(getLang("SystemConfigUpdated"))
        jumpToMain()
    }catch(error){
        windowAlert(getLang("UnknownErrorDetailed", [`%error|${error}`]))
    }
}

//PAC Server start && close
function startPacHttpServer(){
    return new Promise(function(resolve, reject) {
        webContentsSend("V2Ray-log", getLang("PacServerStarting"))
        PACServer = http.createServer()

        PACServer.on('request', (request, response) => {
            if (request.url == '/pac') {
                var pacfile = fs.readFileSync(PacFilePath)
                response.writeHead(200,{"content-type":"text/plain","connection":"close","transfer-encoding":"identity"});
                response.end(pacfile);
            }else{
                response.writeHead(404)
                response.end("404")
            }
        })

        PACServer.listen(parseInt(PacPort), '127.0.0.1');

        PACServer.on('listening', () => {
            webContentsSend("V2Ray-log", getLang("PacServerStarted"))
            return resolve()
        })

        PACServer.on("connection",function(socket){
            sockets.push(socket);
            socket.once("close",function(){
                sockets.splice(sockets.indexOf(socket),1);
            });
        })

        PACServer.on('error', (data) => {
            webContentsSend("V2Ray-log", getLang("PacServerStartFailed", [`%error|${data}`]))
            return reject(data)
        })
    })
}

function closePacHttpServer(){
    return new Promise((resolve) => {
        sockets.forEach(function(socket){
            socket.destroy()
        })
        if(PACServer != null){
            PACServer.close(function(){
                webContentsSend("V2Ray-log", getLang("PacServerClosed"))
            }).then(function(){
                return resolve(true)
            })
        }else{
            return resolve(true)
        }
    }).catch(error=>{
        return error
    })
}

//V2Ray Procress Load
function startV2RayProcess(arg, node){
    webContentsSend("V2Ray-log", getLang("V2RayStarting"))
    setProxy(arg)
    serverMode = arg
    if(isMac){
        V2RayServer = cps.execFile(path.join(__libname, 'extra/v2ray-core/MacOS/v2ray'), ['-config', path.join(appConfigDir, "config.json")])
    }else if(isLinux){
        V2RayServer = cps.execFile(path.join(__libname, 'extra/v2ray-core/Linux/v2ray'), ['-config', path.join(appConfigDir, "config.json")])
    }else if(isWin){
        V2RayServer = cps.execFile(path.join(__libname, 'extra/v2ray-core/Windows/v2ray'), ['-config', path.join(appConfigDir, "config.json")])
    }
    V2RayServer.stdout.on('data', (data) => {
        if(data.indexOf("Failed to start App|Proxyman|Inbound: failed to listen TCP on") > -1 ){
            webContentsSend("V2Ray-status", data)
            webContentsSend("V2Ray-jsonStatus", JSON.stringify({"status":"error","message":getLang("V2RayPortInUse", [`%port|${Socks5V2Port}`])}))
        }else if(data.indexOf("failed to load config:") > -1 ){
            webContentsSend("V2Ray-status", data)
            webContentsSend("V2Ray-jsonStatus", JSON.stringify({"status":"error","message":getLang("V2RayConfigFileError")}))
        }else if(data.toLowerCase().indexOf("started") > -1 ){
            webContentsSend("V2Ray-status", data)
            webContentsSend("V2Ray-log", getLang("V2RayStarted"))
            updateConnectedRoute(node, arg)
        }else{
            webContentsSend("V2Ray-status", data)
        }
    })

    V2RayServer.stderr.on('data', (data) => {
        webContentsSend("V2Ray-status", data)
    })

    V2RayServer.on('close', (code) => {
        webContentsSend("V2Ray-jsonStatus", JSON.stringify({'status':'success','message':getLang("V2RayClosed")}))
        if(closeFlag == false){
            webContentsSend("V2Ray-log", getLang("V2RayUnexpectedExit", [`%second|2`]))
            setTimeout(() => rebootServer(serverMode, serverConnected), 2000)
        }
    })

    V2RayServer.on('exit', (code) => {
        webContentsSend("V2Ray-log", getLang("V2RayExitCode", [`%code|${code}`]))
        if(isMac || isLinux){
            //cps.exec("kill -9 $(ps -ef | grep v2ray | grep -v grep | awk '{print $2}')")
        }else if(isWin){

        }
        V2RayServer = null
    })
}

function killV2RayProcess(){
    return new Promise((resolve) => {
        setProxy("OFF")
        if(V2RayServer != null){
            V2RayServer.kill()
        }
        setTimeout(() => resolve(), 2000)
    }).catch(error=>{
        return error
    })
}

function updateConnectedRoute(node, mode = ""){
    switch(mode){
        case "PAC":
            mode = "sitemap" 
            break
        case "GLOBAL":
            mode = "globe"
            break
        default:
            mode = "cloud-remove2"
            break
    }
    var node = node.split("|")
    var updateAction = {
        "actions" : [
            `RouteLinked|innerHTML|${node[1]}`,
            `RouteLinkedIcon|set|icon icon-${mode} s-48`
        ]
    }
    webContentsSend("onMainFrameChange", JSON.stringify(updateAction), true)
}

//Proxy Set
function initProxyHelper(){
    return new Promise(function(resolve, reject) {
        if(isMac){
            fs.readFile(macToolPath, {encoding:"utf-8"}, function (err, str) {
                if(err){
                    var command = `cp ${helperPath} "${macToolPath}" && chown root:admin "${macToolPath}" && chmod a+rx "${macToolPath}" && chmod +s "${macToolPath}"`
                    sudo.exec(command, { name: 'V2Milk APP' }, (error, stdout, stderr) => {
                        if (error || stderr) {
                            ProxyHelperAlert(getLang("HelperInstallFailed"), 1)
                            return reject(error)
                        } else {
                            ProxyHelperAlert(getLang("HelperInstallSuccess"), 0)
                            return resolve()
                        }
                    })
                }else{
                    return resolve()
                }
            })
        }else{
            return resolve()
        }
    })
}

function ProxyHelperAlert(message, option){
    var options = {
        type: 'info',
        title: global.SiteName,
        message: message,
        buttons: [getLang("done")],
        icon: path.join(__static, 'ico', 'ico.png')
    }
    dialog.showMessageBox(options, function(options){
    })
}

function setProxy(mode){
    var pacUrl = `http://127.0.0.1:${parseInt(PacPort)}/pac`
    var host = "127.0.0.1"
    if(isMac){
        var nMacToolPath = replaceAll(macToolPath, " ", "\\ ")
        switch(mode){
            case "PAC":
                cps.execSync(`${nMacToolPath} -m auto -u ${pacUrl}`)
                break
            case "GLOBAL":
                cps.execSync(`${nMacToolPath} -m global -p ${Socks5V2Port}`)
                break
            case "OFF":
                cps.execSync(`${nMacToolPath} -m off`)
                break
        }
    }else if(isLinux){
        switch(mode){
            case "PAC":
                cps.execSync(`gsettings set org.gnome.system.proxy mode 'auto' && gsettings set org.gnome.system.proxy autoconfig-url ${pacUrl}`)
                break
            case "GLOBAL":
                cps.execSync(`gsettings set org.gnome.system.proxy mode 'manual' && gsettings set org.gnome.system.proxy.socks host '${host}' && gsettings set org.gnome.system.proxy.socks port ${Socks5V2Port}`)
                break
            case "OFF":
                cps.execSync(`gsettings set org.gnome.system.proxy mode 'none'`)
                break
        }
    }else if(isWin){
        switch(mode){
            case "PAC":
                cps.execSync(`${winToolPath} pac ${pacUrl}`)
                break
            case "GLOBAL":
                cps.execSync(`${winToolPath} global ${host}:${HttpV2Port}`)
                break
            case "OFF":
                cps.execSync(`${winToolPath} pac ""`)
                break
        }
    } 
}

//Server Functions
function rebootServer(mode, node){
    closeFlag = true
    if(isInLimit){
        webContentsSend("V2Ray-log", getLang("ActionTooFast"))
    }else{
        isInLimit = true
        webContentsSend("V2Ray-log", getLang("LoadingMode", [`%mode|${mode}`]))
        rebootPACServer(mode).then(function(){
            cleanLog()
            saveConfig(node).then(function(){
                webContentsSend("V2Ray-log", getLang("ConfigWroteSuccess"))
                serverConnected = node.replace(/[\r\n]/g, "")
                killV2RayProcess().then(function(){
                    updateConnectedRoute(`|${getLang("None")}`)
                    startV2RayProcess(mode, node)
                    updateTray()
                    closeFlag = false
                }).catch(error=>{
                    serverConnected = null
                    webContentsSend("V2Ray-log", getLang("UnknownErrorDetailed", [`%error|${error}`]))
                })
            }).catch(error=>{
                serverConnected = null
                webContentsSend("V2Ray-log", getLang("ConfigWroteFailed", [`%error|${error}`]))
            })
        }).catch(error=>{
            webContentsSend("V2Ray-log", getLang("UnknownErrorDetailed", [`%error|${error}`]))
        })
    }
    setTimeout(function(){
        isInLimit = false
    }, 2000)
}

function rebootPACServer(mode){
    if(mode != "PAC"){
        return new Promise((resolve) => {
            closePacHttpServer().then(function(){
                PACServer = null
                return resolve(true)
            })
        })
    }else{
        return new Promise((resolve) => {
            closePacHttpServer().then(function(){
                PACServer = null
                startPacHttpServer().then(function(){
                    return resolve(true)
                }).catch(error=>{
                    return error
                })
            })
        }).catch(error=>{
            return reject(error)
        })
    }
}

function closeServer(){
    closeFlag = true
    closePacHttpServer().then(function(){
        PACServer = null
        killV2RayProcess().then(function(){
            updateTray()
            updateConnectedRoute(`|${getLang("None")}`)
            serverConnected = null
            webContentsSend("V2Ray-log", getLang("MainServerClosed"))
        })
    }).catch(error=>{
        serverConnected = null
        webContentsSend("V2Ray-log", getLang("PacServerCloseFailed", [`%error|${error}`]))
    })
}

//Tray Functions
function generateMenus() {
    let menus = [
        { 
            label: getLang("OpenMainWindow"), 
            click: function() {
                reopenWindow()
            } 
        },
        { 
            label: getLang("ChooseLanguage"), 
            submenu: [] 
        },
        { 
            label: getLang("ChooseServer"), 
            submenu: [] 
        },
        { 
            label: getLang("Exit"), 
            click: function(){
                exit() 
            }
        }
    ]
    var menuTray = getTrayServerMenu()
    var langTray = getAvailableLang()
    for (var i = langTray.length - 1; i >= 0; i--) {
        menus[1].submenu.push(langTray[i])
    }
    for (var i = menuTray.length - 1; i >= 0; i--) {
        menus[2].submenu.push(menuTray[i])
    }
    return menus
}

function getTrayServerMenu(){
    var menu = []
    if(serverLoad.length >= 1){
        for (var i = serverLoad.length - 1; i >= 0; i--) {
            var package = serverLoad[i]
            var servers = package.servers
            var nodes = {
                label: serverLoad[i].pname,
                submenu: []
            }
            for (var ii = servers.length - 1; ii >= 0; ii--) {
                var data = servers[ii].info.replace(/[\r\n]/g, "")
                if(serverConnected == data){ checked = true }else{ checked = false }
                nodes.submenu.push({
                    label: servers[ii].sname,
                    id: servers[ii].sname,
                    nodeinfo : data,
                    type: 'checkbox',
                    checked: checked,
                    click: function(data){
                        rebootServer("PAC", data.nodeinfo)
                    }
                })
            }
            menu.push(nodes)
        }
    }else{
        menu.push({
            label: getLang("BuyProducts", []),
            click: function(){
                shell.openExternal(global.CartPath)
            }
        })
    }
    return menu
}

function updateTray(){
    const menus = generateMenus()
    const contextMenu = Menu.buildFromTemplate(menus)
    tray.setContextMenu(contextMenu)
    tray.setToolTip(getTooltip())
    setTrayIcon()
}

function getTooltip() {
    if(V2RayServer == null){
        return getLang("ConnectOff")
    }else{
        if(PACServer !== null){
            return getLang("ConnectPAC")
        }else{
            return getLang("ConnectGlobal")
        }
    }
}

function getTrayIcon() {
    if(V2RayServer == null){
        return path.join(__static, 'icons', isMac ? 'disabled@2x.png' : 'disabled.png')
    }else{
        if(PACServer !== null){
            return path.join(__static, 'icons', isMac ? 'pacTemplate@2x.png' : 'pacTemplate.png')
        }else{
            return path.join(__static, 'icons', isMac ? 'globalTemplate@2x.png' : 'globalTemplate.png')
        }
    }
}

function setTrayIcon() {
    tray.setImage(nativeImage.createFromPath(getTrayIcon()))
    isMac && tray.setPressedImage(nativeImage.createFromPath(path.join(__static, 'icons', 'enabledTemplate@2x.png')))
}

function renderTray() {
    tray = new Tray(nativeImage.createEmpty())
    updateTray()
    //tray.on((isMac || isWin) ? 'double-click' : 'click', e => { console.log('clicked') })
}

//System Lang Functions
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

function replaceAll(str, FindText, RepText) {
    regExp = new RegExp(FindText, "g")
    return str.replace(regExp, RepText)
}

function removeArrayItem(arr, item){
    var newarr = arr.slice(0)
    for(var i=0; i < newarr.length; i++){
        if(newarr[i] == item){
            newarr.splice(i, 1)
            i--
        }
    }
    return newarr
}

function getAvailableLang(){
    var menu = []
    for(var i in LangConfig){
        if(i == LangChoose){ checked = true }else{ checked = false }
        var lang = {
            label: LangConfig[i][0]['LangName'],
            type: 'checkbox',
            checked: checked,
            tlang: i,
            click: function(data){
                editLang(data.tlang)
            }
        }
        menu.push(lang)
    }
    return menu
}

function editLang(tlang){
    LangChoose = tlang
    saveUpdateConfig()
    closeServer()
    reloadWindow()
}

//Custom route functions
function initCustomConfig(){
    return new Promise(function(resolve) {
        fs.readFile(customConfigPath, {encoding:"utf-8"}, function (err, str) {
            var defaultConfig = getCustomDefaultConfig()
            if(err){
                console.log(getLang("CustomConfigReadFailed", [`%error|${err}`]))
                saveCustomConfig(defaultConfig).then(function(){
                    console.log(getLang("CustomConfigSaved"))
                }).catch(error=>{
                    console.log(getLang("CustomConfigSavedFailed", [`%error|${error}`]))
                })
            }else{
                try{
                    defaultConfig = JSON.parse(str)
                }catch(err){
                    webContentsSend("V2Ray-log", getLang("CustomConfigParseError"))
                    saveCustomConfig(defaultConfig).then(function(){
                        console.log(getLang("CustomConfigSaved"))
                    }).catch(error=>{
                        console.log(getLang("CustomConfigSavedFailed", [`%error|${error}`]))
                    })
                }
            }
            customSubscribes = defaultConfig.subscribe
            console.log(getLang("CustomConfigDone", [`%subscribe|${customSubscribes.length}`]))
        })
        return resolve()
    })
}

function getCustomDefaultConfig(){
    var defaultConfig = {
        "subscribe" : [],
    }
    return defaultConfig
}

function saveCustomConfig(config){
    return new Promise((resolve, reject) => {
        fs.writeFile(customConfigPath, JSON.stringify(config, null, 4) ,{flag:'w',encoding:'utf-8',mode:'0666'}, function(err){
            if(err){
                return reject(err)
            }else{
                return resolve(true)
            }
        })
    })
}

function saveUpdateCustomConfig(){
    var newConfig = {
        "subscribe" : customSubscribes,
    }
    saveCustomConfig(newConfig).then(function(){
        webContentsSend("V2Ray-log", getLang("CustomConfigUpdated"))
    }).catch(error=>{
        webContentsSend("V2Ray-log", getLang("CustomConfigSavedFailed", [`%error|${error}`]))
    })
}

function getCustomConfigs(){
    parseSubscribes()
}

function parseSubscribes(){
    if(customSubscribes.length > 0){
        for (var i = customSubscribes.length - 1; i >= 0; i--) {
            parseSubscribeUrlInfo(customSubscribes[i])
        }   
    }else{
        webContentsSendAction("onMainCallExec", "noCustomData", "Subscribe", true)
    }
}

function parseSubscribeUrlInfo(url){
    var nodeinfo = {
        "url" : url,
        "datas" : []
    }
    if(url.indexOf("|") >= 0){
        urll = url.split("|")
        url = urll[1]
    }
    request({url: url, timeout: 3000}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if(isBase64(body)){
                var rdata = Buffer.from(body, 'base64').toString()
                rdata = rdata.split("\n")
                var datas = []
                for (var ii = rdata.length - 1; ii >= 0; ii--) {
                    var rdataa = replaceAll(rdata[ii], "vmess://", "")
                    if(isBase64(rdataa)){
                        var irdata = Buffer.from(rdataa, 'base64').toString()
                        try{
                            irdata = JSON.parse(irdata)
                            if(typeof(irdata) == "object" && irdata){
                                datas.push(irdata)
                            }
                        }catch(error){
                            //console.log(error)
                        }
                    }
                }
                nodeinfo.datas.push(datas)
            }
        }
        updateParseSubscribeData(nodeinfo)
    })
}

function updateParseSubscribeData(arr){
    webContentsSendAction("onMainCallExec", "parseSubscribeData", JSON.stringify(arr), true)
}

//System other functions
function jumpToLog(){
    var logAction = {
        "actions" : [
            "v-pills-5|set|tab-pane animated fadeInUpShort go",
            "v-pills-1|set|tab-pane animated fadeInUpShort go",
            "v-pills-2|set|tab-pane animated fadeInUpShort go",
            "v-pills-3|set|tab-pane animated fadeInUpShort go",
            "v-pills-4|set|tab-pane animated fadeInUpShort go show active",
            "v-pills-6|set|tab-pane animated fadeInUpShort go",
            "v-pills-7|set|tab-pane animated fadeInUpShort go",
            "v-pills-4-tab|set|nav-link active",
            "v-pills-1-tab|set|nav-link",
            "v-pills-2-tab|set|nav-link",
            "v-pills-3-tab|set|nav-link",
            "v-pills-7-tab|set|nav-link"
        ]
    }
    webContentsSend("onMainFrameChange", JSON.stringify(logAction))
}

function jumpToMain(){
    var logAction = {
        "actions" : [
            "v-pills-1|set|tab-pane animated fadeInUpShort go show active",
            "v-pills-2|set|tab-pane animated fadeInUpShort go",
            "v-pills-3|set|tab-pane animated fadeInUpShort go",
            "v-pills-4|set|tab-pane animated fadeInUpShort go",
            "v-pills-5|set|tab-pane animated fadeInUpShort go",
            "v-pills-6|set|tab-pane animated fadeInUpShort go",
            "v-pills-7|set|tab-pane animated fadeInUpShort go",
            "v-pills-1-tab|set|nav-link active",
            "v-pills-2-tab|set|nav-link",
            "v-pills-3-tab|set|nav-link",
            "v-pills-4-tab|set|nav-link",
            "v-pills-7-tab|set|nav-link"
        ]
    }
    webContentsSend("onMainFrameChange", JSON.stringify(logAction))
}

function jumpToCustom(){
    var logAction = {
        "actions" : [
            "v-pills-1|set|tab-pane animated fadeInUpShort go",
            "v-pills-2|set|tab-pane animated fadeInUpShort go show active",
            "v-pills-3|set|tab-pane animated fadeInUpShort go",
            "v-pills-4|set|tab-pane animated fadeInUpShort go",
            "v-pills-5|set|tab-pane animated fadeInUpShort go",
            "v-pills-6|set|tab-pane animated fadeInUpShort go",
            "v-pills-7|set|tab-pane animated fadeInUpShort go",
            "v-pills-1-tab|set|nav-link",
            "v-pills-2-tab|set|nav-link active",
            "v-pills-3-tab|set|nav-link",
            "v-pills-4-tab|set|nav-link",
            "v-pills-7-tab|set|nav-link"
        ]
    }
    webContentsSend("onMainFrameChange", JSON.stringify(logAction))
}

function sendSystemSettings(){
    var systemAction = {
        "actions" : [
            `Socks5Port|value|${Socks5V2Port}`,
            `HttpPort|value|${HttpV2Port}`,
            `PACPort|value|${PacPort}`,
        ]
    }
    webContentsSend("onMainFrameChange", JSON.stringify(systemAction))
}

function isBase64(str){
    var base64Test = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/gi
    var base64Test = new RegExp(base64Test)
    return base64Test.test(str)
}

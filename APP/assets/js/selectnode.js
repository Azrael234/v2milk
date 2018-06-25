'use strict';

const remote = require('electron').remote
const ipc = require('electron').ipcRenderer;
const BrowserWindow = require('electron').remote.BrowserWindow;
const currentWindow = remote.getCurrentWindow();

const inputNode = document.getElementById('inputNode')
const inputMode = document.getElementById('inputMode')
const btnconnect = document.getElementById('btn-connect')
const btnpackage = document.getElementById('btn-package')
const btnusage = document.getElementById('btn-usage')
const btntransferenable = document.getElementById('btn-transfer-enable')
const btnquit = document.getElementById('btn-quit')
const btnlog = document.getElementById('btn-log')
var status = false;
let logWindow = null

btnquit.addEventListener('click', () => {
    if(logWindow !== null){
        logWindow.close()
    }
    currentWindow.close()
})

btnlog.addEventListener('click', () => {
    logWindow = new BrowserWindow(
        {
            width: 700,
            height: 480,
            resizable: false,
            maximizable: false,
            skipTaskbar: true
        }
    )
    logWindow.loadFile('log.html')

    logWindow.on('closed', function () {
        logWindow = null
    })
})

btnconnect.addEventListener('click', () => {
    btnconnect.disabled = true
    if(!status){
        status = true
        var nodearr = inputNode.options[inputNode.selectedIndex].value.split("|")
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
                "port" : 1081,
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
                "port" : 8001,
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
                "loglevel" : "info",
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
            "routing" : {
                "strategy" : "rules",
                "settings" : {
                  "domainStrategy" : "IPIfNonMatch",
                  "rules" : [
                    {
                      "port" : "1-52",
                      "type" : "field",
                      "outboundTag" : "direct"
                    },
                    {
                      "port" : "54-79",
                      "type" : "field",
                      "outboundTag" : "direct"
                    },
                    {
                      "port" : "81-442",
                      "type" : "field",
                      "outboundTag" : "direct"
                    },
                    {
                      "port" : "444-65535",
                      "type" : "field",
                      "outboundTag" : "direct"
                    },
                    {
                      "type" : "field",
                      "ip" : [
                        "0.0.0.0\/8",
                        "10.0.0.0\/8",
                        "100.64.0.0\/10",
                        "127.0.0.0\/8",
                        "169.254.0.0\/16",
                        "172.16.0.0\/12",
                        "192.0.0.0\/24",
                        "192.0.2.0\/24",
                        "192.168.0.0\/16",
                        "198.18.0.0\/15",
                        "198.51.100.0\/24",
                        "203.0.113.0\/24",
                        "::1\/128",
                        "fc00::\/7",
                        "fe80::\/10",
                        "geoip:cn"
                      ],
                      "outboundTag" : "direct"
                    },
                    {
                      "type" : "field",
                      "outboundTag" : "direct",
                      "domain" : [
                        "geosite:cn"
                      ]
                    }
                  ]
                }
            },
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
                        "address" : nodearr[1],
                        "port" :parseInt(nodearr[2]),
                        "users" : [
                            {
                                "id" : nodearr[9],
                                "alterId" : 64,
                                "security" : "aes-128-cfb",
                                "level" : 0
                            }
                        ],
                        "remark" : nodearr[0]
                    }
                  ]
            },
            "streamSettings" : {
              "wsSettings" : {
                "path" : nodearr[6],
                "headers" : {
                  "Host" : nodearr[5]
                }
              },
              "tcpSettings" : {
                "header" : {
                  "type" : "none"
                }
              },
              "security" : "none",
              "tlsSettings" : {
                "serverName" : nodearr[5],
                "allowInsecure" : false
              },
              "kcpSettings" : {
                "header" : {
                  "type" : "none"
                },
                "mtu" : 1350,
                "congestion" : false,
                "tti" : 20,
                "uplinkCapacity" : 5,
                "writeBufferSize" : 1,
                "readBufferSize" : 1,
                "downlinkCapacity" : 20
              },
              "network" : nodearr[7]
            }
          }
        }
        ipc.send('write-json', JSON.stringify(jsonarr))
        setTimeout(function(){ipc.send('start-v2ray', inputMode.value)},500);
        btnconnect.value = "断开"
        btnconnect.setAttribute("class", "btn btn-danger")
    }else{
        status = false
        btnconnect.value = "连接"
        btnconnect.setAttribute("class", "btn btn-primary")
        ipc.send('stop-v2ray')
    }
    setTimeout(function(){btnconnect.disabled = false},3000);
})

ipc.on("V2Ray-status", function(event, message) {
    var data = JSON.parse(message);
    if(data.status == "error"){
        btnconnect.value = "连接"
        btnconnect.setAttribute("class", "btn btn-primary")
        ipc.send('stop-v2ray')
        status = false
    }
    alert(data.message)
});

ipc.on('dataJsonNode', function(event, message) {
    //alert(JSON.stringify(message))
    btnpackage.innerHTML = message['package']
    btnusage.innerHTML = parseInt(message['usage'] / 1048576) + " MB"
    if(message['nodes'].length == 0){
        alert("目前没有线路")
        inputNode.options.add((new Option("无","0")));
        btnconnect.setAttribute("disabled", true);
    }else{
        for (var i = 0; i < message.nodes.length; i++) {
            var nodename = message['nodes'][i].split("|")
            inputNode.options.add((new Option(nodename[0],message['nodes'][i] + "|" + message.uuid)));
        }
    }
    /*try{
        var dataa = JSON.parse(message);
        if(dataa.result == "success"){
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
    }*/
});

ipc.on("V2Ray-log", function(event, message) {
    if(logWindow !== null){
        logWindow.webContents.send('V2Ray-logger', message)
    }
});
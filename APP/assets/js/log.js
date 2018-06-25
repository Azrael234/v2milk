'use strict';

const remote = require('electron').remote
const ipc = require('electron').ipcRenderer;
const currentWindow = remote.getCurrentWindow();
const btnclose = document.getElementById('btn-close')
const btnlog = document.getElementById('V2log')

btnclose.addEventListener('click', () => {
	currentWindow.close()
})

ipc.on("V2Ray-logger", function(event, message) {
    btnlog.append(message);
    btnlog.append("\r\n");
    btnlog.scrollTop = btnlog.scrollHeight
    //alert(message)
});
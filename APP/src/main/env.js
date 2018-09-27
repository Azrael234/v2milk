var os = require('os')

const platform = os.platform()

const isWin = platform === 'win32'
const isMac = platform === 'darwin'
const isLinux = platform === 'linux'

//const isDev = process.env.NODE_ENV !== 'production'
const isDev = false

module.exports = {
	isWin,
	isMac,
	isLinux,
	isDev
}
'use strict';
var crypto = require('crypto');
var base64 = require('./base64.js')

function uc_authcode(str, operation, key, expiry) {
    var operation = operation ? operation : 'DECODE';
    var key = key ? key : '';
    var expiry = expiry ? expiry : 0;
    var ckey_length = 4;
    key = md5(key);
    var keya = md5(key.substr(0, 16));
    var keyb = md5(key.substr(16, 16));
    if(ckey_length){
        if(operation == 'DECODE'){
            var keyc = str.substr(0, ckey_length);
        }else{
            var md5_time = md5(microtime());
            var start = md5_time.length - ckey_length;
            var keyc = md5_time.substr(start, ckey_length)
        }
    }else{
        var keyc = '';
    }
    var cryptkey = keya + md5(keya + keyc);
    var strbuf;
    var tmpstr;
    if (operation == 'DECODE') {
        str = str.substr(ckey_length);
        strbuf = base64.base64_decode(str);
    } else {
        expiry = expiry ? expiry + time() : 0;
        tmpstr = expiry.toString();
        if (tmpstr.length >= 10)
            str = tmpstr.substr(0, 10) + md5(str + keyb).substr(0, 16) + str;
        else {
            var count = 10 - tmpstr.length;
            for (var i = 0; i < count; i++) {
                tmpstr = '0' + tmpstr;
            }
            str = tmpstr + md5(str + keyb).substr(0, 16) + str;
        }
        strbuf = str;
    }
    var box = new Array(256);
    for (var i = 0; i < 256; i++) {
        box[i] = i;
    }
    var rndkey = new Array();
    for (var i = 0; i < 256; i++) {
        rndkey[i] = cryptkey.charCodeAt(i % cryptkey.length);
    }
    var tmp
    for (var j = i = 0; i < 256; i++) {
        j = (j + box[i] + rndkey[i]) % 256;
        tmp = box[i];
        box[i] = box[j];
        box[j] = tmp;
    }
    var s = '';
    strbuf = strbuf.split('');
    for (var a = j = i = 0; i < strbuf.length; i++) {
        a = (a + 1) % 256;
        j = (j + box[a]) % 256;
        tmp = box[a];
        box[a] = box[j];
        box[j] = tmp;
        s += chr(ord(strbuf[i])^(box[(box[a] + box[j]) % 256]));
    }
    if (operation == 'DECODE') {
        if ((s.substr(0, 10) == 0 || s.substr(0, 10) - time() > 0) && s.substr(10, 16) == md5(s.substr(26) + keyb).substr(0, 16)) {
            s = s.substr(26);
        } else {
            s = '';
        }
    } else {
        s = base64.base64_encode(s);
        var regex = new RegExp('=', "g");
        s = s.replace(regex, '');
        s = keyc + s;
    }  
    return s;
}

function licenseDecodePart($string, $key){
    $key = sha1($key);
    var $strLen = $string.length;
    var $keyLen = $key.length;
    var $i = 0;
    var $j = 0;
    var $hash = "";
    var $ordStr = 0;
    var $ordKey = 0;
    while( $i < $strLen ) 
    {
        $ordStr = hexdec(base_convert(strrev(substr($string, $i, 2)), 36, 16));
        if( $j == $keyLen ) 
        {
            $j = 0;
        }
        $ordKey = ord(substr($key, $j, 1));
        $j++;
        $hash = $hash + chr($ordStr - $ordKey);
        $i += 2;
    }
    return $hash;
}

function time() {  
    var unixtime_ms = new Date().getTime();  
    return parseInt(unixtime_ms / 1000);  
}  

function microtime(get_as_float) {  
    var unixtime_ms = new Date().getTime();  
    var sec = parseInt(unixtime_ms / 1000);  
    return get_as_float ? (unixtime_ms / 1000) : (unixtime_ms - (sec * 1000)) / 1000 + ' ' + sec;  
} 

function chr(s) {  
    return String.fromCharCode(s);  
}

function ord(s) {  
    return s.charCodeAt();  
}  

function md5(str) {  
    return crypto.createHash('md5').update(str).digest('hex');
}  

function sha1(str){
    return crypto.createHash('sha1').update(str).digest('hex');
}

function hexdec(str){
    return parseInt(str,16)
}

function base_convert(str, from, to){
    return parseInt(str, from).toString(to); 
}

function strrev(str){
    return str.split("").reverse().join("")
}

function substr(str, i, i2){
    return str.substr(i, i2)
}

function strlen(str){
    return str.length
}

module.exports = {
    uc_authcode,
    licenseDecodePart,
    time,
    microtime,
    chr,
    ord,
    md5,
    sha1,
    hexdec,
    base_convert,
    strrev,
    substr,
    strlen
};
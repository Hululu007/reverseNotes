function bypass_vpnCheck() {
    Java.perform(function () {
        // 篡改检测
        let String = Java.use("java.lang.String");
        let NetworkInterface = Java.use("java.net.NetworkInterface");
        NetworkInterface.getName.implementation = function () {
            console.log("call java.net.NetworkInterface.getName()");
            var result = this.getName();
            console.log("find getName：", result);
            if (result && (result.indexOf("ppp0") > -1 || result.indexOf("tun0") > -1)) {
                return "rmnet_data0";
            }
        }
        // 篡改getAll(hooker工具包js)
        NetworkInterface.getAll.implementation = function () {
            var nis = this.getAll();
            console.log("call java.net.NetworkInterface.getAll()");
            nis.forEach(function (ni) {
                if (ni.name.value.indexOf("tun0") >= 0 || ni.name.value.indexOf("ppp0") >= 0 || ni.displayName.value.indexOf("tun0") >= 0 || ni.displayName.value.indexOf("ppp0") >= 0) {
                    ni.name.value = "rmnet_data0";
                    ni.displayName.value = "rmnet_data0";
                }
            })
            return nis;
        }


        // 2.  hook-- android.net.ConnectivityManager.getNetworkCapabilities
        // 这个部分的hook代码有一部分来自hooker工具包
        var can_hook = false;
        // 检测监听
        let ConnectivityManager = Java.use("android.net.ConnectivityManager");
        ConnectivityManager.getNetworkInfo.overload('int').implementation = function () {
            if (arguments[0] === 17) {
                can_hook = true
            }
            let ret = this["getNetworkInfo"](arguments[0]);
            console.log("find getNetworkInfo：", ret)
            return ret;
        }
        // 篡改返回值
        let NetworkInfo = Java.use("android.net.NetworkInfo")
        NetworkInfo.isConnected.implementation = function () {
            let ret = this.isConnected()
            if (can_hook) {
                ret = false
                can_hook = false
                console.log("call isConnected function !!!")
            }
            return ret
        }
        // 禁用网络能力检测
        ConnectivityManager.getNetworkCapabilities.implementation = function (arg) {
            let result = this["getNetworkCapabilities"](arg);
            console.log("find getNetworkCapabilities：", result);
            return null;
        }

        // 3. hook-- android.net.NetworkCapabilities.hasTransport
        // 篡改是否转发
        let NetworkCapabilities = Java.use("android.net.NetworkCapabilities");
        NetworkCapabilities.hasTransport.implementation = function (v) {
            console.log(v);
            let res = this["hasTransport"](v);
            console.log("res hasTransport ==> ", res)
            return false;
        }
        // 篡改vpn为wifi
        NetworkCapabilities.transportNameOf.overload('int').implementation = function () {
            let ret = this["transportNameOf"](arguments[0]);
            if (ret.indexOf("VPN") >= 0) {
                return "WIFI";
            }
            return ret;
        }
    })
}

setImmediate(bypass_vpnCheck)

package com.church.timer.offline.util

import android.content.Context
import android.net.wifi.WifiManager
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections
import java.util.Locale

object NetworkUtils {

    /**
     * Resolves the device's local IP address (Wi-Fi or Hotspot).
     * Falls back to standard Android Hotspot gateway "192.168.43.1" or "127.0.0.1".
     */
    fun getLocalIpAddress(context: Context): String {
        try {
            // First check Wi-Fi connection IP via WifiManager
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            if (wifiManager != null && wifiManager.isWifiEnabled) {
                @Suppress("DEPRECATION")
                val ipInt = wifiManager.connectionInfo.ipAddress
                if (ipInt != 0) {
                    return String.format(
                        Locale.getDefault(),
                        "%d.%d.%d.%d",
                        ipInt and 0xff,
                        ipInt shr 8 and 0xff,
                        ipInt shr 16 and 0xff,
                        ipInt shr 24 and 0xff
                    )
                }
            }

            // Inspect network interfaces (supports Hotspot ap0/wlan0/swlan0/rndis)
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            var candidateIp: String? = null

            for (networkInterface in interfaces) {
                if (networkInterface.isLoopback || !networkInterface.isUp) continue

                val name = networkInterface.name.lowercase(Locale.getDefault())
                val addresses = Collections.list(networkInterface.inetAddresses)

                for (address in addresses) {
                    if (address is Inet4Address && !address.isLoopbackAddress) {
                        val hostAddress = address.hostAddress ?: continue

                        // Priority 1: Hotspot specific AP interfaces
                        if (name.contains("ap") || name.contains("hotspot") || name.contains("softap")) {
                            return hostAddress
                        }

                        // Priority 2: Standard Wi-Fi interface
                        if (name.contains("wlan")) {
                            candidateIp = hostAddress
                        } else if (candidateIp == null) {
                            candidateIp = hostAddress
                        }
                    }
                }
            }

            if (candidateIp != null) {
                return candidateIp
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Standard default for Android portable Wi-Fi Hotspot
        return "192.168.43.1"
    }

    fun getServerUrl(context: Context, port: Int = 8080): String {
        val ip = getLocalIpAddress(context)
        return "http://$ip:$port/display"
    }
}

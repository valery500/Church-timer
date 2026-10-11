package com.church.timer.offline.server

import android.content.Context
import com.church.timer.offline.manager.TimerManager
import fi.iki.elonen.NanoHTTPD
import java.io.InputStream

/**
 * Embedded NanoHTTPD web server serving the TV display HTML and
 * streaming JSON timer updates locally with zero external internet dependencies.
 */
class NanoHttpdServer(
    private val context: Context,
    port: Int = 8080
) : NanoHTTPD("0.0.0.0", port) {

    private var cachedHtml: String? = null

    private fun loadDisplayHtml(): String {
        cachedHtml?.let { return it }
        return try {
            val inputStream: InputStream = context.assets.open("display.html")
            val html = inputStream.bufferedReader().use { it.readText() }
            cachedHtml = html
            html
        } catch (e: Exception) {
            "<!DOCTYPE html><html><body style='background:#0a0a0a;color:#fff;'><h1>Church Timer Offline</h1><p>Display asset missing</p></body></html>"
        }
    }

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri

        return when {
            uri == "/" || uri == "/display" -> {
                val html = loadDisplayHtml()
                val response = newFixedLengthResponse(Response.Status.OK, "text/html", html)
                response.addHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                response
            }
            uri == "/time" -> {
                val json = TimerManager.getJsonStatus()
                val response = newFixedLengthResponse(Response.Status.OK, "application/json", json)
                response.addHeader("Access-Control-Allow-Origin", "*")
                response.addHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                response
            }
            uri == "/api/control" -> {
                val params = session.parms
                when (params["action"]) {
                    "start" -> TimerManager.start()
                    "pause" -> TimerManager.pause()
                    "skip" -> TimerManager.skip()
                    "add1min" -> TimerManager.addOneMinute()
                }
                val response = newFixedLengthResponse(Response.Status.OK, "application/json", "{\"status\":\"ok\"}")
                response.addHeader("Access-Control-Allow-Origin", "*")
                response
            }
            else -> {
                newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404 Not Found")
            }
        }
    }
}

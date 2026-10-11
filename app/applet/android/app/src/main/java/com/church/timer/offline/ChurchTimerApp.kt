package com.church.timer.offline

import android.app.Application
import com.church.timer.offline.manager.TimerManager

class ChurchTimerApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize TimerManager singleton with application context
        TimerManager.init(this)
    }
}

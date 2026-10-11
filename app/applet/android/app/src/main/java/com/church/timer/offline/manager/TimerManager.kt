package com.church.timer.offline.manager

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.church.timer.offline.model.ActivityItem
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.Locale

/**
 * Singleton timer manager governing church service timing, countdown,
 * auto-advance, tone and vibration feedback, and JSON status serialization.
 */
object TimerManager {

    private const val PREFS_NAME = "church_timer_prefs"
    private const val KEY_ACTIVITIES = "key_activities_json"
    private const val TIME_UP_DURATION_SECONDS = 5

    private val gson = Gson()
    private val mainHandler = Handler(Looper.getMainLooper())

    private var toneGenerator: ToneGenerator? = null
    private var vibrator: Vibrator? = null

    val activities = mutableListOf<ActivityItem>()
    var currentIndex: Int = 0
        private set

    // LiveData for UI and Server observation
    private val _remainingSeconds = MutableLiveData(0)
    val remainingSeconds: LiveData<Int> = _remainingSeconds

    private val _currentActivity = MutableLiveData<ActivityItem?>()
    val currentActivity: LiveData<ActivityItem?> = _currentActivity

    private val _nextActivity = MutableLiveData<ActivityItem?>()
    val nextActivity: LiveData<ActivityItem?> = _nextActivity

    private val _isRunning = MutableLiveData(false)
    val isRunning: LiveData<Boolean> = _isRunning

    private val _isTimeUp = MutableLiveData(false)
    val isTimeUp: LiveData<Boolean> = _isTimeUp

    private val _progressPercent = MutableLiveData(0)
    val progressPercent: LiveData<Int> = _progressPercent

    private var timeUpCountdown: Int = 0

    // Countdown tick runnable
    private val timerRunnable = object : Runnable {
        override fun run() {
            if (_isRunning.value != true) return

            if (_isTimeUp.value == true) {
                // Handling 5-second red flashing phase
                timeUpCountdown--
                if (timeUpCountdown <= 0) {
                    _isTimeUp.value = false
                    advanceToNextActivity()
                } else {
                    mainHandler.postDelayed(this, 1000)
                }
                return
            }

            val currentRemaining = _remainingSeconds.value ?: 0
            if (currentRemaining > 1) {
                val newRemaining = currentRemaining - 1
                _remainingSeconds.value = newRemaining
                updateProgress(newRemaining)
                mainHandler.postDelayed(this, 1000)
            } else {
                // Time has run out!
                _remainingSeconds.value = 0
                _isTimeUp.value = true
                timeUpCountdown = TIME_UP_DURATION_SECONDS
                updateProgress(0)

                triggerAlarmFeedback()

                mainHandler.postDelayed(this, 1000)
            }
        }
    }

    fun init(context: Context) {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, 100)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

        loadActivitiesFromPreferences(context)
        if (activities.isEmpty()) {
            loadDefaultActivities()
            saveActivitiesToPreferences(context)
        }
        selectActivity(0)
    }

    private fun loadDefaultActivities() {
        activities.clear()
        activities.add(ActivityItem(name = "Praise", durationSeconds = 10 * 60))
        activities.add(ActivityItem(name = "Word", durationSeconds = 40 * 60))
        activities.add(ActivityItem(name = "Offering", durationSeconds = 10 * 60))
    }

    fun loadActivitiesFromPreferences(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_ACTIVITIES, null)
        if (!json.isNullOrEmpty()) {
            val type = object : TypeToken<List<ActivityItem>>() {}.type
            val list: List<ActivityItem>? = gson.fromJson(json, type)
            if (!list.isNullOrEmpty()) {
                activities.clear()
                activities.addAll(list)
            }
        }
    }

    fun saveActivitiesToPreferences(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = gson.toJson(activities)
        prefs.edit().putString(KEY_ACTIVITIES, json).apply()
    }

    fun selectActivity(index: Int) {
        if (activities.isEmpty()) {
            currentIndex = 0
            _currentActivity.value = null
            _nextActivity.value = null
            _remainingSeconds.value = 0
            _progressPercent.value = 0
            return
        }

        currentIndex = index.coerceIn(0, activities.size - 1)
        val current = activities[currentIndex]
        _currentActivity.value = current
        _nextActivity.value = if (currentIndex + 1 < activities.size) activities[currentIndex + 1] else null

        _remainingSeconds.value = current.durationSeconds
        _isTimeUp.value = false
        updateProgress(current.durationSeconds)
    }

    fun start() {
        if (activities.isEmpty()) return
        if (_isRunning.value == true) return

        if ((_remainingSeconds.value ?: 0) <= 0) {
            val current = activities.getOrNull(currentIndex)
            _remainingSeconds.value = current?.durationSeconds ?: 0
            _isTimeUp.value = false
        }

        _isRunning.value = true
        mainHandler.removeCallbacks(timerRunnable)
        mainHandler.postDelayed(timerRunnable, 1000)
    }

    fun pause() {
        _isRunning.value = false
        mainHandler.removeCallbacks(timerRunnable)
    }

    fun resume() {
        if (_isRunning.value != true) {
            start()
        }
    }

    fun skip() {
        mainHandler.removeCallbacks(timerRunnable)
        _isTimeUp.value = false
        advanceToNextActivity()
    }

    fun addOneMinute() {
        val currentRemaining = _remainingSeconds.value ?: 0
        val newRemaining = currentRemaining + 60
        _remainingSeconds.value = newRemaining
        if (_isTimeUp.value == true) {
            _isTimeUp.value = false
        }
        updateProgress(newRemaining)
    }

    private fun advanceToNextActivity() {
        if (activities.isEmpty()) return

        if (currentIndex + 1 < activities.size) {
            selectActivity(currentIndex + 1)
            // Auto start next activity
            start()
        } else {
            // End of service
            pause()
            _remainingSeconds.value = 0
            _progressPercent.value = 100
        }
    }

    private fun updateProgress(remaining: Int) {
        val total = _currentActivity.value?.durationSeconds ?: 1
        if (total <= 0) {
            _progressPercent.value = 0
            return
        }
        val elapsed = (total - remaining).coerceAtLeast(0)
        val percent = ((elapsed.toFloat() / total.toFloat()) * 100).toInt().coerceIn(0, 100)
        _progressPercent.value = percent
    }

    private fun triggerAlarmFeedback() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 1200)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 400, 200, 400), -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(longArrayOf(0, 400, 200, 400), -1)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun formatTime(seconds: Int): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return String.format(Locale.getDefault(), "%02d:%02d", mins, secs)
    }

    /**
     * Serializes current state to JSON for NanoHTTPD /time endpoint
     */
    fun getJsonStatus(): String {
        val current = _currentActivity.value
        val next = _nextActivity.value
        val remaining = _remainingSeconds.value ?: 0
        val running = _isRunning.value ?: false
        val timeUp = _isTimeUp.value ?: false
        val progress = _progressPercent.value ?: 0

        val map = mapOf(
            "activityName" to (current?.name ?: "None"),
            "totalSeconds" to (current?.durationSeconds ?: 0),
            "remainingSeconds" to remaining,
            "formattedTime" to formatTime(remaining),
            "nextActivityName" to (next?.name ?: "End of Service"),
            "isRunning" to running,
            "isTimeUp" to timeUp,
            "progressPercent" to progress
        )
        return gson.toJson(map)
    }
}

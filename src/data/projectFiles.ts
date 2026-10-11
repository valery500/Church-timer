export interface ProjectFile {
  path: string;
  category: 'workflow' | 'gradle' | 'kotlin' | 'layout' | 'res' | 'asset';
  description: string;
  content: string;
}

export const ANDROID_FILES: ProjectFile[] = [
  {
    path: '.github/workflows/build.yml',
    category: 'workflow',
    description: 'GitHub Actions workflow to assemble APK without Android Studio',
    content: `name: Build ChurchTimerOffline Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Assemble Debug APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Grant Execute Permission to Gradle Wrapper
        run: chmod +x gradlew

      - name: Build Debug APK
        run: ./gradlew assembleDebug --stacktrace --no-daemon

      - name: Locate Generated APK
        run: |
          echo "Listing APK files..."
          ls -la app/build/outputs/apk/debug/

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ChurchTimerOffline-v1.0-debug
          path: app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
          retention-days: 30`
  },
  {
    path: 'build.gradle',
    category: 'gradle',
    description: 'Root Gradle configuration with AGP 8.2.2 and Kotlin 1.9.22',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
}

tasks.register('clean', Delete) {
    delete rootProject.buildDir
}`
  },
  {
    path: 'settings.gradle',
    category: 'gradle',
    description: 'Project settings and Maven repository configurations',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ChurchTimerOffline"
include ':app'`
  },
  {
    path: 'gradle.properties',
    category: 'gradle',
    description: 'Gradle JVM tuning, AndroidX flags, and caching',
    content: `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
org.gradle.daemon=false
org.gradle.parallel=true
org.gradle.caching=true`
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    category: 'gradle',
    description: 'Gradle wrapper properties pinning Gradle 8.4',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: 'app/build.gradle',
    category: 'gradle',
    description: 'App module build script with ViewBinding, NanoHTTPD & ZXing',
    content: `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.church.timer.offline'
    compileSdk 34

    defaultConfig {
        applicationId "com.church.timer.offline"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.7.0'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0'
    implementation 'androidx.recyclerview:recyclerview:1.3.2'

    // NanoHTTPD: 100% Offline Embedded HTTP Server
    implementation 'org.nanohttpd:nanohttpd:2.3.1'

    // ZXing: Offline QR code generator for instant TV browser scan
    implementation 'com.journeyapps:zxing-android-embedded:4.3.0'
    implementation 'com.google.zxing:core:3.5.3'

    // Gson: JSON persistence & API serialization
    implementation 'com.google.code.gson:gson:2.10.1'

    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'res',
    description: 'Application manifest with TV Leanback launcher and foreground permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.church.timer.offline">

    <!-- Offline local hotspot network permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Background persistence & foreground web service -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Android TV compatibility features -->
    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />

    <application
        android:name=".ChurchTimerApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ChurchTimerOffline"
        tools:targetApi="34">

        <!-- Phone Controller Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Android TV Display Activity with Leanback TV Launcher -->
        <activity
            android:name=".ui.TvDisplayActivity"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:exported="true"
            android:screenOrientation="landscape"
            android:theme="@style/Theme.ChurchTimerOffline.Tv">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Offline HTTP Server Foreground Service -->
        <service
            android:name=".server.ServerService"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Local Wi-Fi Hotspot NanoHTTPD Web Broadcast for Church TV" />
        </service>

    </application>

</manifest>`
  },
  {
    path: 'app/src/main/assets/display.html',
    category: 'asset',
    description: '100% offline TV web display with 20vw typography, AudioContext beep, and polling',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Church Timer - TV Display</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      background-color: #0a0a0a;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: background-color 0.2s ease;
    }

    body.time-up-mode {
      animation: flash-bg 0.8s infinite alternate;
    }
    @keyframes flash-bg {
      0% { background-color: #7f1d1d; }
      100% { background-color: #b91c1c; }
    }

    .top-bar {
      width: 100%;
      padding: 2.5vh 4vw;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }
    .current-activity {
      font-size: 4.5vw;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80vw;
    }
    .current-activity span {
      color: #eab54d;
      font-weight: 900;
      margin-right: 1.2vw;
    }
    .status-badge {
      font-size: 1.6vw;
      font-weight: 700;
      padding: 0.6vh 1.4vw;
      border-radius: 999px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .status-badge.live {
      background: rgba(34, 197, 94, 0.2);
      border-color: #22c55e;
      color: #4ade80;
    }
    .status-badge.paused {
      background: rgba(234, 181, 77, 0.2);
      border-color: #eab54d;
      color: #facc15;
    }

    .timer-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .timer-digits {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 20vw;
      font-weight: 900;
      line-height: 0.9;
      letter-spacing: -0.04em;
      color: #ffffff;
      text-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
      font-variant-numeric: tabular-nums;
    }
    .time-up-text {
      display: none;
      font-size: 10vw;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #ffffff;
      text-shadow: 0 8px 32px rgba(0,0,0,0.9);
      animation: pulse 0.6s infinite alternate;
      margin-top: 2vh;
    }
    body.time-up-mode .time-up-text {
      display: block;
    }

    .progress-bar-container {
      width: 100%;
      height: 2.2vh;
      background-color: #1a1a1a;
      overflow: hidden;
      position: relative;
    }
    .progress-bar-fill {
      height: 100%;
      width: 0%;
      background-color: #eab54d;
      transition: width 0.4s linear;
      box-shadow: 0 0 20px rgba(234, 181, 77, 0.6);
    }
    body.time-up-mode .progress-bar-fill {
      background-color: #ef4444;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
      width: 100% !important;
    }

    .bottom-bar {
      width: 100%;
      padding: 2.5vh 4vw;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(180deg, transparent, rgba(0,0,0,0.8));
    }
    .next-activity {
      font-size: 3.2vw;
      font-weight: 700;
      color: #a3a3a3;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 85vw;
    }
    .next-activity span {
      color: #737373;
      font-weight: 800;
      margin-right: 1vw;
    }
    .offline-tag {
      font-size: 1.5vw;
      font-weight: 700;
      color: #525252;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="current-activity" id="currentActivityLabel">
      <span>NOW:</span> <span id="currentName" style="color: #ffffff;">Loading...</span>
    </div>
    <div class="status-badge live" id="statusBadge">OFFLINE</div>
  </div>

  <div class="timer-container">
    <div class="timer-digits" id="timerDigits">--:--</div>
    <div class="time-up-text" id="timeUpBanner">TIME'S UP!</div>
  </div>

  <div class="progress-bar-container">
    <div class="progress-bar-fill" id="progressBar"></div>
  </div>

  <div class="bottom-bar">
    <div class="next-activity" id="nextActivityLabel">
      <span>NEXT:</span> <span id="nextName" style="color: #a3a3a3;">--</span>
    </div>
    <div class="offline-tag">100% OFFLINE</div>
  </div>

  <script>
    let audioCtx = null;
    let lastTimeUpState = false;

    function playBeep() {
      try {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.55);
      } catch (e) {
        console.warn('Audio blocked or unsupported:', e);
      }
    }

    window.addEventListener('click', () => {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }, { once: true });

    const currentNameEl = document.getElementById('currentName');
    const nextNameEl = document.getElementById('nextName');
    const timerDigitsEl = document.getElementById('timerDigits');
    const progressBarEl = document.getElementById('progressBar');
    const statusBadgeEl = document.getElementById('statusBadge');

    function updateDisplay(data) {
      if (!data) return;

      currentNameEl.textContent = data.activityName || 'None';
      nextNameEl.textContent = data.nextActivityName || 'End of Service';
      timerDigitsEl.textContent = data.formattedTime || '00:00';

      const progress = Math.min(100, Math.max(0, data.progressPercent || 0));
      progressBarEl.style.width = progress + '%';

      if (data.isTimeUp) {
        document.body.classList.add('time-up-mode');
        statusBadgeEl.textContent = "TIME UP";
        statusBadgeEl.className = "status-badge";
        statusBadgeEl.style.backgroundColor = "rgba(239, 68, 68, 0.4)";
        statusBadgeEl.style.borderColor = "#ef4444";
        statusBadgeEl.style.color = "#ffffff";

        if (!lastTimeUpState) {
          playBeep();
        }
      } else {
        document.body.classList.remove('time-up-mode');
        statusBadgeEl.style.backgroundColor = "";
        statusBadgeEl.style.borderColor = "";

        if (data.isRunning) {
          statusBadgeEl.textContent = "RUNNING";
          statusBadgeEl.className = "status-badge live";
        } else {
          statusBadgeEl.textContent = "PAUSED";
          statusBadgeEl.className = "status-badge paused";
        }
      }

      lastTimeUpState = !!data.isTimeUp;
    }

    async function pollTime() {
      try {
        const res = await fetch('/time', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          updateDisplay(data);
        }
      } catch (err) {
        statusBadgeEl.textContent = "CONNECTING...";
        statusBadgeEl.className = "status-badge paused";
      }
    }

    pollTime();
    setInterval(pollTime, 500);
  </script>
</body>
</html>`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/ChurchTimerApp.kt',
    category: 'kotlin',
    description: 'Application class initializing TimerManager singleton',
    content: `package com.church.timer.offline

import android.app.Application
import com.church.timer.offline.manager.TimerManager

class ChurchTimerApp : Application() {
    override fun onCreate() {
        super.onCreate()
        TimerManager.init(this)
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/model/ActivityItem.kt',
    category: 'kotlin',
    description: 'Data class for service activities with mm:ss duration formatter',
    content: `package com.church.timer.offline.model

import java.io.Serializable
import java.util.Locale

data class ActivityItem(
    val id: String = java.util.UUID.randomUUID().toString(),
    var name: String,
    var durationSeconds: Int
) : Serializable {

    fun formatDuration(): String {
        val minutes = durationSeconds / 60
        val seconds = durationSeconds % 60
        return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)
    }

    companion object {
        fun fromMinutesAndSeconds(name: String, minutes: Int, seconds: Int): ActivityItem {
            return ActivityItem(
                name = name,
                durationSeconds = (minutes * 60) + seconds
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/manager/TimerManager.kt',
    category: 'kotlin',
    description: 'Singleton timer controller with count down, sound alarm, auto-advance, and JSON generator',
    content: `package com.church.timer.offline.manager

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

    private val timerRunnable = object : Runnable {
        override fun run() {
            if (_isRunning.value != true) return

            if (_isTimeUp.value == true) {
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
            start()
        } else {
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
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/server/NanoHttpdServer.kt',
    category: 'kotlin',
    description: 'Embedded NanoHTTPD 2.3.1 serving display HTML and /time JSON',
    content: `package com.church.timer.offline.server

import android.content.Context
import com.church.timer.offline.manager.TimerManager
import fi.iki.elonen.NanoHTTPD
import java.io.InputStream

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
            "<!DOCTYPE html><html><body style='background:#0a0a0a;color:#fff;'><h1>Church Timer Offline</h1></body></html>"
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
                val response = newFixedLengthResponse(Response.Status.OK, "application/json", "{\\"status\\":\\"ok\\"}")
                response.addHeader("Access-Control-Allow-Origin", "*")
                response
            }
            else -> {
                newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "404 Not Found")
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/server/ServerService.kt',
    category: 'kotlin',
    description: 'Foreground service with ongoing notification, port 8080 binding, and partial wake lock',
    content: `package com.church.timer.offline.server

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.lifecycle.MutableLiveData
import com.church.timer.offline.ui.MainActivity
import com.church.timer.offline.util.NetworkUtils

class ServerService : Service() {

    companion object {
        const val CHANNEL_ID = "church_timer_offline_server_channel"
        const val NOTIFICATION_ID = 1001
        const val PORT = 8080

        const val ACTION_START = "ACTION_START_SERVER"
        const val ACTION_STOP = "ACTION_STOP_SERVER"

        val isServerRunning = MutableLiveData(false)

        fun startService(context: Context) {
            val intent = Intent(context, ServerService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, ServerService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var server: NanoHttpdServer? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = powerManager?.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ChurchTimerOffline::ServerWakeLock"
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopServer()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                startServer()
                startForeground(NOTIFICATION_ID, buildNotification())
                return START_STICKY
            }
        }
    }

    private fun startServer() {
        if (server == null) {
            try {
                server = NanoHttpdServer(applicationContext, PORT)
                server?.start()
                isServerRunning.postValue(true)

                if (wakeLock?.isHeld == false) {
                    wakeLock?.acquire(8 * 60 * 60 * 1000L)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                isServerRunning.postValue(false)
            }
        }
    }

    private fun stopServer() {
        try {
            server?.stop()
            server = null
            isServerRunning.postValue(false)

            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Church Timer Offline Server",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the local TV display server running without internet"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val ip = NetworkUtils.getLocalIpAddress(this)
        val serverUrl = "http://$ip:$PORT/display"

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, ServerService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Offline Timer Server Running")
            .setContentText("TV can connect to $serverUrl")
            .setSubText("100% Offline Mode")
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop Server", stopPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        stopServer()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/ui/MainActivity.kt',
    category: 'kotlin',
    description: 'Main Phone Controller activity with live timer, start/pause, QR code generator, and RecyclerView',
    content: `package com.church.timer.offline.ui

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.church.timer.offline.R
import com.church.timer.offline.databinding.ActivityMainBinding
import com.church.timer.offline.databinding.DialogAddActivityBinding
import com.church.timer.offline.manager.TimerManager
import com.church.timer.offline.model.ActivityItem
import com.church.timer.offline.server.ServerService
import com.church.timer.offline.util.NetworkUtils
import com.google.zxing.BarcodeFormat
import com.journeyapps.barcodescanner.BarcodeEncoder

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var activitiesAdapter: ActivitiesAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupControlButtons()
        setupTvConnectionCard()
        observeTimerManager()
        observeServerService()
    }

    override fun onResume() {
        super.onResume()
        refreshQrCodeAndIp()
    }

    private fun setupRecyclerView() {
        activitiesAdapter = ActivitiesAdapter(
            activities = TimerManager.activities,
            onItemClick = { position ->
                TimerManager.selectActivity(position)
                activitiesAdapter.selectedIndex = position
                activitiesAdapter.notifyDataSetChanged()
            },
            onItemDelete = { position ->
                if (TimerManager.activities.size <= 1) {
                    Toast.makeText(this, "At least one activity is required", Toast.LENGTH_SHORT).show()
                } else {
                    TimerManager.activities.removeAt(position)
                    TimerManager.saveActivitiesToPreferences(this)
                    activitiesAdapter.notifyItemRemoved(position)
                    if (position == TimerManager.currentIndex) {
                        TimerManager.selectActivity(0)
                    }
                }
            },
            onListOrderChanged = {
                TimerManager.saveActivitiesToPreferences(this)
            }
        )

        binding.rvActivities.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = activitiesAdapter
            setHasFixedSize(true)
        }

        val itemTouchCallback = object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN,
            ItemTouchHelper.LEFT or ItemTouchHelper.RIGHT
        ) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                val from = viewHolder.bindingAdapterPosition
                val to = target.bindingAdapterPosition
                return activitiesAdapter.onItemMove(from, to)
            }

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {
                val pos = viewHolder.bindingAdapterPosition
                if (TimerManager.activities.size <= 1) {
                    activitiesAdapter.notifyItemChanged(pos)
                    Toast.makeText(this@MainActivity, "At least one activity is required", Toast.LENGTH_SHORT).show()
                } else {
                    activitiesAdapter.onItemDismiss(pos)
                    TimerManager.saveActivitiesToPreferences(this@MainActivity)
                    if (pos == TimerManager.currentIndex) {
                        TimerManager.selectActivity(0)
                    }
                }
            }
        }
        ItemTouchHelper(itemTouchCallback).attachToRecyclerView(binding.rvActivities)

        binding.btnAddActivity.setOnClickListener {
            showAddActivityDialog()
        }
    }

    private fun setupControlButtons() {
        binding.btnMainStart.setOnClickListener {
            if (TimerManager.isRunning.value == true) {
                TimerManager.pause()
            } else {
                TimerManager.start()
            }
        }

        binding.btnPause.setOnClickListener {
            TimerManager.pause()
        }

        binding.btnSkipNext.setOnClickListener {
            TimerManager.skip()
        }

        binding.btnAddOneMin.setOnClickListener {
            TimerManager.addOneMinute()
        }

        binding.btnOpenTvView.setOnClickListener {
            val intent = Intent(this, TvDisplayActivity::class.java)
            startActivity(intent)
        }
    }

    private fun setupTvConnectionCard() {
        binding.btnServerToggle.setOnClickListener {
            val isRunning = ServerService.isServerRunning.value ?: false
            if (isRunning) {
                ServerService.stopService(this)
            } else {
                ServerService.startService(this)
            }
        }
    }

    private fun refreshQrCodeAndIp() {
        val ip = NetworkUtils.getLocalIpAddress(this)
        val serverUrl = "http://$ip:8080/display"

        binding.tvConnectionUrl.text = "$ip:8080/display - Scan on TV Browser - Offline"

        try {
            val barcodeEncoder = BarcodeEncoder()
            val bitmap: Bitmap = barcodeEncoder.encodeBitmap(serverUrl, BarcodeFormat.QR_CODE, 400, 400)
            binding.ivQrCode.setImageBitmap(bitmap)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun observeTimerManager() {
        TimerManager.remainingSeconds.observe(this) { seconds ->
            binding.tvBigTimer.text = TimerManager.formatTime(seconds)
        }

        TimerManager.currentActivity.observe(this) { activity ->
            if (activity != null) {
                binding.tvCurrentActivityLabel.text =
                    getString(R.string.current_activity_format, activity.name, activity.formatDuration())
            } else {
                binding.tvCurrentActivityLabel.text = "Service Complete"
            }
            activitiesAdapter.selectedIndex = TimerManager.currentIndex
            activitiesAdapter.notifyDataSetChanged()
        }

        TimerManager.nextActivity.observe(this) { next ->
            binding.tvNextActivityLabel.text = if (next != null) {
                getString(R.string.next_activity_format, next.name)
            } else {
                "Next: End of Service"
            }
        }

        TimerManager.isRunning.observe(this) { isRunning ->
            if (isRunning) {
                binding.btnMainStart.text = getString(R.string.pause)
                binding.btnMainStart.setBackgroundResource(R.drawable.bg_secondary_button)
            } else {
                binding.btnMainStart.text = getString(R.string.start)
                binding.btnMainStart.setBackgroundResource(R.drawable.bg_primary_button)
            }
        }

        TimerManager.progressPercent.observe(this) { progress ->
            binding.progressBar.progress = progress
        }

        TimerManager.isTimeUp.observe(this) { isTimeUp ->
            if (isTimeUp) {
                binding.tvBigTimer.setTextColor(ContextCompat.getColor(this, R.color.red_alert))
                binding.tvCurrentActivityLabel.text = getString(R.string.time_up)
            } else {
                binding.tvBigTimer.setTextColor(ContextCompat.getColor(this, R.color.white))
            }
        }
    }

    private fun observeServerService() {
        ServerService.isServerRunning.observe(this) { isRunning ->
            if (isRunning) {
                binding.tvServerStatus.text = getString(R.string.server_running)
                binding.tvServerStatus.setTextColor(ContextCompat.getColor(this, R.color.green_status))
                binding.btnServerToggle.text = getString(R.string.stop_offline_server)
                binding.btnServerToggle.setBackgroundResource(R.drawable.bg_secondary_button)
            } else {
                binding.tvServerStatus.text = getString(R.string.server_stopped)
                binding.tvServerStatus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
                binding.btnServerToggle.text = getString(R.string.start_offline_server)
                binding.btnServerToggle.setBackgroundResource(R.drawable.bg_primary_button)
            }
        }
    }

    private fun showAddActivityDialog() {
        val dialogBinding = DialogAddActivityBinding.inflate(LayoutInflater.from(this))
        val dialog = AlertDialog.Builder(this)
            .setView(dialogBinding.root)
            .create()

        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        dialogBinding.btnDialogCancel.setOnClickListener {
            dialog.dismiss()
        }

        dialogBinding.btnDialogAdd.setOnClickListener {
            val name = dialogBinding.etActivityName.text.toString().trim()
            val minutesStr = dialogBinding.etMinutes.text.toString().trim()
            val secondsStr = dialogBinding.etSeconds.text.toString().trim()

            if (name.isEmpty()) {
                dialogBinding.etActivityName.error = "Enter activity name"
                return@setOnClickListener
            }

            val minutes = minutesStr.toIntOrNull() ?: 0
            val seconds = secondsStr.toIntOrNull() ?: 0

            if (minutes == 0 && seconds == 0) {
                dialogBinding.etMinutes.error = "Duration must be greater than 0"
                return@setOnClickListener
            }

            val newActivity = ActivityItem.fromMinutesAndSeconds(name, minutes, seconds)
            TimerManager.activities.add(newActivity)
            TimerManager.saveActivitiesToPreferences(this)
            activitiesAdapter.notifyItemInserted(TimerManager.activities.size - 1)

            dialog.dismiss()
            Toast.makeText(this, "Added \${newActivity.name}", Toast.LENGTH_SHORT).show()
        }

        dialog.show()
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/ui/TvDisplayActivity.kt',
    category: 'kotlin',
    description: 'Native Android TV Activity with Leanback full-screen mode',
    content: `package com.church.timer.offline.ui

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.church.timer.offline.R
import com.church.timer.offline.databinding.ActivityTvDisplayBinding
import com.church.timer.offline.manager.TimerManager

class TvDisplayActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTvDisplayBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTvDisplayBinding.inflate(layoutInflater)
        setContentView(binding.root)

        enableImmersiveFullscreen()
        observeTimerManager()
    }

    private fun enableImmersiveFullscreen() {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    private fun observeTimerManager() {
        TimerManager.remainingSeconds.observe(this) { seconds ->
            binding.tvTvBigTimer.text = TimerManager.formatTime(seconds)
        }

        TimerManager.currentActivity.observe(this) { activity ->
            if (activity != null) {
                binding.tvTvCurrentActivity.text = "NOW: \${activity.name.uppercase()} (\${activity.formatDuration()})"
            } else {
                binding.tvTvCurrentActivity.text = "SERVICE COMPLETE"
            }
        }

        TimerManager.nextActivity.observe(this) { next ->
            binding.tvTvNextActivity.text = if (next != null) {
                "NEXT: \${next.name.uppercase()}"
            } else {
                "NEXT: END OF SERVICE"
            }
        }

        TimerManager.progressPercent.observe(this) { progress ->
            binding.tvProgressBar.progress = progress
        }

        TimerManager.isRunning.observe(this) { isRunning ->
            if (isRunning) {
                binding.tvTvStatusBadge.text = "LIVE"
                binding.tvTvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.green_status))
            } else {
                binding.tvTvStatusBadge.text = "PAUSED"
                binding.tvTvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.yellow_accent))
            }
        }

        TimerManager.isTimeUp.observe(this) { isTimeUp ->
            if (isTimeUp) {
                binding.rootTvLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.red_alert))
                binding.tvTvTimeUp.visibility = View.VISIBLE
                binding.tvTvStatusBadge.text = "TIME'S UP"
                binding.tvTvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                binding.rootTvLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.black))
                binding.tvTvTimeUp.visibility = View.GONE
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/ui/ActivitiesAdapter.kt',
    category: 'kotlin',
    description: 'RecyclerView Adapter with item move reordering and swipe dismissal',
    content: `package com.church.timer.offline.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.church.timer.offline.R
import com.church.timer.offline.databinding.ItemActivityBinding
import com.church.timer.offline.model.ActivityItem
import java.util.Collections

class ActivitiesAdapter(
    private val activities: MutableList<ActivityItem>,
    private val onItemClick: (Int) -> Unit,
    private val onItemDelete: (Int) -> Unit,
    private val onListOrderChanged: () -> Unit
) : RecyclerView.Adapter<ActivitiesAdapter.ViewHolder>() {

    var selectedIndex: Int = 0

    inner class ViewHolder(val binding: ItemActivityBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemActivityBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = activities[position]
        holder.binding.tvActivityName.text = item.name
        holder.binding.tvActivityDuration.text = item.formatDuration()

        if (position == selectedIndex) {
            holder.binding.itemContainer.setBackgroundResource(R.drawable.bg_card)
            holder.binding.tvActivityName.setTextColor(
                ContextCompat.getColor(holder.itemView.context, R.color.yellow_accent)
            )
        } else {
            holder.binding.itemContainer.setBackgroundResource(R.drawable.bg_card)
            holder.binding.tvActivityName.setTextColor(
                ContextCompat.getColor(holder.itemView.context, R.color.white)
            )
        }

        holder.itemView.setOnClickListener {
            val pos = holder.bindingAdapterPosition
            if (pos != RecyclerView.NO_POSITION) {
                onItemClick(pos)
            }
        }

        holder.binding.ivDelete.setOnClickListener {
            val pos = holder.bindingAdapterPosition
            if (pos != RecyclerView.NO_POSITION) {
                onItemDelete(pos)
            }
        }
    }

    override fun getItemCount(): Int = activities.size

    fun onItemMove(fromPosition: Int, toPosition: Int): Boolean {
        if (fromPosition < toPosition) {
            for (i in fromPosition until toPosition) {
                Collections.swap(activities, i, i + 1)
            }
        } else {
            for (i in fromPosition downTo toPosition + 1) {
                Collections.swap(activities, i, i - 1)
            }
        }
        notifyItemMoved(fromPosition, toPosition)
        onListOrderChanged()
        return true
    }

    fun onItemDismiss(position: Int) {
        if (position in 0 until activities.size) {
            activities.removeAt(position)
            notifyItemRemoved(position)
            onListOrderChanged()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/church/timer/offline/util/NetworkUtils.kt',
    category: 'kotlin',
    description: 'Hotspot and Wi-Fi interface IP resolver',
    content: `package com.church.timer.offline.util

import android.content.Context
import android.net.wifi.WifiManager
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections
import java.util.Locale

object NetworkUtils {

    fun getLocalIpAddress(context: Context): String {
        try {
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

            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            var candidateIp: String? = null

            for (networkInterface in interfaces) {
                if (networkInterface.isLoopback || !networkInterface.isUp) continue

                val name = networkInterface.name.lowercase(Locale.getDefault())
                val addresses = Collections.list(networkInterface.inetAddresses)

                for (address in addresses) {
                    if (address is Inet4Address && !address.isLoopbackAddress) {
                        val hostAddress = address.hostAddress ?: continue

                        if (name.contains("ap") || name.contains("hotspot") || name.contains("softap")) {
                            return hostAddress
                        }

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

        return "192.168.43.1"
    }

    fun getServerUrl(context: Context, port: Int = 8080): String {
        val ip = getLocalIpAddress(context)
        return "http://$ip:$port/display"
    }
}`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    category: 'layout',
    description: 'Dark UI Phone Controller layout with big timer, action buttons, and TV card',
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/black">

    <androidx.core.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:fillViewport="true">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="16dp">

            <RelativeLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="16dp">

                <TextView
                    android:id="@+id/tvHeaderTitle"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_alignParentStart="true"
                    android:layout_centerVertical="true"
                    android:text="@string/app_header_title"
                    android:textColor="@color/white"
                    android:textSize="20sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvOfflineBadge"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_alignParentEnd="true"
                    android:layout_centerVertical="true"
                    android:background="@drawable/bg_badge"
                    android:text="@string/offline_badge"
                    android:textColor="@color/green_status"
                    android:textSize="11sp"
                    android:textStyle="bold" />
            </RelativeLayout>

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:background="@drawable/bg_card"
                android:orientation="vertical"
                android:padding="20dp">

                <TextView
                    android:id="@+id/tvCurrentActivityLabel"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_horizontal"
                    android:text="Current: Word 40:00"
                    android:textColor="@color/yellow_accent"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvBigTimer"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_horizontal"
                    android:layout_marginTop="8dp"
                    android:layout_marginBottom="8dp"
                    android:fontFamily="monospace"
                    android:text="@string/default_timer"
                    android:textColor="@color/white"
                    android:textSize="64sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvNextActivityLabel"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_horizontal"
                    android:layout_marginBottom="14dp"
                    android:text="Next: Offering"
                    android:textColor="@color/text_secondary"
                    android:textSize="13sp" />

                <ProgressBar
                    android:id="@+id/progressBar"
                    style="?android:attr/progressBarStyleHorizontal"
                    android:layout_width="match_parent"
                    android:layout_height="8dp"
                    android:layout_marginBottom="20dp"
                    android:max="100"
                    android:progress="78"
                    android:progressDrawable="@drawable/progress_bar_custom" />

                <Button
                    android:id="@+id/btnMainStart"
                    android:layout_width="match_parent"
                    android:layout_height="56dp"
                    android:background="@drawable/bg_primary_button"
                    android:text="@string/start"
                    android:textColor="@color/white"
                    android:textSize="18sp"
                    android:textStyle="bold"
                    app:backgroundTint="@null" />

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="12dp"
                    android:orientation="horizontal"
                    android:weightSum="3">

                    <Button
                        android:id="@+id/btnPause"
                        android:layout_width="0dp"
                        android:layout_height="46dp"
                        android:layout_marginEnd="6dp"
                        android:layout_weight="1"
                        android:background="@drawable/bg_secondary_button"
                        android:text="@string/pause"
                        android:textColor="@color/white"
                        android:textSize="12sp"
                        android:textStyle="bold"
                        app:backgroundTint="@null" />

                    <Button
                        android:id="@+id/btnSkipNext"
                        android:layout_width="0dp"
                        android:layout_height="46dp"
                        android:layout_marginStart="3dp"
                        android:layout_marginEnd="3dp"
                        android:layout_weight="1"
                        android:background="@drawable/bg_secondary_button"
                        android:text="@string/skip_next"
                        android:textColor="@color/white"
                        android:textSize="11sp"
                        android:textStyle="bold"
                        app:backgroundTint="@null" />

                    <Button
                        android:id="@+id/btnAddOneMin"
                        android:layout_width="0dp"
                        android:layout_height="46dp"
                        android:layout_marginStart="6dp"
                        android:layout_weight="1"
                        android:background="@drawable/bg_secondary_button"
                        android:text="@string/plus_one_min"
                        android:textColor="@color/yellow_accent"
                        android:textSize="12sp"
                        android:textStyle="bold"
                        app:backgroundTint="@null" />
                </LinearLayout>
            </LinearLayout>

            <RelativeLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="24dp"
                android:layout_marginBottom="12dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_alignParentStart="true"
                    android:layout_centerVertical="true"
                    android:text="@string/activities_title"
                    android:textColor="@color/white"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/btnAddActivity"
                    android:layout_width="wrap_content"
                    android:layout_height="36dp"
                    android:layout_alignParentEnd="true"
                    android:layout_centerVertical="true"
                    android:background="@drawable/bg_primary_button"
                    android:paddingStart="14dp"
                    android:paddingEnd="14dp"
                    android:text="@string/add_activity"
                    android:textColor="@color/white"
                    android:textSize="12sp"
                    android:textStyle="bold"
                    app:backgroundTint="@null" />
            </RelativeLayout>

            <androidx.recyclerview.widget.RecyclerView
                android:id="@+id/rvActivities"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:nestedScrollingEnabled="false"
                tools:itemCount="3"
                tools:listitem="@layout/item_activity" />

            <LinearLayout
                android:id="@+id/cardTvConnection"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="24dp"
                android:background="@drawable/bg_card"
                android:orientation="vertical"
                android:padding="20dp">

                <RelativeLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginBottom="12dp">

                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:layout_alignParentStart="true"
                        android:layout_centerVertical="true"
                        android:text="@string/tv_connection_card_title"
                        android:textColor="@color/yellow_accent"
                        android:textSize="14sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/tvServerStatus"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:layout_alignParentEnd="true"
                        android:layout_centerVertical="true"
                        android:text="@string/server_stopped"
                        android:textColor="@color/text_secondary"
                        android:textSize="11sp"
                        android:textStyle="bold" />
                </RelativeLayout>

                <FrameLayout
                    android:layout_width="180dp"
                    android:layout_height="180dp"
                    android:layout_gravity="center_horizontal"
                    android:background="#ffffff"
                    android:padding="8dp">

                    <ImageView
                        android:id="@+id/ivQrCode"
                        android:layout_width="match_parent"
                        android:layout_height="match_parent"
                        android:contentDescription="TV Display QR Code"
                        android:scaleType="fitCenter" />
                </FrameLayout>

                <TextView
                    android:id="@+id/tvConnectionUrl"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_horizontal"
                    android:layout_marginTop="14dp"
                    android:fontFamily="monospace"
                    android:text="192.168.43.1:8080/display - Scan on TV Browser - Offline"
                    android:textAlignment="center"
                    android:textColor="@color/white"
                    android:textSize="13sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvConnectionInstruction"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_gravity="center_horizontal"
                    android:layout_marginTop="4dp"
                    android:layout_marginBottom="16dp"
                    android:text="Connect Smart TV to phone hotspot, open TV browser, scan or enter URL"
                    android:textAlignment="center"
                    android:textColor="@color/text_secondary"
                    android:textSize="11sp" />

                <Button
                    android:id="@+id/btnServerToggle"
                    android:layout_width="match_parent"
                    android:layout_height="50dp"
                    android:background="@drawable/bg_primary_button"
                    android:text="@string/start_offline_server"
                    android:textColor="@color/white"
                    android:textSize="14sp"
                    android:textStyle="bold"
                    app:backgroundTint="@null" />

                <Button
                    android:id="@+id/btnOpenTvView"
                    android:layout_width="match_parent"
                    android:layout_height="44dp"
                    android:layout_marginTop="8dp"
                    android:background="@drawable/bg_secondary_button"
                    android:text="@string/open_tv_view"
                    android:textColor="@color/text_secondary"
                    android:textSize="13sp"
                    app:backgroundTint="@null" />
            </LinearLayout>

        </LinearLayout>
    </androidx.core.widget.NestedScrollView>

</androidx.coordinatorlayout.widget.CoordinatorLayout>`
  },
  {
    path: 'app/src/main/res/layout/activity_tv_display.xml',
    category: 'layout',
    description: 'Android TV fullscreen layout with 110sp digits and TIME UP alert banner',
    content: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/rootTvLayout"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/black"
    android:keepScreenOn="true"
    android:padding="24dp">

    <RelativeLayout
        android:id="@+id/topBarTv"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_alignParentTop="true">

        <TextView
            android:id="@+id/tvTvCurrentActivity"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_alignParentStart="true"
            android:layout_centerVertical="true"
            android:text="NOW: WORD (40:00)"
            android:textColor="@color/white"
            android:textSize="28sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/tvTvStatusBadge"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_alignParentEnd="true"
            android:layout_centerVertical="true"
            android:background="@drawable/bg_badge"
            android:text="OFFLINE LIVE"
            android:textColor="@color/green_status"
            android:textSize="14sp"
            android:textStyle="bold" />
    </RelativeLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_centerInParent="true"
        android:gravity="center"
        android:orientation="vertical">

        <TextView
            android:id="@+id/tvTvBigTimer"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:fontFamily="monospace"
            android:text="08:45"
            android:textColor="@color/white"
            android:textSize="110sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/tvTvTimeUp"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="TIME'S UP!"
            android:textColor="@color/white"
            android:textSize="44sp"
            android:textStyle="bold"
            android:visibility="gone" />
    </LinearLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_alignParentBottom="true"
        android:orientation="vertical">

        <ProgressBar
            android:id="@+id/tvProgressBar"
            style="?android:attr/progressBarStyleHorizontal"
            android:layout_width="match_parent"
            android:layout_height="12dp"
            android:layout_marginBottom="16dp"
            android:max="100"
            android:progress="65"
            android:progressDrawable="@drawable/progress_bar_custom" />

        <RelativeLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">

            <TextView
                android:id="@+id/tvTvNextActivity"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_alignParentStart="true"
                android:text="NEXT: OFFERING"
                android:textColor="@color/text_secondary"
                android:textSize="22sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_alignParentEnd="true"
                android:text="CHURCH TIMER TV"
                android:textColor="@color/text_tertiary"
                android:textSize="14sp"
                android:textStyle="bold" />
        </RelativeLayout>
    </LinearLayout>

</RelativeLayout>`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    category: 'res',
    description: 'Color definitions matching required black, white, blue #4f7cff, and yellow #eab54d',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#0a0a0a</color>
    <color name="white">#ffffff</color>
    <color name="blue_primary">#4f7cff</color>
    <color name="blue_primary_pressed">#3a67ea</color>
    <color name="yellow_accent">#eab54d</color>
    <color name="red_alert">#ef4444</color>
    <color name="green_status">#22c55e</color>

    <color name="surface_dark">#121212</color>
    <color name="card_dark">#1c1c1e</color>
    <color name="card_border">#2c2c2e</color>
    <color name="text_secondary">#9e9e9e</color>
    <color name="text_tertiary">#666666</color>
    <color name="divider">#262626</color>
</resources>`
  },
  {
    path: 'app/src/main/res/values/themes.xml',
    category: 'res',
    description: 'Application and TV dark styles with NoActionBar',
    content: `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.ChurchTimerOffline" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/blue_primary</item>
        <item name="colorPrimaryVariant">@color/blue_primary_pressed</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="colorSecondary">@color/yellow_accent</item>
        <item name="colorSecondaryVariant">@color/yellow_accent</item>
        <item name="colorOnSecondary">@color/black</item>
        <item name="android:colorBackground">@color/black</item>
        <item name="colorSurface">@color/surface_dark</item>
        <item name="android:statusBarColor">@color/black</item>
        <item name="android:navigationBarColor">@color/black</item>
        <item name="android:windowBackground">@color/black</item>
    </style>

    <style name="Theme.ChurchTimerOffline.Tv" parent="Theme.ChurchTimerOffline">
        <item name="android:windowFullscreen">true</item>
        <item name="android:keepScreenOn">true</item>
    </style>
</resources>`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'res',
    description: 'String resources for controller UI and offline server status',
    content: `<resources>
    <string name="app_name">Church Timer</string>
    <string name="app_header_title">Church Timer Controller</string>
    <string name="offline_badge">OFFLINE MODE</string>
    <string name="default_timer">08:45</string>
    <string name="current_activity_format">Current: %1$s %2$s</string>
    <string name="next_activity_format">Next: %1$s</string>
    <string name="start">START</string>
    <string name="pause">PAUSE</string>
    <string name="skip_next">SKIP NEXT</string>
    <string name="plus_one_min">+1 MIN</string>
    <string name="activities_title">Service Activities</string>
    <string name="add_activity">ADD</string>
    <string name="tv_connection_card_title">TV CONNECTION</string>
    <string name="scan_tv_browser_prompt">%1$s - Scan on TV Browser - Offline</string>
    <string name="start_offline_server">START OFFLINE SERVER</string>
    <string name="stop_offline_server">STOP SERVER</string>
    <string name="server_running">SERVER RUNNING</string>
    <string name="server_stopped">SERVER STOPPED</string>
    <string name="add_activity_dialog_title">Add Service Activity</string>
    <string name="activity_name_hint">Activity Name (e.g. Sermon)</string>
    <string name="minutes_hint">Minutes (e.g. 35)</string>
    <string name="seconds_hint">Seconds (e.g. 00)</string>
    <string name="cancel">Cancel</string>
    <string name="add">Add</string>
    <string name="time_up">TIME\'S UP!</string>
    <string name="open_tv_view">TV Fullscreen Mode</string>
</resources>`
  }
];

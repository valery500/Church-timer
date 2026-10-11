package com.church.timer.offline.ui

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
                binding.tvTvCurrentActivity.text = "NOW: ${activity.name.uppercase()} (${activity.formatDuration()})"
            } else {
                binding.tvTvCurrentActivity.text = "SERVICE COMPLETE"
            }
        }

        TimerManager.nextActivity.observe(this) { next ->
            binding.tvTvNextActivity.text = if (next != null) {
                "NEXT: ${next.name.uppercase()}"
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
}

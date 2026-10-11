package com.church.timer.offline.ui

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

        // Attach Drag-to-reorder and Swipe-to-delete
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
        // Big Blue START / PAUSE Button
        binding.btnMainStart.setOnClickListener {
            if (TimerManager.isRunning.value == true) {
                TimerManager.pause()
            } else {
                TimerManager.start()
            }
        }

        // Quick button: PAUSE
        binding.btnPause.setOnClickListener {
            TimerManager.pause()
        }

        // Quick button: SKIP NEXT
        binding.btnSkipNext.setOnClickListener {
            TimerManager.skip()
        }

        // Quick button: +1 MIN
        binding.btnAddOneMin.setOnClickListener {
            TimerManager.addOneMinute()
        }

        // Local TV Fullscreen activity button
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
            Toast.makeText(this, "Added ${newActivity.name}", Toast.LENGTH_SHORT).show()
        }

        dialog.show()
    }
}

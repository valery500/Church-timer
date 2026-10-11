package com.church.timer.offline.model

import java.io.Serializable
import java.util.Locale

/**
 * Represents a single service activity with duration and display formatting.
 */
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
}

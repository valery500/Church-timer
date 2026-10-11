package com.church.timer.offline.ui

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

        // Highlight selected/active activity
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
}

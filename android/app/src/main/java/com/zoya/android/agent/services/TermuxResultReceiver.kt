package com.zoya.android.agent.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.zoya.android.agent.bridge.AndroidNativeBridge
import org.json.JSONObject

/**
 * TermuxResultReceiver
 * Listens for Termux RUN_COMMAND callback broadcasts containing stdout, stderr, and exit codes.
 * Relays results back to Zoya's native bridge and WebView execution layer.
 */
class TermuxResultReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "TermuxResultReceiver"
        const val ACTION_TERMUX_RESULT = "com.zoya.android.agent.TERMUX_RESULT"
        
        // Termux standard result extras
        const val EXTRA_STDOUT = "stdout"
        const val EXTRA_STDERR = "stderr"
        const val EXTRA_EXIT_CODE = "exitCode"
        const val EXTRA_ERR_CODE = "errCode"
        const val EXTRA_COMMAND_ID = "command_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        Log.d(TAG, "Received Termux broadcast action: $action")

        if (action == ACTION_TERMUX_RESULT) {
            val stdout = intent.getStringExtra(EXTRA_STDOUT) ?: ""
            val stderr = intent.getStringExtra(EXTRA_STDERR) ?: ""
            val exitCode = intent.getIntExtra(EXTRA_EXIT_CODE, 0)
            val errCode = intent.getIntExtra(EXTRA_ERR_CODE, 0)
            val commandId = intent.getStringExtra(EXTRA_COMMAND_ID) ?: ""

            Log.i(TAG, "Termux command [$commandId] finished with exit code: $exitCode, errCode: $errCode")

            val jsonResult = JSONObject().apply {
                put("commandId", commandId)
                put("stdout", stdout)
                put("stderr", stderr)
                put("exitCode", exitCode)
                put("errCode", errCode)
                put("timestamp", System.currentTimeMillis())
            }

            // Relay to native bridge static listener if registered
            AndroidNativeBridge.onTermuxResultReceived(jsonResult.toString())
        }
    }
}

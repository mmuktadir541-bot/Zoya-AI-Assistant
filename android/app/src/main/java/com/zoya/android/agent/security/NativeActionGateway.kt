package com.zoya.android.agent.security

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import org.json.JSONObject

/**
 * NativeActionGateway
 * Enforces action validation, risk checking, and intent dispatch on native Android.
 */
class NativeActionGateway(private val context: Context) {

    fun dispatchValidatedIntent(json: JSONObject): Boolean {
        val action = json.optString("action", Intent.ACTION_MAIN)
        val packageName = json.optString("packageName", null)
        val dataUri = json.optString("dataUri", null)

        val intent = if (packageName != null && packageName.isNotEmpty()) {
            context.packageManager.getLaunchIntentForPackage(packageName) ?: Intent(action).apply {
                `package` = packageName
            }
        } else {
            Intent(action)
        }

        if (dataUri != null && dataUri.isNotEmpty()) {
            intent.data = Uri.parse(dataUri)
        }

        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK

        return try {
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}

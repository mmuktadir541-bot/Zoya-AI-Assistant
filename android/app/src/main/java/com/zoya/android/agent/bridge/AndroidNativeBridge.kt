package com.zoya.android.agent.bridge

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.zoya.android.agent.security.NativeActionGateway
import com.zoya.android.agent.services.TermuxResultReceiver
import com.zoya.android.agent.services.ZoyaAccessibilityService
import com.zoya.android.agent.services.ZoyaForegroundService
import org.json.JSONObject

/**
 * AndroidNativeBridge
 * Secure JavaScript Interface bridging the Web UI with native Android components.
 */
class AndroidNativeBridge(
    private val context: Context,
    private val actionGateway: NativeActionGateway
) {

    companion object {
        private var resultCallbackListener: ((String) -> Unit)? = null

        fun setTermuxResultListener(listener: (String) -> Unit) {
            resultCallbackListener = listener
        }

        fun onTermuxResultReceived(jsonResult: String) {
            resultCallbackListener?.invoke(jsonResult)
        }
    }

    @JavascriptInterface
    fun getAndroidApiLevel(): Int {
        return Build.VERSION.SDK_INT
    }

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun checkPermission(permission: String): Boolean {
        val androidPerm = mapPermissionName(permission) ?: return false
        return ContextCompat.checkSelfPermission(context, androidPerm) == PackageManager.PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun isAccessibilityEnabled(): Boolean {
        return ZoyaAccessibilityService.instance != null
    }

    @JavascriptInterface
    fun openAccessibilitySettings(): Boolean {
        return try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @JavascriptInterface
    fun openSystemSettings(action: String): Boolean {
        return try {
            val targetAction = if (action.startsWith("android.settings.")) action else Settings.ACTION_SETTINGS
            val intent = Intent(targetAction).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @JavascriptInterface
    fun queryPackageInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    @JavascriptInterface
    fun isTermuxAvailable(): Boolean {
        val isInstalled = queryPackageInstalled("com.termux")
        val hasRunPermission = ContextCompat.checkSelfPermission(
            context,
            "com.termux.permission.RUN_COMMAND"
        ) == PackageManager.PERMISSION_GRANTED
        return isInstalled && hasRunPermission
    }

    @JavascriptInterface
    fun executeTermuxCommand(command: String, commandId: String, inBackground: Boolean): Boolean {
        return try {
            val intent = Intent("com.termux.app.RUN_COMMAND").apply {
                setClassName("com.termux", "com.termux.app.RunCommandService")
                putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/bash")
                putExtra("com.termux.RUN_COMMAND_ARGUMENTS", arrayOf("-c", command))
                putExtra("com.termux.RUN_COMMAND_WORKDIR", "/data/data/com.termux/files/home")
                putExtra("com.termux.RUN_COMMAND_BACKGROUND", inBackground)
                putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")

                // PendingIntent Callback
                val callbackIntent = Intent(context, TermuxResultReceiver::class.java).apply {
                    action = TermuxResultReceiver.ACTION_TERMUX_RESULT
                    putExtra(TermuxResultReceiver.EXTRA_COMMAND_ID, commandId)
                }
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_MUTABLE
                } else {
                    PendingIntent.FLAG_ONE_SHOT
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    commandId.hashCode(),
                    callbackIntent,
                    flags
                )
                putExtra("com.termux.RUN_COMMAND_PENDING_INTENT", pendingIntent)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @JavascriptInterface
    fun startForegroundService(serviceType: String, title: String, content: String): Boolean {
        return try {
            val intent = Intent(context, ZoyaForegroundService::class.java).apply {
                putExtra("EXTRA_TITLE", title)
                putExtra("EXTRA_CONTENT", content)
                putExtra("EXTRA_SERVICE_TYPE", serviceType)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @JavascriptInterface
    fun stopForegroundService(): Boolean {
        return try {
            val intent = Intent(context, ZoyaForegroundService::class.java)
            context.stopService(intent)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @JavascriptInterface
    fun dispatchIntent(jsonString: String): Boolean {
        return try {
            val json = JSONObject(jsonString)
            actionGateway.dispatchValidatedIntent(json)
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun mapPermissionName(perm: String): String? {
        return when (perm) {
            "RECORD_AUDIO" -> android.Manifest.permission.RECORD_AUDIO
            "READ_CONTACTS" -> android.Manifest.permission.READ_CONTACTS
            "CALL_PHONE" -> android.Manifest.permission.CALL_PHONE
            "SEND_SMS" -> android.Manifest.permission.SEND_SMS
            "ACCESS_FINE_LOCATION" -> android.Manifest.permission.ACCESS_FINE_LOCATION
            "POST_NOTIFICATIONS" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) android.Manifest.permission.POST_NOTIFICATIONS else null
            "com.termux.permission.RUN_COMMAND", "TERMUX_RUN_COMMAND" -> "com.termux.permission.RUN_COMMAND"
            else -> null
        }
    }
}


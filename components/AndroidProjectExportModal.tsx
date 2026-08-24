import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  CheckCircle2,
  Download,
  Terminal,
  Layers,
  Cpu,
  Smartphone,
  Check,
  X,
  Code2,
  Package,
} from 'lucide-react';

interface AndroidProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILES: Record<string, { title: string; filename: string; language: string; content: string }> = {
  manifest: {
    title: 'AndroidManifest.xml',
    filename: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.zoya.android.agent">

    <!-- Core Audio & Speech Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Storage & Document Permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" tools:ignore="ScopedStorage" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" tools:ignore="ScopedStorage" />

    <!-- Termux Local Integration Permission -->
    <uses-permission android:name="com.termux.permission.RUN_COMMAND" />

    <!-- Overlay & Foreground Service -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Optional Calling & Contacts for Direct Automation -->
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.SEND_SMS" />

    <!-- Package Visibility for Android 11+ App Intent Detection -->
    <queries>
        <package android:name="com.termux" />
        <package android:name="com.termux.api" />
        <package android:name="moe.shizuku.privileged.api" />
        <package android:name="com.whatsapp" />
        <package android:name="com.bKash.customerapp" />
        <package android:name="com.android.chrome" />
        <package android:name="com.google.android.youtube" />
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
    </queries>

    <application
        android:name=".ZoyaApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ZoyaAgent">

        <!-- Main Voice Assistant UI Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/Theme.ZoyaAgent.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.ASSIST" />
            </intent-filter>
        </activity>

        <!-- Accessibility Service for Screen Reading & UI Automation -->
        <service
            android:name=".services.ZoyaAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Termux Result Callback Receiver -->
        <receiver
            android:name=".services.TermuxResultReceiver"
            android:exported="true"
            android:permission="com.termux.permission.RUN_COMMAND">
            <intent-filter>
                <action android:name="com.zoya.android.agent.TERMUX_RESULT" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`,
  },
  accessibility: {
    title: 'ZoyaAccessibilityService.kt',
    filename: 'app/src/main/java/com/zoya/android/agent/services/ZoyaAccessibilityService.kt',
    language: 'kotlin',
    content: `package com.zoya.android.agent.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Zoya Local Accessibility Automation Service
 * Operates strictly with explicit user consent to read visible text and automate interactions.
 */
class ZoyaAccessibilityService : AccessibilityService() {

    companion object {
        var instance: ZoyaAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Transparent event logging for accessibility tree
    }

    override fun onInterrupt() {
        // Handle interruption
    }

    /**
     * Read all visible text on the active window
     */
    fun extractScreenText(): String {
        val rootNode = rootInActiveWindow ?: return "Screen content unavailable"
        val stringBuilder = StringBuilder()
        traverseNodes(rootNode, stringBuilder)
        return stringBuilder.toString().trim()
    }

    private fun traverseNodes(node: AccessibilityNodeInfo?, builder: StringBuilder) {
        if (node == null) return
        
        node.text?.let { text ->
            if (text.isNotBlank()) builder.append(text).append("\\n")
        }
        node.contentDescription?.let { desc ->
            if (desc.isNotBlank() && desc != node.text) builder.append("[").append(desc).append("]\\n")
        }

        for (i in 0 until node.childCount) {
            traverseNodes(node.getChild(i), builder)
        }
    }

    /**
     * Find node by text or ID and perform click
     */
    fun clickElementByText(query: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val matchedNodes = rootNode.findAccessibilityNodeInfosByText(query)
        for (node in matchedNodes) {
            if (node.isClickable) {
                return node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            var parent = node.parent
            while (parent != null) {
                if (parent.isClickable) {
                    return parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
                parent = parent.parent
            }
        }
        return false
    }

    /**
     * Inject text into the active focused EditText
     */
    fun typeTextIntoFocusedElement(text: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val focused = rootNode.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
        val arguments = Bundle()
        arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}`,
  },
  termux: {
    title: 'TermuxCommandRunner.kt',
    filename: 'app/src/main/java/com/zoya/android/agent/services/TermuxCommandRunner.kt',
    language: 'kotlin',
    content: `package com.zoya.android.agent.services

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Secure Intent-based Termux Command Runner
 * Dispatches commands to Termux RUN_COMMAND service with explicit user authorization.
 */
class TermuxCommandRunner(private val context: Context) {

    companion object {
        const val TERMUX_PACKAGE = "com.termux"
        const val ACTION_RUN_COMMAND = "com.termux.app.RUN_COMMAND"
        const val EXTRA_RUN_COMMAND_PATH = "com.termux.RUN_COMMAND_PATH"
        const val EXTRA_RUN_COMMAND_ARGUMENTS = "com.termux.RUN_COMMAND_ARGUMENTS"
        const val EXTRA_RUN_COMMAND_WORKDIR = "com.termux.RUN_COMMAND_WORKDIR"
        const val EXTRA_RUN_COMMAND_BACKGROUND = "com.termux.RUN_COMMAND_BACKGROUND"
        const val EXTRA_PENDING_INTENT = "com.termux.RUN_COMMAND_PENDING_INTENT"
    }

    /**
     * Execute a user-approved bash command inside Termux
     */
    fun executeCommand(
        command: String,
        workDir: String = "/data/data/com.termux/files/home",
        inBackground: Boolean = true
    ): Boolean {
        val intent = Intent(ACTION_RUN_COMMAND).apply {
            setClassName(TERMUX_PACKAGE, "com.termux.app.RunCommandService")
            putExtra(EXTRA_RUN_COMMAND_PATH, "/data/data/com.termux/files/usr/bin/bash")
            putExtra(EXTRA_RUN_COMMAND_ARGUMENTS, arrayOf("-c", command))
            putExtra(EXTRA_RUN_COMMAND_WORKDIR, workDir)
            putExtra(EXTRA_RUN_COMMAND_BACKGROUND, inBackground)

            // Result callback PendingIntent
            val resultIntent = Intent(context, TermuxResultReceiver::class.java).apply {
                action = "com.zoya.android.agent.TERMUX_RESULT"
                putExtra("original_command", command)
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getBroadcast(context, 101, resultIntent, flags)
            putExtra(EXTRA_PENDING_INTENT, pendingIntent)
        }

        return try {
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
}`,
  },
  shizuku: {
    title: 'ShizukuManager.kt',
    filename: 'app/src/main/java/com/zoya/android/agent/services/ShizukuManager.kt',
    language: 'kotlin',
    content: `package com.zoya.android.agent.services

import android.content.pm.PackageManager
import rikka.shizuku.Shizuku

/**
 * Optional Shizuku Privileged ADB Integration
 */
class ShizukuManager {

    fun isShizukuInstalled(): Boolean {
        return Shizuku.pingBinder()
    }

    fun checkPermission(requestCode: Int = 100): Boolean {
        if (!Shizuku.pingBinder()) return false
        return if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
            true
        } else if (Shizuku.shouldShowRequestPermissionRationale()) {
            false
        } else {
            Shizuku.requestPermission(requestCode)
            false
        }
    }

    fun executePrivilegedCommand(command: String): String {
        if (!isShizukuInstalled() || Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
            throw SecurityException("Shizuku privileged access not granted")
        }
        val process = Shizuku.newProcess(arrayOf("sh", "-c", command), null, null)
        val output = process.inputStream.bufferedReader().readText()
        process.waitFor()
        return output
    }
}`,
  },
  gradle: {
    title: 'build.gradle.kts',
    filename: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.zoya.android.agent"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.zoya.android.agent"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    
    // Shizuku Privileged API
    implementation("dev.rikka.shizuku:api:13.1.5")
    implementation("dev.rikka.shizuku:provider:13.1.5")
}`,
  },
  build_guide: {
    title: 'Build & Deploy Instructions',
    filename: 'BUILD_INSTRUCTIONS.md',
    language: 'markdown',
    content: `# Android AI Agent Build & Deployment Guide

## 1. Prerequisites
- Android Studio Ladybug (2024.2+) or Hedgehog+
- JDK 17
- Android SDK with API 35 (Android 15) and Build-Tools 35.0.0
- Physical Android Device (Android 8.0 - 15)

---

## 2. Debug APK Generation
To build the debug APK directly via command line:
\`\`\`bash
# Clean and assemble Debug APK
./gradlew clean assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
\`\`\`

To install on your connected device:
\`\`\`bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## 3. Release APK Generation (Signed)
1. Generate a keystore if you don't already have one:
\`\`\`bash
keytool -genkey -v -keystore zoya-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias zoya_key
\`\`\`

2. Build Release APK:
\`\`\`bash
./gradlew assembleRelease

# Output signed APK path:
# app/build/outputs/apk/release/app-release.apk
\`\`\`

---

## 4. First-Time Setup on Device
1. Open phone **Settings** -> **Accessibility** -> Enable **Zoya AI Assistant Accessibility Service**.
2. Open **Termux** -> Grant Storage permission (\`termux-setup-storage\`).
3. (Optional) Open **Shizuku** -> Start via Wireless Debugging if privileged commands are needed.`,
  },
};

export const AndroidProjectExportModal: React.FC<AndroidProjectExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeFileKey, setActiveFileKey] = useState<string>('manifest');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = FILES[activeFileKey] || FILES.manifest;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-android-project-export"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Production Android Project & APK Suite</h3>
                <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold">
                  KOTLIN + GRADLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                অ্যাক্সেসিবিলিটি সার্ভিস, টার্মাক্স রানার ও শিজুকু বাইন্ডার সোর্স কোড
              </p>
            </div>
          </div>

          <button
            id="btn-project-export-close"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Navigation Tabs */}
        <div className="px-4 pt-3 bg-slate-900/50 border-b border-slate-800 flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(FILES).map(([key, file]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFileKey(key)}
              className={`px-3 py-1.5 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeFileKey === key
                  ? 'border-indigo-400 text-indigo-300 bg-slate-900/90 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.title}</span>
            </button>
          ))}
        </div>

        {/* Code Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="truncate">{currentFile.filename}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কোড কপি করুন'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-[50vh]">
            <pre className="whitespace-pre leading-relaxed">{currentFile.content}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Target Platform: <strong>Android 8.0 - Android 15 (API 26-35)</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

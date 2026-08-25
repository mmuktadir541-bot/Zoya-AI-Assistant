package com.zoya.android.agent.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * ZoyaAccessibilityService
 * Accessibility Service Foundation for Screen Reading & Navigation with explicit user consent.
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
            if (text.isNotBlank()) builder.append(text).append("\n")
        }
        node.contentDescription?.let { desc ->
            if (desc.isNotBlank() && desc != node.text) builder.append("[").append(desc).append("]\n")
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
}

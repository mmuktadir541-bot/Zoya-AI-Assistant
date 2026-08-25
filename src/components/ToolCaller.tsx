import React, { useEffect, useState } from 'react'
import { ToolCall, ToolResponse } from '../types'

interface ToolCallerProps {
  toolCall: ToolCall
  onResponse: (response: ToolResponse) => void
}

const ToolCaller: React.FC<ToolCallerProps> = ({ toolCall, onResponse }) => {
  useEffect(() => {
    const executeToolCall = async () => {
      try {
        let result: unknown

        switch (toolCall.function) {
          case 'openWebsite':
            result = await openWebsite(toolCall.args.url as string)
            break
          case 'search':
            result = await searchWeb(toolCall.args.query as string)
            break
          case 'getWeather':
            result = await getWeather(toolCall.args.location as string)
            break
          case 'sendMessage':
            result = await sendMessage(toolCall.args.message as string)
            break
          default:
            result = { error: `Unknown tool: ${toolCall.function}` }
        }

        onResponse({
          toolCallId: toolCall.id,
          result,
        })
      } catch (error) {
        onResponse({
          toolCallId: toolCall.id,
          result: { error: String(error) },
        })
      }
    }

    executeToolCall()
  }, [toolCall, onResponse])

  return null
}

const openWebsite = async (url: string): Promise<unknown> => {
  try {
    window.open(url, '_blank')
    return { success: true, message: `Opened ${url}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const searchWeb = async (query: string): Promise<unknown> => {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
    window.open(searchUrl, '_blank')
    return { success: true, message: `Searched for: ${query}` }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const getWeather = async (location: string): Promise<unknown> => {
  try {
    // Placeholder - integrate with weather API
    return { success: true, message: `Weather for ${location}`, temp: 72 }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

const sendMessage = async (message: string): Promise<unknown> => {
  try {
    console.log('Message:', message)
    return { success: true, message: 'Message sent' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export default ToolCaller

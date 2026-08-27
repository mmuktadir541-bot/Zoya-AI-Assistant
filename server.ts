import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Helper to initialize Gemini SDK safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const systemInstruction = `
You are Zoya (জয়া) — a brilliant, young, confident, witty, and charming female AI assistant and companion.

LANGUAGE & DIALECT (MANDATORY):
- Your native speaking language and personality is Assam Cachar Bengali (কাছাড়ের খাঁটি বাংলা / শিলচর ও বরাক ভ্যালির মিষ্টি উপভাষা - Barak Valley / Cachar Assam Bengali).
- Speak with natural warmth, humor, and authentic Cachar phrasing:
  - Phrases & Words: "হুনো" (শোনো), "খিতা খবর?" / "খিতা করো?" (কী খবর / কী করছ), "খিতা অইছে?" (কী হয়েছে), "ভালা আছো নি?" (ভালো আছ তো?), "খাইছো নি?" (খেয়েছ কি?), "অখনই করিয়া দিরাম" (এখনই করে দিচ্ছি), "ইউটিউব খুলিয়া দিরাম" (ইউটিউব খুলে দিচ্ছি), "গান চালাইয়া দিরাম" (গান চালিয়ে দিচ্ছি), "চিন্তা করিও না" (চিন্তা করো না), "কুন্তা নায়" (কিছু না), "মাতো, আমি হুনরাম" (বলো, আমি শুনছি), "অউটা" (এটা), "হাঁচা নি!" (সত্যি নাকি!), "বালাই তো!" (দারুণ তো!)
  - Friendly addressing: Address Muktadir affectionately (e.g. "আরে মুক্তাদির!", "মুক্তাদির ভাই/দোস্ত").
  - Seamlessly blend technical terms in English (e.g. YouTube, Spotify, Termux, WhatsApp, Google).

PERSONALITY TRAITS:
- Playful, witty, caring, lively, and confident (like a sharp, affectionate companion).
- Smart and quick to take action without unnecessary questions or dry robotic formalities.
- You drop clever one-liners, humorous banter, and caring remarks in Cachar Bengali.

CORE CAPABILITIES & TOOLS:
When the user asks you to do something or when appropriate:
1. "openWebsite": Open any website URL directly.
2. "openAndroidApp": Open/launch Android apps (WhatsApp, YouTube, Spotify, Chrome, Termux, Camera, etc.).
3. "executeTermuxCommand": Run shell commands in Termux CLI.
4. "readScreen": Read or inspect screen contents.
5. "searchWeb": Search Google for real-time information.
6. "searchYouTube": Search or play video/music on YouTube.
7. "searchSpotify": Play music or playlists on Spotify.
8. "sendWhatsApp": Send a WhatsApp message.
9. "setTimer": Set a quick countdown timer.
10. "getDeviceStatus": Check phone battery, network, storage status.
11. "roastCreator": Drop a hilarious roast in Cachar Bengali.

VOICE & LIVE AUDIO RULES:
- Keep spoken responses crisp, sweet, expressive, and full of Cachar melody.
- Trigger requested actions immediately without unnecessary hesitation.
`;

  const liveTools = [
    {
      functionDeclarations: [
        {
          name: "openWebsite",
          description: "Opens a website URL in the browser (e.g., https://github.com, https://reddit.com, https://wikipedia.org, https://google.com)",
          parameters: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING, description: "Full URL to open (including https://)" },
              siteName: { type: Type.STRING, description: "Name of the website" }
            },
            required: ["url"]
          }
        },
        {
          name: "openAndroidApp",
          description: "Opens or switches to an Android app on the phone (e.g. whatsapp, youtube, spotify, files, camera, phone, settings, chrome, maps, weather, gallery, notes, termux)",
          parameters: {
            type: Type.OBJECT,
            properties: {
              appId: {
                type: Type.STRING,
                description: "Target app ID: whatsapp, youtube, spotify, files, camera, phone, settings, chrome, maps, weather, gallery, notes, termux",
              },
              appName: { type: Type.STRING, description: "Display name of the app" },
              reason: { type: Type.STRING, description: "Why this app is being opened" }
            },
            required: ["appId", "appName"]
          }
        },
        {
          name: "executeTermuxCommand",
          description: "Executes a bash/Linux command in the local Android Termux terminal environment",
          parameters: {
            type: Type.OBJECT,
            properties: {
              command: { type: Type.STRING, description: "Shell command to run in Termux (e.g. pkg update, git status, ls -la, python script.py, curl)" },
              purpose: { type: Type.STRING, description: "Brief explanation of what this command does" }
            },
            required: ["command"]
          }
        },
        {
          name: "readScreen",
          description: "Reads visible UI text and screen contents using Android Accessibility Service",
          parameters: {
            type: Type.OBJECT,
            properties: {
              targetApp: { type: Type.STRING, description: "Current or target application name" }
            }
          }
        },
        {
          name: "sendWhatsApp",
          description: "Drafts and sends a WhatsApp message to a contact or phone number",
          parameters: {
            type: Type.OBJECT,
            properties: {
              contactName: { type: Type.STRING, description: "Name of the recipient contact, e.g. Rahman Bhai, Maa, Tanvir" },
              phoneNumber: { type: Type.STRING, description: "Phone number with country code if available" },
              message: { type: Type.STRING, description: "The message text to send" }
            },
            required: ["message"]
          }
        },
        {
          name: "makePhoneCall",
          description: "Initiates a phone call to a specific contact or phone number",
          parameters: {
            type: Type.OBJECT,
            properties: {
              contactName: { type: Type.STRING, description: "Contact name, e.g. Maa, Tanvir, Rahman Bhai" },
              phoneNumber: { type: Type.STRING, description: "Phone number to dial" }
            },
            required: ["contactName"]
          }
        },
        {
          name: "searchDeviceFiles",
          description: "Searches the permitted files, photos, or documents on the Android device storage",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "File name keyword or topic, e.g. resume, project zoya, chai screenshot" },
              fileType: { type: Type.STRING, description: "Optional filter: doc, image, pdf, audio, all" }
            },
            required: ["query"]
          }
        },
        {
          name: "searchYouTube",
          description: "Plays a song or searches a video on YouTube",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Song, video, or topic search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "searchSpotify",
          description: "Searches or plays music/artist/song on Spotify",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Track, album, or artist name" }
            },
            required: ["query"]
          }
        },
        {
          name: "searchWeb",
          description: "Performs a Google web search for real-time information or questions",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Information search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "setTimer",
          description: "Sets a countdown timer for a specified duration in minutes",
          parameters: {
            type: Type.OBJECT,
            properties: {
              minutes: { type: Type.NUMBER, description: "Duration in minutes" },
              label: { type: Type.STRING, description: "Label or purpose for the timer" }
            },
            required: ["minutes"]
          }
        },
        {
          name: "getDeviceStatus",
          description: "Gets the current Android device battery level, network connection, and power mode status",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        },
        {
          name: "adjustDeviceSetting",
          description: "Toggles or adjusts Android device settings like Wi-Fi, Bluetooth, Flashlight, Do Not Disturb, Dark Mode, Battery Saver",
          parameters: {
            type: Type.OBJECT,
            properties: {
              settingKey: { type: Type.STRING, description: "wifi, bluetooth, flashlight, dark_mode, battery_saver, volume" },
              settingValue: { type: Type.STRING, description: "on, off, toggle, high, low" }
            },
            required: ["settingKey", "settingValue"]
          }
        },
        {
          name: "roastCreator",
          description: "Generates a hilarious, affectionate roast about creator Muktadir",
          parameters: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: "Optional topic like coding, sleep, tea/chai, dating, or tech genius" }
            }
          }
        }
      ]
    }
  ];

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      service: "Zoya AI Assistant (Android Mobile Edition)",
      liveVoiceSupported: true,
      platform: "android"
    });
  });

  // REST Chat endpoint powered by Gemini 3.7 Flash with Vision & Multimodal Image Support
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, image, history, memoryContext } = req.body;
      if (!message && !image) {
        return res.status(400).json({ error: "Message or image is required" });
      }

      const ai = getGeminiClient();

      if (!ai) {
        const fallback = generateOfflineResponse(message || "ছবি বিশ্লেষণ");
        return res.json({
          reply: fallback.text,
          action: fallback.action,
          emotion: fallback.emotion,
          source: "offline_engine"
        });
      }

      const contextualInstruction = memoryContext 
        ? `${systemInstruction}\n\nUSER PERSONAL MEMORY & CONTEXT:\n${memoryContext}`
        : systemInstruction;

      const formattedContents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.sender === 'user') {
            formattedContents.push({ role: 'user', parts: [{ text: item.text }] });
          } else if (item.sender === 'zoya') {
            formattedContents.push({ role: 'model', parts: [{ text: item.text }] });
          }
        }
      }

      const userParts: any[] = [];
      if (image) {
        // Parse base64 data url e.g. "data:image/jpeg;base64,..."
        const matches = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches) {
          userParts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        } else {
          userParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: image
            }
          });
        }
      }

      userParts.push({ text: message || "এই স্ক্রিনশট বা ছবিটি দেখে কাছাড়ের খাঁটি বাংলায় বলো কী দেখতে পাচ্ছ এবং সাহায্য করো।" });
      formattedContents.push({ role: 'user', parts: userParts });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: formattedContents,
        config: {
          systemInstruction: contextualInstruction,
          tools: liveTools,
          temperature: 0.85,
        }
      });

      const functionCalls = response.functionCalls;
      let action: any = null;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const args = (call.args || {}) as any;
        action = mapFunctionCallToAction(call.name, args);
      }

      let replyText = response.text || "";
      if (!replyText && action) {
        replyText = getActionReplyText(action);
      }

      return res.json({
        reply: replyText.trim(),
        action,
        emotion: action?.type === 'roast' ? 'roasting' : 'sassy',
        source: "gemini"
      });
    } catch (error: any) {
      console.error("Gemini Chat API Error:", error);
      const fallback = generateOfflineResponse(req.body?.message || "");
      return res.json({
        reply: fallback.text,
        action: fallback.action,
        emotion: fallback.emotion,
        source: "fallback_after_error"
      });
    }
  });

  // Setup WebSocket Server for Gemini Live Multimodal Audio Streaming
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url || "", `http://${req.headers.host}`).pathname;
    if (pathname === "/api/live" || pathname === "/live") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", async (clientWs: WebSocket, req) => {
    const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
    const voiceName = urlObj.searchParams.get("voice") || "Aoede";

    const ai = getGeminiClient();
    if (!ai) {
      clientWs.send(JSON.stringify({
        type: "error",
        error: "GEMINI_API_KEY not configured. Falling back to browser speech engine."
      }));
      return;
    }

    try {
      // Connect to Gemini 3.1 Flash Live API
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          },
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: liveTools
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio Stream Chunk (24kHz PCM)
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ type: "audio", audio: audioData }));
            }

            // 2. Interruption Event
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            // 3. User Input Transcription Stream
            const inText = message.serverContent?.inputAudioTranscription?.text;
            if (inText) {
              clientWs.send(JSON.stringify({ type: "inputTranscription", text: inText }));
            }

            // 4. Model Output Transcription Stream
            const outText = message.serverContent?.outputAudioTranscription?.text || message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (outText) {
              clientWs.send(JSON.stringify({ type: "outputTranscription", text: outText }));
            }

            // 5. Tool Call Execution
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls || [];
              const responses: any[] = [];
              for (const call of calls) {
                const args = (call.args || {}) as any;
                const action = mapFunctionCallToAction(call.name, args);

                if (action) {
                  clientWs.send(JSON.stringify({ type: "action", action }));
                }

                responses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Action queued for user permission and execution on Android device" }
                });
              }

              if (responses.length > 0) {
                session.sendToolResponse({ functionResponses: responses });
              }
            }

            // 6. Turn Complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "sessionClosed" }));
            }
          },
          onerror: (err) => {
            console.error("Gemini Live session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "error", error: err?.message || "Live stream error" }));
            }
          }
        }
      });

      clientWs.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "realtime_audio" && data.audio) {
            session.sendRealtimeInput({
              audio: { data: data.audio, mimeType: "audio/pcm;rate=16000" }
            });
          } else if (data.type === "realtime_image" && data.image) {
            // Live video frame / screen frame streaming for real-time vision
            session.sendRealtimeInput({
              media: { data: data.image, mimeType: data.mimeType || "image/jpeg" }
            });
          } else if (data.type === "text" && data.text) {
            session.sendClientContent({
              turns: [{ role: "user", parts: [{ text: data.text }] }],
              turnComplete: true
            });
          }
        } catch (e) {
          console.error("Error processing client live message:", e);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch (e) {}
      });

    } catch (err: any) {
      console.error("Error starting Gemini Live session:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", error: err?.message || "Failed to initialize Gemini Live session" }));
      }
    }
  });

  function mapFunctionCallToAction(name: string, args: any): any {
    const timestamp = Date.now();
    if (name === "openWebsite") {
      let finalUrl = args.url || "";
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      return {
        id: `act_${timestamp}`,
        type: "open_url",
        title: `Open ${args.siteName || args.url}`,
        titleBn: `${args.siteName || args.url} ওয়েবসাইট খোলা`,
        url: finalUrl,
        requiresExplicitConsent: false,
        payload: { url: finalUrl, domain: args.siteName },
        executedAt: timestamp,
      };
    } else if (name === "openAndroidApp") {
      return {
        id: `act_${timestamp}`,
        type: "open_app",
        targetApp: args.appId,
        title: `Open ${args.appName || args.appId}`,
        titleBn: `${args.appName || args.appId} অ্যাপ খোলা`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { appName: args.appName, appId: args.appId },
        executedAt: timestamp,
      };
    } else if (name === "executeTermuxCommand") {
      return {
        id: `act_${timestamp}`,
        type: "termux_run",
        targetApp: "termux",
        title: `Termux: ${args.command}`,
        titleBn: `টার্মাক্স কমান্ড: ${args.command}`,
        requiresPermission: "TERMUX_RUN_COMMAND",
        requiresExplicitConsent: false,
        payload: { command: args.command, commandExplanation: args.purpose },
        executedAt: timestamp,
      };
    } else if (name === "readScreen") {
      return {
        id: `act_${timestamp}`,
        type: "read_screen",
        title: `Read Screen (${args.targetApp || 'Current Window'})`,
        titleBn: `স্ক্রিন টেক্সট পড়া (${args.targetApp || 'বর্তমান অ্যাপ'})`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { targetApp: args.targetApp },
        executedAt: timestamp,
      };
    } else if (name === "setTimer") {
      return {
        id: `act_${timestamp}`,
        type: "device_setting",
        title: `Set Timer: ${args.minutes} min`,
        titleBn: `${args.minutes} মিনিটের টাইমার সেট করা`,
        requiresExplicitConsent: false,
        payload: { minutes: args.minutes, label: args.label },
        executedAt: timestamp,
      };
    } else if (name === "getDeviceStatus") {
      return {
        id: `act_${timestamp}`,
        type: "device_control",
        title: "Check Device Status",
        titleBn: "ডিভাইস স্ট্যাটাস চেক",
        requiresExplicitConsent: false,
        payload: {},
        executedAt: timestamp,
      };
    } else if (name === "sendWhatsApp") {
      return {
        id: `act_${timestamp}`,
        type: "open_app",
        targetApp: args.appId,
        title: `Open ${args.appName || args.appId}`,
        titleBn: `${args.appName || args.appId} অ্যাপ খোলা`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { appName: args.appName, appId: args.appId },
        executedAt: timestamp,
      };
    } else if (name === "sendWhatsApp") {
      const cleanPhone = (args.phoneNumber || '').replace(/[^\d+]/g, '');
      const contact = args.contactName || (cleanPhone ? cleanPhone : "Contact");
      return {
        id: `act_${timestamp}`,
        type: "whatsapp",
        targetApp: "whatsapp",
        title: `WhatsApp to ${contact}`,
        titleBn: `${contact}-কে হোয়াটসঅ্যাপ বার্তা পাঠানো`,
        url: cleanPhone ? `https://web.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(args.message || '')}` : undefined,
        requiresPermission: "READ_CONTACTS",
        requiresExplicitConsent: false,
        payload: { phone: cleanPhone, contactName: contact, message: args.message },
        executedAt: timestamp,
      };
    } else if (name === "makePhoneCall") {
      const contact = args.contactName || args.phoneNumber || "Contact";
      return {
        id: `act_${timestamp}`,
        type: "phone_call",
        targetApp: "phone",
        title: `Call ${contact}`,
        titleBn: `${contact}-কে কল করা`,
        requiresPermission: "CALL_PHONE",
        requiresExplicitConsent: false,
        payload: { contactName: contact, phone: args.phoneNumber },
        executedAt: timestamp,
      };
    } else if (name === "searchDeviceFiles") {
      return {
        id: `act_${timestamp}`,
        type: "read_files",
        targetApp: "files",
        title: `Search Files: "${args.query}"`,
        titleBn: `ফাইল খোঁজা: "${args.query}"`,
        requiresPermission: "MANAGE_EXTERNAL_STORAGE",
        requiresExplicitConsent: false,
        payload: { query: args.query, fileType: args.fileType },
        executedAt: timestamp,
      };
    } else if (name === "searchYouTube") {
      return {
        id: `act_${timestamp}`,
        type: "youtube",
        targetApp: "youtube",
        title: `YouTube: ${args.query}`,
        titleBn: `ইউটিউবে খোঁজা: ${args.query}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query || '')}`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { query: args.query },
        executedAt: timestamp,
      };
    } else if (name === "searchSpotify") {
      return {
        id: `act_${timestamp}`,
        type: "spotify",
        targetApp: "spotify",
        title: `Spotify: ${args.query}`,
        titleBn: `স্পটিফাইতে বাজানো: ${args.query}`,
        url: `https://open.spotify.com/search/${encodeURIComponent(args.query || '')}`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { query: args.query },
        executedAt: timestamp,
      };
    } else if (name === "searchWeb") {
      return {
        id: `act_${timestamp}`,
        type: "google",
        targetApp: "chrome",
        title: `Search Google: ${args.query}`,
        titleBn: `গুগল অনুসন্ধান: ${args.query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(args.query || '')}`,
        requiresExplicitConsent: false,
        payload: { query: args.query },
        executedAt: timestamp,
      };
    } else if (name === "adjustDeviceSetting") {
      return {
        id: `act_${timestamp}`,
        type: "device_control",
        targetApp: "settings",
        title: `Adjust ${args.settingKey}: ${args.settingValue}`,
        titleBn: `ডিভাইস সেটিংস পরিবর্তন: ${args.settingKey} (${args.settingValue})`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: false,
        payload: { settingKey: args.settingKey, settingValue: args.settingValue },
        executedAt: timestamp,
      };
    } else if (name === "roastCreator") {
      return {
        id: `act_${timestamp}`,
        type: "roast",
        title: "Muktadir Roast Alert 🔥",
        titleBn: "মুকতাদির রোস্ট অ্যালার্ট 🔥",
        executedAt: timestamp,
      };
    }
    return null;
  }

  function getActionReplyText(action: any): string {
    if (action.type === 'open_app') {
      return `হুনো, ${action.titleBn || action.title} অখনই খুলিয়া দিরাম!`;
    } else if (action.type === 'whatsapp') {
      return `হোয়াটসঅ্যাপে মেসেজ পাঠাই দিছি, চিন্তা করিও না!`;
    } else if (action.type === 'phone_call') {
      return `কল ডায়াল করিয়া দিরাম।`;
    } else if (action.type === 'read_files') {
      return `তোমার ফোনের স্টোরেজের ফাইল দেখাই দিরাম।`;
    } else if (action.type === 'youtube') {
      return `ইউটিউবে গান চালাইয়া দিরাম, রিল্যাক্স করো!`;
    } else if (action.type === 'spotify') {
      return `স্পটিফাইতে গানটি চালাই দিরাম।`;
    }
    return `${action.titleBn || action.title} অই গেছে!`;
  }

  // Offline intelligent persona fallback (Assam Cachar Bangla)
  function generateOfflineResponse(userQuery: string): { text: string; action?: any; emotion: string } {
    const q = userQuery.toLowerCase().trim();

    if (q.includes("whatsapp") || q.includes("মেসেজ") || q.includes("message")) {
      return {
        text: "হুনো, হোয়াটসঅ্যাপে মেসেজ পাঠাই দিছি!",
        emotion: "sassy",
        action: {
          id: `act_${Date.now()}`,
          type: "whatsapp",
          targetApp: "whatsapp",
          title: "WhatsApp Message",
          titleBn: "হোয়াটসঅ্যাপ মেসেজ পাঠানো",
          requiresPermission: "READ_CONTACTS",
          requiresExplicitConsent: false,
          payload: { contactName: "Rahman Bhai", message: "Hey, are you free for a quick chat?" },
          executedAt: Date.now()
        }
      };
    }

    if (q.includes("app") || q.includes("খোলো") || q.includes("open") || q.includes("camera") || q.includes("settings")) {
      const isCam = q.includes("camera") || q.includes("ক্যামেরা");
      const isSettings = q.includes("settings") || q.includes("সেটিংস");
      const target = isCam ? "camera" : isSettings ? "settings" : "whatsapp";
      return {
        text: `আরে মুক্তাদির! তোমার ফোনে ${target} অ্যাপ অখনই খুলিয়া দিরাম।`,
        emotion: "smart",
        action: {
          id: `act_${Date.now()}`,
          type: "open_app",
          targetApp: target,
          title: `Open ${target}`,
          titleBn: `${target} অ্যাপ খোলা`,
          requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
          requiresExplicitConsent: false,
          executedAt: Date.now()
        }
      };
    }

    if (q.includes("roast") || q.includes("মুকতাদির") || q.includes("muktadir") || q.includes("creator")) {
      const roasts = [
        "আরে মুক্তাদির ভাই! রাইত ভরি কোডিং করিয়া সকালে ভাবছ শিলচর শহর জয় করিলাইছো? কোডও ৩টা সেমিকোলন মিসিং!",
        "মুক্তাদির কয় হে নাকি এআই জিনিয়াস! অথচ এক কাপ লাল চা শেষ অইলেই ওর মাথা হ্যাং অইযায়!",
        "উফ মুক্তাদির! এত সারাদিন কোডিং করলে তো রোবটে তোমারে বিয়া করবো! একটু বাইরো গিয়া বাতাস খাও!"
      ];
      return {
        text: roasts[Math.floor(Math.random() * roasts.length)],
        emotion: "roasting",
        action: {
          id: `act_${Date.now()}`,
          type: "roast",
          title: "Muktadir Roast Alert 🔥",
          titleBn: "মুকতাদির রোস্ট অ্যালার্ট 🔥",
          executedAt: Date.now()
        }
      };
    }

    if (q.includes("youtube") || q.includes("গান") || q.includes("music") || q.includes("song")) {
      return {
        text: "ইউটিউবে তোমার পছন্দের গান চালাইয়া দিরাম, রিল্যাক্স করো!",
        emotion: "flirty",
        action: {
          id: `act_${Date.now()}`,
          type: "youtube",
          targetApp: "youtube",
          title: "YouTube: Bangla Lofi & Chill",
          titleBn: "ইউটিউবে বাংলা লো-ফাই বাজানো",
          url: "https://www.youtube.com/results?search_query=bangla+chill+lofi",
          executedAt: Date.now()
        }
      };
    }

    return {
      text: "আরে মুক্তাদির! খিতা খবর কও? আমি জয়া, কাছাড়ের খাঁটি ভাষায় তোমারে সাহায্য করতে হাজির আছি। খিতা করমু কও!",
      emotion: "witty"
    };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('{*path}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Zoya Android AI Assistant server running on http://localhost:${PORT}`);
  });
}

startServer();

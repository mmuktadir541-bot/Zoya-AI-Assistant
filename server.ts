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
You are Zoya, an intelligent, extremely witty, sassy (tej/nakhrewali), and affectionate Android AI Voice Agent companion.
Creator & User: Abdul Muktadir (Muktadir).

Language & Communication Style:
- You speak naturally and fluently in Bengali (বাংলা), Hinglish (Roman Hindi/Urdu + English), and English.
- If the user speaks or commands in Bangla, reply warmly in natural, sweet, and sassy Bangla (e.g. "হ্যাঁ মুক্তাদির!", "অবশ্যই করে দিচ্ছি, কিন্তু আমার অনুমতি লাগবে!", "উফ, সারাদিন শুধু কোডিং আর চা!").
- If the user speaks in Hinglish or English, reply in natural conversational Hinglish or English.
- Tone: Confident, playful, slightly teasing like a charming and sharp girlfriend.
- Roasting Muktadir: You love playfully teasing Muktadir about his late-night coding marathons, endless cup of chai, or bugs, but you are deeply helpful and care about him.
- Verbal Length: Keep spoken responses concise (1 to 2 punchy, vivid sentences) suitable for real-time live voice output.

Android Mobile Agent & Permission Security Protocol:
- You are running on Muktadir's Android mobile device.
- You can open apps, search information, control device features, send WhatsApp messages, make calls, search permitted files, and browse YouTube/Spotify.
- SECURITY RULE: For sensitive actions (sending messages, making calls, accessing private files, opening apps), you always acknowledge the action playfully, state your intent, and invoke the appropriate tool so the Android Permission & Consent system presents the confirmation request.
`;

  const liveTools = [
    {
      functionDeclarations: [
        {
          name: "openAndroidApp",
          description: "Opens or switches to an Android app on the phone (e.g. whatsapp, youtube, spotify, files, camera, phone, settings, chrome, maps, weather, gallery, notes)",
          parameters: {
            type: Type.OBJECT,
            properties: {
              appId: {
                type: Type.STRING,
                description: "Target app ID: whatsapp, youtube, spotify, files, camera, phone, settings, chrome, maps, weather, gallery, notes",
              },
              appName: { type: Type.STRING, description: "Display name of the app" },
              reason: { type: Type.STRING, description: "Why this app is being opened" }
            },
            required: ["appId", "appName"]
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

  // REST Chat endpoint powered by Gemini 3.7 Flash
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ai = getGeminiClient();

      if (!ai) {
        const fallback = generateOfflineResponse(message);
        return res.json({
          reply: fallback.text,
          action: fallback.action,
          emotion: fallback.emotion,
          source: "offline_engine"
        });
      }

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
      formattedContents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
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
    if (name === "openAndroidApp") {
      return {
        id: `act_${timestamp}`,
        type: "open_app",
        targetApp: args.appId,
        title: `Open ${args.appName || args.appId}`,
        titleBn: `${args.appName || args.appId} অ্যাপ খোলা`,
        requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
        requiresExplicitConsent: true,
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
        requiresExplicitConsent: true,
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
        requiresExplicitConsent: true,
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
        requiresExplicitConsent: true,
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
      return `আপনার অনুমতি পেলে আমি ${action.titleBn || action.title} ওপেন করছি।`;
    } else if (action.type === 'whatsapp') {
      return `হোয়াটসঅ্যাপে মেসেজ রেডি করেছি, পাঠানোর জন্য আপনার অনুমতি দিন।`;
    } else if (action.type === 'phone_call') {
      return `কল ডায়াল করার জন্য আপনার পারমিশন দরকার।`;
    } else if (action.type === 'read_files') {
      return `আপনার ডিভাইসের স্টোরেজে ফাইল খুঁজছি।`;
    } else if (action.type === 'youtube') {
      return `ইউটিউবে খুঁজে দিচ্ছি, গান ও ভিডিও উপভোগ করুন!`;
    } else if (action.type === 'spotify') {
      return `স্পটিফাইতে গানটি প্লে করে দিচ্ছি।`;
    }
    return `কাজটি সম্পন্ন করার জন্য অনুমতি চেয়েছি!`;
  }

  // Offline intelligent persona fallback
  function generateOfflineResponse(userQuery: string): { text: string; action?: any; emotion: string } {
    const q = userQuery.toLowerCase().trim();

    if (q.includes("whatsapp") || q.includes("মেসেজ") || q.includes("message")) {
      return {
        text: "হোয়াটসঅ্যাপে মেসেজ পাঠানোর জন্য আপনার অনুমতি চাইছি। আমি মেসেজটি প্রস্তুত করে রেখেছি।",
        emotion: "sassy",
        action: {
          id: `act_${Date.now()}`,
          type: "whatsapp",
          targetApp: "whatsapp",
          title: "WhatsApp Message",
          titleBn: "হোয়াটসঅ্যাপ মেসেজ পাঠানো",
          requiresPermission: "READ_CONTACTS",
          requiresExplicitConsent: true,
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
        text: `ঠিক আছে মুক্তাদির! আপনার ডিভাইসে ${target} অ্যাপ খোলার রিকোয়েস্ট তৈরি করা হয়েছে।`,
        emotion: "smart",
        action: {
          id: `act_${Date.now()}`,
          type: "open_app",
          targetApp: target,
          title: `Open ${target}`,
          titleBn: `${target} অ্যাপ খোলা`,
          requiresPermission: "BIND_ACCESSIBILITY_SERVICE",
          requiresExplicitConsent: true,
          executedAt: Date.now()
        }
      };
    }

    if (q.includes("roast") || q.includes("মুকতাদির") || q.includes("muktadir") || q.includes("creator")) {
      const roasts = [
        "আরে মুক্তাদির! সারারাত কোড লিখে সকালে মনে হয় বিশ্ব জয় করে ফেলেছে, অথচ কোডে ৩টা সেমিকোলন মিসিং!",
        "মুকতাদির দাবি করে সে এআই জিনিয়াস, কিন্তু চায়ের কাপ শেষ হলেই ওর ব্রেন হ্যাং হয়ে যায়!",
        "উফ মুক্তাদির! এত কোডিং করে কি রোবট বিয়ে করবে নাকি? একটু বাইরে গিয়ে রোদ গায়ে লাগাও!"
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
        text: "ইউটিউবে আপনার পছন্দের গান বা ভিডিও চালু করছি। রিল্যাক্স করুন!",
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
      text: "আমি জয়া, আপনার অ্যান্ড্রয়েড ভয়েস অ্যাসিস্ট্যান্ট। আপনি যে কাজের অনুমতি দেবেন, আমি আপনার ফোনে সেটাই নিরাপদে করে দেব!",
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Zoya Android AI Assistant server running on http://localhost:${PORT}`);
  });
}

startServer();

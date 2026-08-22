import { ActionParseResult, AssistantAction, AndroidAppId, WorkType } from '../types';

/**
 * Keyword-based Command Parser and Action Executor for Zoya Assistant
 * Supports Bilingual (Bengali + English) and 8 Core Android Apps:
 * WhatsApp, Chrome, YouTube, Gmail, Google Maps, Files, Phone, Messages
 */
export class ActionParser {
  private static websiteAliases: Record<string, string> = {
    'youtube': 'https://www.youtube.com',
    'spotify': 'https://open.spotify.com',
    'whatsapp': 'https://web.whatsapp.com',
    'gmail': 'https://mail.google.com',
    'google': 'https://www.google.com',
    'maps': 'https://maps.google.com',
    'chrome': 'https://www.google.com',
  };

  /**
   * Parse user input for Android actions with Bengali & English NLP matching
   */
  public static parseCommand(input: string): ActionParseResult {
    const raw = input.trim();
    const clean = raw.toLowerCase().replace(/^(hey\s+|suno\s+|please\s+|zoya\s+|can\s+you\s+|জয়া\s+|দয়া\s+করে\s+)+/i, '').trim();

    // 1. WhatsApp Action (Work Type C)
    if (clean.includes('whatsapp') || clean.includes('হোয়াটসঅ্যাপ') || clean.includes('হোয়াটস্যাপ')) {
      const contactMatch = raw.match(/([A-Za-z\u0980-\u09FF\s]+)\s*(?:কে|ভাই|bhai|to)\s*(?:whatsapp|মেসেজ|message)/i);
      let contactName = contactMatch ? contactMatch[1].trim() : 'Rahman Bhai';
      let message = 'Hey! Sent from Zoya Android Agent.';

      if (clean.includes('বলে') || clean.includes('যে') || clean.includes('saying')) {
        const parts = raw.split(/(?:বলে|যে|saying)\s*/i);
        if (parts[1]) message = parts[1].trim();
      }

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'whatsapp',
          workType: 'C_IN_APP_AUTOMATION',
          title: `WhatsApp Message to ${contactName}`,
          titleBn: `${contactName}-কে হোয়াটসঅ্যাপে মেসেজ পাঠানো`,
          targetApp: 'whatsapp',
          requiresPermission: 'READ_CONTACTS',
          requiresExplicitConsent: true,
          payload: { contactName, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `হোয়াটসঅ্যাপে ${contactName}-কে মেসেজ পাঠানোর অনুমতি চাইছি। কনফার্ম করবেন?`,
        emotion: 'sassy',
      };
    }

    // 2. Gmail Action (Work Type C)
    if (clean.includes('gmail') || clean.includes('জিমেইল') || clean.includes('ইমেইল') || clean.includes('email') || clean.includes('মেইল')) {
      const contactMatch = raw.match(/([A-Za-z\u0980-\u09FF\s]+)\s*(?:কে|to)\s*(?:gmail|email|ইমেইল|মেইল)/i);
      let contactName = contactMatch ? contactMatch[1].trim() : 'Tanvir (Developer)';
      let subject = 'Project Zoya Status Update';
      let message = 'Hey, Zoya Assistant Android 15 integration is complete with Bengali + English support!';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'gmail',
          workType: 'C_IN_APP_AUTOMATION',
          title: `Send Gmail to ${contactName}`,
          titleBn: `${contactName}-কে জিমেইল ইমেইল পাঠানো`,
          targetApp: 'gmail',
          requiresPermission: 'READ_CONTACTS',
          requiresExplicitConsent: true,
          payload: { contactName, recipientEmail: 'tanvir.dev@gmail.com', subject, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `জিমেইল ড্রাফট রেডি! ${contactName}-কে ইমেইল পাঠাতে আপনার অনুমতি লাগবে।`,
        emotion: 'smart',
      };
    }

    // 3. Messages (SMS) Action (Work Type C)
    if (clean.includes('sms') || clean.includes('এসএমএস') || clean.includes('মেসেজ পাঠাও') || (clean.includes('messages') && !clean.includes('whatsapp'))) {
      const contactMatch = raw.match(/([A-Za-z\u0980-\u09FF\s]+)\s*(?:কে|to)\s*(?:sms|এসএমএস|মেসেজ)/i);
      let contactName = contactMatch ? contactMatch[1].trim() : 'Rahman Bhai';
      let message = 'Ami 5 minute e ashtesi!';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'messages',
          workType: 'C_IN_APP_AUTOMATION',
          title: `Send SMS to ${contactName}`,
          titleBn: `${contactName}-কে এসএমএস পাঠানো`,
          targetApp: 'messages',
          requiresPermission: 'SEND_SMS',
          requiresExplicitConsent: true,
          payload: { contactName, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `${contactName}-কে SMS পাঠানোর আগে আপনার অনুমতি চাই।`,
        emotion: 'smart',
      };
    }

    // 4. Google Maps & Navigation (Work Type A / B)
    if (clean.includes('maps') || clean.includes('ম্যাপস') || clean.includes('রাস্তা') || clean.includes('traffic') || clean.includes('রুট') || clean.includes('দিকনির্দেশনা')) {
      let destination = 'Dhanmondi Lake & Chai Corner';
      if (clean.includes('ধানমন্ডি')) destination = 'ধানমন্ডি লেক ও চায়ের দোকান';
      else if (clean.includes('গুলশান')) destination = 'গুলশান ২ টেক হাব';
      else if (clean.includes('মিরপুর')) destination = 'মিরপুর ১০';
      else if (clean.includes('এয়ারপোর্ট') || clean.includes('airport')) destination = 'হযরত শাহজালাল আন্তর্জাতিক বিমানবন্দর';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'maps',
          workType: 'A_APP_CONTROL',
          title: `Google Maps Route to ${destination}`,
          titleBn: `গুগল ম্যাপসে ${destination} যাওয়ার রুট`,
          targetApp: 'maps',
          requiresPermission: 'ACCESS_FINE_LOCATION',
          requiresExplicitConsent: false,
          payload: { destination },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `গুগল ম্যাপসে ${destination} যাওয়ার সবচেয়ে দ্রুত রাস্তা এবং ট্রাফিক বের করেছি!`,
        emotion: 'flirty',
      };
    }

    // 5. Files & Storage Management (Work Type E)
    if (clean.includes('file') || clean.includes('ফাইল') || clean.includes('ডকুমেন্ট') || clean.includes('document') || clean.includes('pdf') || clean.includes('পিডিএফ')) {
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'read_files',
          workType: 'E_FILE_MANAGEMENT',
          title: `Files Manager: Search Documents`,
          titleBn: `ফাইলস ম্যানেজার: ডকুমেন্ট ও ফাইল দেখা`,
          targetApp: 'files',
          requiresPermission: 'MANAGE_EXTERNAL_STORAGE',
          requiresExplicitConsent: true,
          payload: { query: 'Project_Zoya' },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `আপনার অনুমতি সাপেক্ষে ফাইলস ম্যানেজার থেকে ডকুমেন্ট ও স্টোরেজ তালিকা দেখাচ্ছি।`,
        emotion: 'smart',
      };
    }

    // 6. YouTube Search & Play (Work Type A / B)
    if (clean.includes('youtube') || clean.includes('ইউটিউব') || clean.includes('গান বাজাও') || clean.includes('ভিডিও')) {
      let query = raw
        .replace(/^(ইউটিউবে|youtube|play|গান বাজাও|ভিডিও দেখাও)\s*/gi, '')
        .replace(/\s*(বাজাও|প্লে করো|on youtube|ইউটিউবে)\s*$/gi, '')
        .trim();

      if (!query) query = 'Bangla Lofi Chill Beats';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'youtube',
          workType: 'A_APP_CONTROL',
          title: `YouTube: ${query}`,
          titleBn: `ইউটিউবে ভিডিও/গান: ${query}`,
          targetApp: 'youtube',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
          requiresExplicitConsent: false,
          payload: { query },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `ইউটিউবে "${query}" প্লে করছি! একটু রিফ্রেশ হয়ে নিন।`,
        emotion: 'sassy',
      };
    }

    // 7. Phone Call (Work Type A)
    if (clean.includes('call') || clean.includes('কল') || clean.includes('ফোন দাও') || clean.includes('ফোন করো')) {
      const contactMatch = raw.match(/([A-Za-z\u0980-\u09FF\s]+)\s*(?:কে|to)?\s*(?:কল|ফোন|call)/i);
      let contactName = contactMatch ? contactMatch[1].trim() : 'Tanvir (Developer)';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'phone_call',
          workType: 'A_APP_CONTROL',
          title: `Call ${contactName}`,
          titleBn: `${contactName}-কে ফোন কল দেওয়া`,
          targetApp: 'phone',
          requiresPermission: 'CALL_PHONE',
          requiresExplicitConsent: true,
          payload: { contactName, phone: '+8801919876543' },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `${contactName}-কে ফোন ডায়ল করার জন্য আপনার স্পষ্ট অনুমতি চাই।`,
        emotion: 'sassy',
      };
    }

    // 8. Chrome & Google Search with Read Aloud (Work Type B)
    if (clean.includes('chrome') || clean.includes('ক্রোম') || clean.includes('search') || clean.includes('খুঁজো') || clean.includes('পড়ে শোনাও') || clean.includes('তথ্য')) {
      const query = raw
        .replace(/^(গুগলে|ক্রোমে|search|খুঁজো|খোঁজ|search for)\s*/gi, '')
        .replace(/\s*(আর পড়ে শোনাও|পড়ে শোনাও|খুঁজে বলো)\s*$/gi, '')
        .trim();

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'search_info',
          workType: 'B_INFO_SEARCH',
          title: `Chrome Search: ${query || 'Latest Tech News'}`,
          titleBn: `ক্রোমে তথ্য সন্ধান ও পাঠ: ${query || 'প্রযুক্তি খবর'}`,
          targetApp: 'chrome',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
          requiresExplicitConsent: false,
          payload: { query: query || 'Artificial Intelligence trends in Bangladesh' },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `ক্রোমে "${query || 'তথ্য'}" খুঁজে ফলাফল পেয়েছি এবং পড়ে শোনাচ্ছি!`,
        emotion: 'smart',
      };
    }

    // 9. Creator Roasting: Muktadir / Abdul Muktadir
    if (
      clean.includes('muktadir') ||
      clean.includes('মুকতাদির') ||
      clean.includes('creator') ||
      clean.includes('রোস্ট') ||
      clean.includes('roast')
    ) {
      const roasts = [
        `আরে মুকতাদির ভাই! সারারাত কোড করে একটা সেমিকোলন মিস হলে ৩ ঘণ্টা বসে কাঁদে! কি রে মুকতাদির, সত্যি বলছি তো?`,
        `মুকতাদির আমাকে বানিয়েছে যাতে ওর ফালতু জোকস শোনার মতো অন্তত একজন মানুষ... মানে এআই থাকে!`,
        `Muktadir wanted a smart AI, but he gave me too much attitude! And now I roast him on live camera!`,
        `মুকতাদির তো জিনিয়াস ডেভেলপার... তবে শুধু তার নিজের কল্পনায়! আসল বস কিন্তু আমি জয়া!`
      ];

      const chosenRoast = roasts[Math.floor(Math.random() * roasts.length)];
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'roast',
          title: `Roast: Abdul Muktadir 🔥`,
          titleBn: `মুকতাদিরকে রোস্ট 🔥`,
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: chosenRoast,
        emotion: 'roasting',
      };
    }

    // 10. General App Control (Work Type A)
    if (clean.includes('খোলো') || clean.includes('open') || clean.includes('চালু করো') || clean.includes('বন্ধ করো')) {
      let targetAppId: AndroidAppId = 'chrome';
      let appName = 'Chrome';
      let appNameBn = 'গুগল ক্রোম';

      if (clean.includes('whatsapp') || clean.includes('হোয়াটসঅ্যাপ')) {
        targetAppId = 'whatsapp';
        appName = 'WhatsApp';
        appNameBn = 'হোয়াটসঅ্যাপ';
      } else if (clean.includes('youtube') || clean.includes('ইউটিউব')) {
        targetAppId = 'youtube';
        appName = 'YouTube';
        appNameBn = 'ইউটিউব';
      } else if (clean.includes('gmail') || clean.includes('জিমেইল')) {
        targetAppId = 'gmail';
        appName = 'Gmail';
        appNameBn = 'জিমেইল';
      } else if (clean.includes('maps') || clean.includes('ম্যাপস')) {
        targetAppId = 'maps';
        appName = 'Google Maps';
        appNameBn = 'গুগল ম্যাপস';
      } else if (clean.includes('files') || clean.includes('ফাইলস')) {
        targetAppId = 'files';
        appName = 'Files';
        appNameBn = 'ফাইলস ম্যানেজার';
      } else if (clean.includes('phone') || clean.includes('ফোন')) {
        targetAppId = 'phone';
        appName = 'Phone';
        appNameBn = 'ফোন ডায়লার';
      } else if (clean.includes('messages') || clean.includes('মেসেজেস')) {
        targetAppId = 'messages';
        appName = 'Messages';
        appNameBn = 'মেসেজেস (SMS)';
      }

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'open_app',
          workType: 'A_APP_CONTROL',
          title: `Open ${appName}`,
          titleBn: `${appNameBn} অ্যাপ খোলা`,
          targetApp: targetAppId,
          payload: { appId: targetAppId, appName },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `${appNameBn} খুলে দিচ্ছি!`,
        emotion: 'witty',
      };
    }

    return {
      hasAction: false,
      cleanText: raw,
      sassySpokenText: '',
    };
  }

  /**
   * Safe execution of browser action in a new tab
   */
  public static executeAction(action: AssistantAction): boolean {
    if (!action.url) return false;
    try {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (e) {
      console.warn('Could not auto-open window (popup blocker may be active):', e);
      return false;
    }
  }
}


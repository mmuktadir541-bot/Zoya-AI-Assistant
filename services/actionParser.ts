import { ActionParseResult, AssistantAction, AndroidAppId, WorkType } from '../types';
import { androidDeviceManager } from './androidDeviceManager';
import { OfflineCommandEngine } from './offlineCommandEngine';

/**
 * Natural Language Command Parser for Android AI Automation Agent (Zoya)
 * Fully supports Bengali, Hindi, and English voice/text commands.
 */
export class ActionParser {
  public static parseCommand(input: string): ActionParseResult {
    const raw = input.trim();
    if (!raw) {
      return { hasAction: false, cleanText: '', sassySpokenText: '' };
    }

    // High-speed offline command resolution for direct device intents (Settings, Flashlight, Timers, Apps)
    const offlineRes = OfflineCommandEngine.parseOffline(raw);
    if (offlineRes.hasAction) {
      return offlineRes;
    }

    const clean = raw.toLowerCase().replace(/^(hey\s+|suno\s+|please\s+|zoya\s+|can\s+you\s+|জয়া\s+|দয়া\s+করে\s+)+/i, '').trim();

    // 0. Assistant Wakeup / Activation: "Start Zoya", "Hey Zoya", "Hello Zoya", "শুরু করো"
    if (
      clean === 'start' ||
      clean === 'start zoya' ||
      clean === 'zoya' ||
      clean === 'hey zoya' ||
      clean === 'hi zoya' ||
      clean === 'hello zoya' ||
      clean === 'জয়া' ||
      clean.includes('জয়া স্টার্ট') ||
      clean.includes('শুরু করো') ||
      clean.includes('জাগো') ||
      clean.includes('wake up') ||
      clean.includes('হাই জয়া') ||
      clean.includes('হ্যালো জয়া')
    ) {
      return {
        hasAction: false,
        cleanText: raw,
        sassySpokenText: 'হ্যাঁ মুকতাদির! আমি জয়া, তোমার লোকাল অ্যান্ড্রয়েড অটোমেশন এজেন্ট পুরোপুরি চালু আছি! বলো কি কাজ করতে হবে—"Termux খোলো", "স্ক্রিনে যা আছে পড়ে শোনাও", বা "এই অ্যাপে কাজ করো"?',
        emotion: 'flirty',
      };
    }

    // 1. Termux Command Execution: “এই কমান্ডটা Termux-এ চালাও” or "Termux-এ <command> চালাও"
    if (
      (clean.includes('termux') || clean.includes('টার্মাক্স') || clean.includes('টার্মুক্স')) &&
      (clean.includes('কমান্ড') || clean.includes('command') || clean.includes('চালাও') || clean.includes('run') || clean.includes('exec') || clean.includes('চালান'))
    ) {
      let command = '';

      // Check for quotes first: `rm -rf` or "rm -rf" or 'rm -rf'
      const quotedMatch = raw.match(/[`"']([^`"']+)`['"]/);
      if (quotedMatch && quotedMatch[1]) {
        command = quotedMatch[1].trim();
      }

      // Check for colon: Termux: rm -rf /sdcard/Photos
      if (!command) {
        const colonMatch = raw.match(/(?:termux|টার্মাক্স)\s*:\s*(.+)$/i);
        if (colonMatch && colonMatch[1]) {
          command = colonMatch[1].replace(/\s*(?:কমান্ড\s+চালাও|কমান্ড|চালাও|চালান|রান\s+করো|run|exec)$/i, '').trim();
        }
      }

      // Check for pattern: Termux(-এ| এ| in)? <command> (কমান্ড চালাও|কমান্ড|চালাও|রান করো|run|exec)
      if (!command) {
        const patternMatch = raw.match(/(?:termux(?:-এ|\s*এ|\s*in)?|টার্মাক্স(?:-এ|\s*এ)?)\s+(.+?)(?:\s+(?:কমান্ড\s+চালাও|কমান্ড\s+রান\s+করো|কমান্ড|চালাও|চালান|রান\s+করো|run|exec))?$/i);
        if (patternMatch && patternMatch[1]) {
          command = patternMatch[1].trim();
        }
      }

      if (!command || command.toLowerCase() === 'termux' || command.toLowerCase() === 'টার্মাক্স') {
        if (clean.includes('storage') || clean.includes('স্টোরেজ')) {
          command = 'termux-setup-storage';
        } else if (clean.includes('battery') || clean.includes('ব্যাটারি')) {
          command = 'termux-battery-status';
        } else if (clean.includes('update') || clean.includes('আপডেট')) {
          command = 'pkg update';
        } else if (clean.includes('python') || clean.includes('পাইথন')) {
          command = 'python -c "print(\'Hello from Android AI Agent via Termux!\')"';
        } else {
          command = 'uname -a && termux-battery-status';
        }
      }

      const safety = androidDeviceManager.evaluateCommandSafety(command);

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'termux_run',
          workType: 'D_TERMUX_COMMAND',
          title: `Termux: ${command}`,
          titleBn: `টার্মাক্সে কমান্ড চালানো: ${command}`,
          targetApp: 'termux',
          requiresPermission: 'TERMUX_RUN_COMMAND',
          requiresExplicitConsent: safety.requiresConfirmation,
          payload: {
            command,
            commandExplanation: safety.explanation,
            commandExplanationBn: safety.explanationBn,
            dangerLevel: safety.dangerLevel,
          },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `টার্মাক্সে "${command}" কমান্ড চালানোর প্রস্তুতি নিয়েছি। কনফার্ম করলেই রান হবে!`,
        emotion: 'smart',
      };
    }

    // 2. Open Termux: “Termux খোলো”
    if (
      (clean.includes('termux') || clean.includes('টার্মাক্স') || clean.includes('টার্মুক্স')) &&
      (clean.includes('খোলো') || clean.includes('open') || clean.includes('খোল') || clean.includes('স্টার্ট'))
    ) {
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'open_app',
          workType: 'A_APP_CONTROL',
          title: 'Open Termux Environment',
          titleBn: 'টার্মাক্স লিনাক্স শেল খোলা',
          targetApp: 'termux',
          requiresPermission: 'TERMUX_RUN_COMMAND',
          requiresExplicitConsent: false,
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `টার্মাক্স লিনাক্স টার্মিনাল সরাসরি ওপেন করছি!`,
        emotion: 'smart',
      };
    }

    // 3. Screen Text Reading: “স্ক্রিনে যা আছে সেটা পড়ে শোনাও” / "স্ক্রিন পড়ো"
    if (
      clean.includes('স্ক্রিনে যা আছে') ||
      clean.includes('পড়ে শোনাও') ||
      clean.includes('পড়ে শোনাও') ||
      clean.includes('স্ক্রিন পড়') ||
      clean.includes('read screen') ||
      clean.includes('what is on screen') ||
      clean.includes('স্ক্রিনে কি আছে')
    ) {
      const summary = androidDeviceManager.getScreenTextSummary();
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'read_screen',
          workType: 'F_SCREEN_READER',
          title: 'Accessibility Screen Text Reader',
          titleBn: 'স্ক্রিনের দৃশ্যমান টেক্সট পাঠ ও বিশ্লেষণ',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
          requiresExplicitConsent: false,
          payload: { screenSummary: summary },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `স্ক্রিনে দেখা যাচ্ছে: রহমান ভাইয়ের সাথে হোয়াটসঅ্যাপ চ্যাট খোলা রয়েছে। তিনি জিজ্ঞেস করেছেন "চায়ের দোকানে আসবা নাকি?"`,
        emotion: 'smart',
      };
    }

    // 4. In-App Automation: “এই অ্যাপের ভিতরে আমার নির্দেশ অনুযায়ী কাজ করো”
    if (
      clean.includes('অ্যাপের ভিতরে') ||
      clean.includes('ইন-অ্যাপ') ||
      clean.includes('অটোমেশন') ||
      clean.includes('निर्देश') ||
      clean.includes('in-app automate') ||
      clean.includes('কাজ করো')
    ) {
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'in_app_automate',
          workType: 'C_IN_APP_AUTOMATION',
          title: 'In-App UI Automation Sequence',
          titleBn: 'অ্যাপের ভেতর স্বয়ংক্রিয় নির্দেশ পালন',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
          requiresExplicitConsent: true,
          payload: {
            appName: 'Active App',
            automationSteps: [
              { step: 1, action: 'Focus Input Field (android.widget.EditText)', delayMs: 400 },
              { step: 2, action: 'Inject Voice Text via Accessibility Input', delayMs: 800 },
              { step: 3, action: 'Click Send Button (android.widget.ImageButton)', delayMs: 1200 },
            ],
          },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `অ্যাক্সেসিবিলিটি সার্ভিসের মাধ্যমে অ্যাপের ভেতর স্বয়ংক্রিয়ভাবে ক্লিক ও টেক্সট টাইপ সম্পন্ন করছি!`,
        emotion: 'sassy',
      };
    }

    // 5. File Search: “ফাইলটা খুঁজে দাও” / “ফাইল খোঁজো”
    if (
      clean.includes('file') ||
      clean.includes('ফাইল') ||
      clean.includes('ডকুমেন্ট') ||
      clean.includes('document') ||
      clean.includes('pdf') ||
      clean.includes('পিডিএফ')
    ) {
      let query = raw.replace(/^(ফাইল|ফাইলটা|ডকুমেন্ট|খুঁজে দাও|search|file)\s*/gi, '').trim() || 'Project_Zoya';
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
          requiresExplicitConsent: false,
          payload: { query },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `আপনার স্টোরেজে থাকা প্রয়োজনীয় ফাইল এবং ডকুমেন্টস খুঁজে বের করেছি।`,
        emotion: 'smart',
      };
    }

    // 6. Shizuku Privileged Access
    if (clean.includes('shizuku') || clean.includes('শিজুকু')) {
      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'shizuku_exec',
          workType: 'G_SHIZUKU_PRIVILEGED',
          title: 'Shizuku Privileged Service',
          titleBn: 'শিজুকু এডিবি প্রিভিলেজ সার্ভিস',
          targetApp: 'shizuku',
          requiresPermission: 'SHIZUKU_PERMISSION',
          requiresExplicitConsent: true,
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `শিজুকু প্রিভিলেজড সার্ভিস সক্রিয় রয়েছে। রুট ছাড়া এডিবি লেভেল অনুমতি প্রস্তুত!`,
        emotion: 'smart',
      };
    }

    // 7. WhatsApp Action
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
          requiresExplicitConsent: false,
          payload: { contactName, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `হোয়াটসঅ্যাপ ওপেন করে ${contactName}-কে মেসেজ পাঠিয়ে দিচ্ছি!`,
        emotion: 'sassy',
      };
    }

    // 8. Gmail Action
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
          requiresExplicitConsent: false,
          payload: { contactName, recipientEmail: 'tanvir.dev@gmail.com', subject, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `জিমেইল খুলে ${contactName}-কে ইমেইল ড্রাফট পাঠিয়ে দিয়েছি!`,
        emotion: 'smart',
      };
    }

    // 9. Messages (SMS) Action
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
          requiresExplicitConsent: false,
          payload: { contactName, message },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `মেসেজেস খুলে ${contactName}-কে SMS পাঠানো সম্পন্ন হয়েছে!`,
        emotion: 'smart',
      };
    }

    // 10. Google Maps & Navigation
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

    // 11. YouTube Search & Play
    if (clean.includes('youtube') || clean.includes('ইউটিউব') || clean.includes('গান বাজাও') || clean.includes('ভিডিও')) {
      let query = raw
        .replace(/^(ইউটিউবে|youtube|play|গান বাজাও|ভিডিও দেখাও)\s*/gi, '')
        .replace(/\s*(বাজাও|প্লে করো|on youtube|ইউটিউবে)\s*$/gi, '')
        .trim() || 'Bangla Lofi Chill Beats';

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
        sassySpokenText: `ইউটিউবে "${query}" প্লে করছি!`,
        emotion: 'sassy',
      };
    }

    // 12. Phone Call
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
          requiresExplicitConsent: false,
          payload: { contactName, phone: '+8801919876543' },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `ফোন ডায়লার খুলে ${contactName}-কে কল ডায়াল করছি!`,
        emotion: 'sassy',
      };
    }

    // 13. Chrome & Google Search
    if (clean.includes('chrome') || clean.includes('ক্রোম') || clean.includes('search') || clean.includes('খুঁজো') || clean.includes('তথ্য')) {
      const query = raw
        .replace(/^(গুগলে|ক্রোমে|search|খুঁজো|খোঁজ|search for)\s*/gi, '')
        .replace(/\s*(আর পড়ে শোনাও|পড়ে শোনাও|খুঁজে বলো)\s*$/gi, '')
        .trim() || 'Latest Tech News';

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'search_info',
          workType: 'B_INFO_SEARCH',
          title: `Chrome Search: ${query}`,
          titleBn: `ক্রোমে তথ্য সন্ধান ও পাঠ: ${query}`,
          targetApp: 'chrome',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
          requiresExplicitConsent: false,
          payload: { query },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `ক্রোমে "${query}" খুঁজে ফলাফল পেয়েছি এবং পড়ে শোনাচ্ছি!`,
        emotion: 'smart',
      };
    }

    // 14. Universal Android App Launching: “এই অ্যাপটা ওপেন করো” / "<App> খোলো"
    const openTriggers = ['খোলো', 'খোল', 'open', 'চালু করো', 'চালু কর', 'ওপেন করো', 'ওপেন কর', 'start', 'launch', 'app'];
    const hasOpenTrigger = openTriggers.some((trig) => clean.includes(trig)) ||
      clean.includes('facebook') || clean.includes('ফেসবুক') ||
      clean.includes('bkash') || clean.includes('বিকাশ') ||
      clean.includes('nagad') || clean.includes('নগদ') ||
      clean.includes('messenger') || clean.includes('মেসেঞ্জার') ||
      clean.includes('instagram') || clean.includes('ইনস্টাগ্রাম') ||
      clean.includes('tiktok') || clean.includes('টিকটক') ||
      clean.includes('telegram') || clean.includes('টেলিগ্রাম') ||
      clean.includes('calculator') || clean.includes('ক্যালকুলেটর') ||
      clean.includes('camera') || clean.includes('ক্যামেরা') ||
      clean.includes('calendar') || clean.includes('ক্যালেন্ডার') ||
      clean.includes('clock') || clean.includes('ঘড়ি') || clean.includes('alarm') ||
      clean.includes('spotify') || clean.includes('স্পটিফাই') ||
      clean.includes('playstore') || clean.includes('প্লে স্টোর') ||
      clean.includes('photos') || clean.includes('গ্যালারি') ||
      clean.includes('drive') || clean.includes('ড্রাইভ') ||
      clean.includes('chatgpt') || clean.includes('চ্যাটজিপিটি');

    if (hasOpenTrigger) {
      const appQuery = clean
        .replace(/^(খোলো|খোল|open|চালু করো|চালু কর|ওপেন করো|ওপেন কর|start|launch|প্লিজ|দয়া করে|please|এই অ্যাপটা|অ্যাপটা|অ্যাপ)\s*/gi, '')
        .replace(/\s*(অ্যাপ|apps?|খোলো|খোল|open|চালু করো|চালু কর|ওপেন করো|ওপেন কর|করো|কর)$/gi, '')
        .trim();

      const resolved = androidDeviceManager.resolveApp(appQuery || clean);
      const appName = resolved.name;
      const appNameBn = resolved.nameBn;
      const targetAppId = resolved.id;

      return {
        hasAction: true,
        action: {
          id: `act_${Date.now()}`,
          type: 'open_app',
          workType: 'A_APP_CONTROL',
          title: `Open ${appName}`,
          titleBn: `${appNameBn} খোলা`,
          targetApp: targetAppId,
          packageName: resolved.packageName,
          intentUri: resolved.intentUri,
          deepLink: resolved.deepLink,
          url: resolved.webFallback,
          payload: {
            appId: targetAppId,
            appName,
            packageName: resolved.packageName,
            intentUri: resolved.intentUri,
            deepLink: resolved.deepLink,
          },
          executedAt: Date.now(),
        },
        cleanText: raw,
        sassySpokenText: `${appNameBn} সরাসরি আপনার ফোনে খুলে দিচ্ছি!`,
        emotion: 'witty',
      };
    }

    return {
      hasAction: false,
      cleanText: raw,
      sassySpokenText: '',
    };
  }

  public static executeAction(action: AssistantAction): boolean {
    if (action.type === 'termux_run' && action.payload?.command) {
      androidDeviceManager.executeTermuxCommand(action.payload.command);
      return true;
    }

    if (action.targetApp || action.packageName || action.intentUri || action.deepLink) {
      const resolved = androidDeviceManager.resolveApp(action.targetApp || action.payload?.appName || action.title);
      androidDeviceManager.launchNativeAndroidApp({
        id: resolved.id,
        name: resolved.name,
        nameBn: resolved.nameBn,
        packageName: action.packageName || resolved.packageName,
        intentUri: action.intentUri || resolved.intentUri,
        deepLink: action.deepLink || resolved.deepLink,
        webFallback: action.url || resolved.webFallback,
      });
      return true;
    }

    if (!action.url) return false;
    try {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return true;
    } catch (e) {
      return false;
    }
  }
}

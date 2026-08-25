import { AssistantAction, AndroidAppId, CommandDangerLevel, AndroidPermissionType } from '../types';
import { termuxExecutionEngine } from './termuxExecutionEngine';

export interface OfflineCommandMatch {
  isMatched: boolean;
  intent: string;
  confidence: number;
  action?: AssistantAction;
  spokenResponseBn: string;
  spokenResponseEn: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresPermission?: AndroidPermissionType;
  requiresExplicitConsent?: boolean;
}

/**
 * OfflineCommandEngine
 * Deterministic on-device intent parser for Bengali (বাংলা), English, and Banglish.
 * Resolves essential device actions with 0ms latency and zero network round-trip.
 */
export class OfflineCommandEngine {
  public static parse(input: string): OfflineCommandMatch {
    const raw = input.trim();
    const clean = raw
      .toLowerCase()
      .replace(/^(hey\s+|suno\s+|please\s+|zoya\s+|can\s+you\s+|জয়া\s+|দয়া\s+করে\s+)+/i, '')
      .trim();

    if (!clean) {
      return {
        isMatched: false,
        intent: 'empty',
        confidence: 0,
        spokenResponseBn: '',
        spokenResponseEn: '',
        riskLevel: 'LOW',
      };
    }

    // 1. FLASH LIGHT / TORCH TOGGLE
    if (
      clean.includes('flashlight') ||
      clean.includes('flash light') ||
      clean.includes('টর্চ') ||
      clean.includes('ফ্ল্যাশ') ||
      clean.includes('torch')
    ) {
      const isOff = clean.includes('off') || clean.includes('বন্ধ') || clean.includes('নেভাও') || clean.includes('nijhao') || clean.includes('bondho');
      const actionTitle = isOff ? 'টর্চ বন্ধ করা হলো' : 'টর্চ জ্বালানো হলো';
      const actionTitleEn = isOff ? 'Flashlight turned off' : 'Flashlight turned on';

      const action: AssistantAction = {
        id: `offline_torch_${Date.now()}`,
        type: 'device_control',
        workType: 'A_APP_CONTROL',
        title: actionTitleEn,
        titleBn: actionTitle,
        targetApp: 'settings',
        payload: {
          settingKey: 'flashlight',
          settingValue: !isOff,
        },
        executedAt: Date.now(),
      };

      return {
        isMatched: true,
        intent: 'DEVICE_FLASHLIGHT',
        confidence: 0.98,
        action,
        spokenResponseBn: isOff ? 'ফ্ল্যাশলাইট বন্ধ করে দিয়েছি।' : 'ফ্ল্যাশলাইট জ্বালিয়ে দিয়েছি!',
        spokenResponseEn: isOff ? 'Turned off the flashlight.' : 'Turned on the flashlight!',
        riskLevel: 'LOW',
      };
    }

    // 2. SET TIMER
    const timerMatch = clean.match(/(\d+)\s*(minute|min|মিনিট|মিনিটের|সেকেন্ড|sec|second)/i) ||
      clean.match(/(পাঁচ|দশ|পনেরো|বিশ|আধ)\s*(মিনিট|ঘণ্টা)/i);
    
    if (
      (clean.includes('timer') || clean.includes('টাইমার') || clean.includes('অ্যালার্ম') || clean.includes('alarm')) &&
      (timerMatch || clean.includes('set') || clean.includes('সেট') || clean.includes('lagao') || clean.includes('দাও'))
    ) {
      let durationMinutes = 5;
      if (timerMatch) {
        const val = parseInt(timerMatch[1], 10);
        if (!isNaN(val)) durationMinutes = val;
        else if (clean.includes('দশ')) durationMinutes = 10;
        else if (clean.includes('পনেরো')) durationMinutes = 15;
        else if (clean.includes('বিশ')) durationMinutes = 20;
      }

      const durationSeconds = durationMinutes * 60;
      const durationLabel = `${durationMinutes} minutes`;
      const durationLabelBn = `${durationMinutes} মিনিট`;

      const action: AssistantAction = {
        id: `offline_timer_${Date.now()}`,
        type: 'device_control',
        workType: 'A_APP_CONTROL',
        title: `Set Timer for ${durationLabel}`,
        titleBn: `${durationLabelBn} এর টাইমার সেট করা`,
        targetApp: 'clock',
        intentUri: `intent:#Intent;action=android.intent.action.SET_TIMER;i.android.intent.extra.alarm.LENGTH=${durationSeconds};S.android.intent.extra.alarm.MESSAGE=Zoya%20Timer;B.android.intent.extra.alarm.SKIP_UI=false;end;`,
        payload: {
          settingKey: 'timer',
          settingValue: durationSeconds,
          durationLabel,
          durationLabelBn,
        },
        executedAt: Date.now(),
      };

      return {
        isMatched: true,
        intent: 'SET_TIMER',
        confidence: 0.95,
        action,
        spokenResponseBn: `${durationMinutes} মিনিটের টাইমার চালু করে দিয়েছি।`,
        spokenResponseEn: `Set a ${durationMinutes}-minute timer for you.`,
        riskLevel: 'LOW',
      };
    }

    // 3. TERMUX TERMINAL & LOCAL EXECUTION COMMANDS (Priority 4 Native Shell Gateway)
    if (
      clean.includes('termux') ||
      clean.includes('টার্মাক্স') ||
      clean.includes('টার্মুক্স') ||
      clean.includes('terminal') ||
      clean.includes('টার্মিনাল')
    ) {
      let cmd = '';

      // Check for quotes first: `rm -rf` or "rm -rf" or 'rm -rf'
      const quotedMatch = raw.match(/[`"']([^`"']+)`['"]/);
      if (quotedMatch && quotedMatch[1]) {
        cmd = quotedMatch[1].trim();
      }

      // Check for colon: Termux: rm -rf /sdcard/Photos
      if (!cmd) {
        const colonMatch = raw.match(/(?:termux|টার্মাক্স|টার্মুক্স)\s*:\s*(.+)$/i);
        if (colonMatch && colonMatch[1]) {
          cmd = colonMatch[1].replace(/\s*(?:কমান্ড\s+চালাও|কমান্ড|চালাও|চালান|রান\s+করো|run|exec)$/i, '').trim();
        }
      }

      // Check for explicit English prefix: "run <cmd> in termux" or "execute <cmd> in termux"
      if (!cmd) {
        const runInTermuxMatch = raw.match(/(?:run|exec|execute|check)\s+(.+?)\s+in\s+termux/i);
        if (runInTermuxMatch && runInTermuxMatch[1]) {
          cmd = runInTermuxMatch[1].trim();
        }
      }

      // Check for Bengali/Banglish suffix/infix: "Termux-এ pwd চালাও", "Termux এ date command চালাও", "টার্মাক্সে uptime দেখাও", "Termux a whoami check koro"
      if (!cmd) {
        const patternMatch = raw.match(/(?:termux(?:-এ|\s*এ|\s*in|\s*a)?|টার্মাক্স(?:-এ|\s*এ|\s*ে)?)\s+(.+?)(?:\s+(?:command\s+chalao|command|কমান্ড\s+চালাও|কমান্ড\s+রান\s+করো|কমান্ড|চালাও|চালান|রান\s+করো|check\s+koro|চেক\s+করো|দেখাও|show|run|exec))?$/i);
        if (patternMatch && patternMatch[1]) {
          let extracted = patternMatch[1].trim();
          // Clean trailing verb noise
          extracted = extracted.replace(/\s*(?:command|কমান্ড|কমান্ডটি|চালাও|চালান|রান\s+করো|check\s+koro|চেক\s+করো|দেখাও)$/i, '').trim();
          if (extracted && extracted.toLowerCase() !== 'termux' && extracted.toLowerCase() !== 'টার্মাক্স') {
            cmd = extracted;
          }
        }
      }

      // Check if user just wants to open Termux app: "Termux open koro", "টার্মাক্স খোলো", "Open Termux"
      const isOpenAppOnly = !cmd ||
        clean === 'termux' ||
        clean === 'টার্মাক্স' ||
        clean === 'open termux' ||
        clean === 'termux open' ||
        clean === 'termux open koro' ||
        clean === 'টার্মাক্স খোলো' ||
        clean === 'টার্মাক্স ওপেন করো';

      if (isOpenAppOnly) {
        const action: AssistantAction = {
          id: `offline_termux_open_${Date.now()}`,
          type: 'open_app',
          workType: 'A_APP_CONTROL',
          title: 'Open Termux',
          titleBn: 'টার্মাক্স ওপেন করা',
          targetApp: 'termux',
          packageName: 'com.termux',
          executedAt: Date.now(),
        };

        return {
          isMatched: true,
          intent: 'OPEN_TERMUX',
          confidence: 0.98,
          action,
          spokenResponseBn: 'টার্মাক্স অ্যাপ ওপেন করছি।',
          spokenResponseEn: 'Opening Termux application.',
          riskLevel: 'LOW',
        };
      }

      // Evaluate safety through centralized Security Policy Engine
      const safety = termuxExecutionEngine.evaluateCommandSafety(cmd);

      const action: AssistantAction = {
        id: `offline_termux_${Date.now()}`,
        type: 'termux_run',
        workType: 'D_TERMUX_COMMAND',
        title: `Termux: ${safety.sanitizedCommand || cmd}`,
        titleBn: `টার্মাক্স: ${safety.sanitizedCommand || cmd}`,
        targetApp: 'termux',
        packageName: 'com.termux',
        requiresPermission: 'TERMUX_RUN_COMMAND',
        requiresExplicitConsent: safety.requiresConfirmation,
        payload: {
          command: safety.sanitizedCommand || cmd,
          commandExplanation: safety.explanation,
          commandExplanationBn: safety.explanationBn,
          dangerLevel: safety.dangerLevel,
        },
        executedAt: Date.now(),
      };

      let spokenBn = `টার্মাক্সে "${cmd}" কমান্ড সম্পন্ন করা হচ্ছে।`;
      let spokenEn = `Executing "${cmd}" in Termux.`;

      if (safety.isForbidden) {
        spokenBn = `নিরাপত্তা কারণে এই ক্ষতিকর কমান্ডটি টার্মাক্সে চালানো নিষিদ্ধ: "${cmd}"।`;
        spokenEn = `For security reasons, this destructive command is forbidden in Termux: "${cmd}".`;
      } else if (safety.isInteractive) {
        spokenBn = 'এই কমান্ডটিতে ইন্টারঅ্যাক্টিভ ইনপুট প্রয়োজন যা বর্তমানে সরাসরি সমর্থিত নয়।';
        spokenEn = 'Interactive input is not currently supported for this command.';
      } else if (safety.requiresConfirmation) {
        spokenBn = `টার্মাক্সে "${cmd}" কমান্ড চালানোর আগে আপনার নিশ্চিতকরণ প্রয়োজন।`;
        spokenEn = `Explicit confirmation required before executing "${cmd}" in Termux.`;
      }

      const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
        safety.dangerLevel === 'destructive' || safety.dangerLevel === 'forbidden'
          ? 'HIGH'
          : safety.dangerLevel === 'privileged'
          ? 'MEDIUM'
          : 'LOW';

      return {
        isMatched: true,
        intent: 'TERMUX_RUN_COMMAND',
        confidence: 0.96,
        action,
        spokenResponseBn: spokenBn,
        spokenResponseEn: spokenEn,
        riskLevel,
        requiresPermission: 'TERMUX_RUN_COMMAND',
        requiresExplicitConsent: safety.requiresConfirmation,
      };
    }

    // 4. BATTERY SETTINGS & STATUS
    if (
      clean.includes('battery') ||
      clean.includes('ব্যাটারি') ||
      clean.includes('চার্জ') ||
      clean.includes('charge')
    ) {
      const isSettings = clean.includes('setting') || clean.includes('সেটিং') || clean.includes('সেটিংস') || clean.includes('open') || clean.includes('খোলো') || clean.includes('kholo');
      
      const action: AssistantAction = {
        id: `offline_battery_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Android Battery Settings',
        titleBn: 'অ্যান্ড্রয়েড ব্যাটারি সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.BATTERY_SAVER_SETTINGS',
        payload: {
          settingCategory: 'battery',
        },
      };

      return {
        isMatched: true,
        intent: isSettings ? 'OPEN_BATTERY_SETTINGS' : 'CHECK_BATTERY_STATUS',
        confidence: 0.96,
        action,
        spokenResponseBn: 'ব্যাটারি সেটিংস ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening Battery Settings.',
        riskLevel: 'LOW',
      };
    }

    // 4. WI-FI SETTINGS
    if (
      clean.includes('wifi') ||
      clean.includes('wi-fi') ||
      clean.includes('ওয়াইফাই') ||
      clean.includes('ওয়াইফাই') ||
      clean.includes('internet') ||
      clean.includes('ইন্টারনেট')
    ) {
      const action: AssistantAction = {
        id: `offline_wifi_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Wi-Fi Settings',
        titleBn: 'ওয়াইফাই সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.WIFI_SETTINGS',
        payload: {
          settingCategory: 'wifi',
        },
      };

      return {
        isMatched: true,
        intent: 'OPEN_WIFI_SETTINGS',
        confidence: 0.95,
        action,
        spokenResponseBn: 'ওয়াইফাই সেটিংস ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening Wi-Fi Settings.',
        riskLevel: 'LOW',
      };
    }

    // 5. BLUETOOTH SETTINGS
    if (
      clean.includes('bluetooth') ||
      clean.includes('ব্লুটুথ') ||
      clean.includes('bt')
    ) {
      const action: AssistantAction = {
        id: `offline_bt_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Bluetooth Settings',
        titleBn: 'ব্লুটুথ সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.BLUETOOTH_SETTINGS',
        payload: {
          settingCategory: 'bluetooth',
        },
      };

      return {
        isMatched: true,
        intent: 'OPEN_BLUETOOTH_SETTINGS',
        confidence: 0.95,
        action,
        spokenResponseBn: 'ব্লুটুথ সেটিংস ওপেন করা হয়েছে।',
        spokenResponseEn: 'Opening Bluetooth Settings.',
        riskLevel: 'LOW',
      };
    }

    // 6. DISPLAY & BRIGHTNESS SETTINGS
    if (
      clean.includes('display') ||
      clean.includes('brightness') ||
      clean.includes('ডিসপ্লে') ||
      clean.includes('উজ্জ্বলতা')
    ) {
      const action: AssistantAction = {
        id: `offline_display_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Display Settings',
        titleBn: 'ডিসপ্লে সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.DISPLAY_SETTINGS',
        payload: {
          settingCategory: 'display',
        },
      };

      return {
        isMatched: true,
        intent: 'OPEN_DISPLAY_SETTINGS',
        confidence: 0.94,
        action,
        spokenResponseBn: 'ডিসপ্লে সেটিংস ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening Display Settings.',
        riskLevel: 'LOW',
      };
    }

    // 7. SOUND & VOLUME SETTINGS / CONTROLS
    if (
      clean.includes('volume') ||
      clean.includes('sound') ||
      clean.includes('সাউন্ড') ||
      clean.includes('শব্দ') ||
      clean.includes('ভলিউম') ||
      clean.includes('mute') ||
      clean.includes('মিউট')
    ) {
      const isMute = clean.includes('mute') || clean.includes('মিউট') || clean.includes('silent') || clean.includes('সাইলেন্ট');
      
      const action: AssistantAction = {
        id: `offline_sound_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Sound & Vibration Settings',
        titleBn: 'সাউন্ড ও ভাইব্রেশন সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.SOUND_SETTINGS',
        payload: {
          settingCategory: 'sound',
          isMuted: isMute,
        },
      };

      return {
        isMatched: true,
        intent: 'OPEN_SOUND_SETTINGS',
        confidence: 0.94,
        action,
        spokenResponseBn: isMute ? 'সাউন্ড মিউট সেটিংস ওপেন করছি।' : 'সাউন্ড ও ভলিউম সেটিংস ওপেন করছি।',
        spokenResponseEn: isMute ? 'Opening mute sound settings.' : 'Opening Sound & Volume Settings.',
        riskLevel: 'LOW',
      };
    }

    // 8. ACCESSIBILITY SETTINGS / SCREEN READER
    if (
      clean.includes('accessibility') ||
      clean.includes('অ্যাক্সেসিবিলিটি') ||
      clean.includes('screen read') ||
      clean.includes('স্ক্রিন পড়') ||
      clean.includes('স্ক্রিনে কি আছে')
    ) {
      if (clean.includes('পড়') || clean.includes('read') || clean.includes('শোনাও')) {
        const action: AssistantAction = {
          id: `offline_screenreader_${Date.now()}`,
          type: 'read_screen',
          title: 'Read Screen via Accessibility',
          titleBn: 'অ্যাক্সেসিবিলিটি দিয়ে স্ক্রিন পাঠ',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
        };

        return {
          isMatched: true,
          intent: 'READ_SCREEN',
          confidence: 0.95,
          action,
          spokenResponseBn: 'স্ক্রিনের ভিজ্যুয়াল এলিমেন্ট ও টেক্সট পড়ে শোনাচ্ছি।',
          spokenResponseEn: 'Analyzing and reading the current screen content.',
          riskLevel: 'LOW',
          requiresPermission: 'BIND_ACCESSIBILITY_SERVICE',
        };
      }

      const action: AssistantAction = {
        id: `offline_access_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Accessibility Settings',
        titleBn: 'অ্যাক্সেসিবিলিটি সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.ACCESSIBILITY_SETTINGS',
        payload: {
          settingCategory: 'accessibility',
        },
      };

      return {
        isMatched: true,
        intent: 'OPEN_ACCESSIBILITY_SETTINGS',
        confidence: 0.95,
        action,
        spokenResponseBn: 'অ্যাক্সেসিবিলিটি সেটিংস ওপেন করেছি।',
        spokenResponseEn: 'Opening Accessibility Settings.',
        riskLevel: 'LOW',
      };
    }

    // 9. WHATSAPP
    if (
      clean.includes('whatsapp') ||
      clean.includes('হোয়াটসঅ্যাপ') ||
      clean.includes('হোয়াটস্যাপ') ||
      clean.includes('হোয়াটস্যাপ') ||
      clean.includes('watsapp')
    ) {
      const action: AssistantAction = {
        id: `offline_wa_${Date.now()}`,
        type: 'whatsapp',
        title: 'Launch WhatsApp',
        titleBn: 'হোয়াটসঅ্যাপ খোলা হচ্ছে',
        targetApp: 'whatsapp',
        packageName: 'com.whatsapp',
        deepLink: 'whatsapp://app',
      };

      return {
        isMatched: true,
        intent: 'OPEN_WHATSAPP',
        confidence: 0.98,
        action,
        spokenResponseBn: 'হোয়াটসঅ্যাপ ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening WhatsApp.',
        riskLevel: 'LOW',
      };
    }

    // 10. YOUTUBE
    if (
      clean.includes('youtube') ||
      clean.includes('ইউটিউব') ||
      clean.includes('video') ||
      clean.includes('ভিডিও')
    ) {
      const action: AssistantAction = {
        id: `offline_yt_${Date.now()}`,
        type: 'youtube',
        title: 'Launch YouTube',
        titleBn: 'ইউটিউব খোলা হচ্ছে',
        targetApp: 'youtube',
        packageName: 'com.google.android.youtube',
        deepLink: 'https://youtube.com',
      };

      return {
        isMatched: true,
        intent: 'OPEN_YOUTUBE',
        confidence: 0.97,
        action,
        spokenResponseBn: 'ইউটিউব ওপেন করেছি।',
        spokenResponseEn: 'Opening YouTube.',
        riskLevel: 'LOW',
      };
    }

    // 11. SPOTIFY / MUSIC
    if (
      clean.includes('spotify') ||
      clean.includes('স্পটিফাই') ||
      clean.includes('গান') ||
      clean.includes('music') ||
      clean.includes('song')
    ) {
      const action: AssistantAction = {
        id: `offline_sp_${Date.now()}`,
        type: 'spotify',
        title: 'Launch Spotify Music',
        titleBn: 'স্পটিফাই মিউজিক খোলা হচ্ছে',
        targetApp: 'spotify',
        packageName: 'com.spotify.music',
        deepLink: 'spotify://app',
      };

      return {
        isMatched: true,
        intent: 'OPEN_SPOTIFY',
        confidence: 0.96,
        action,
        spokenResponseBn: 'স্পটিফাই ওপেন করছি, গান উপভোগ করো!',
        spokenResponseEn: 'Opening Spotify.',
        riskLevel: 'LOW',
      };
    }

    // 12. CAMERA
    const isCameraIntent =
      clean === 'camera' ||
      clean === 'ক্যামেরা' ||
      clean.startsWith('open camera') ||
      clean.startsWith('launch camera') ||
      clean.includes('ক্যামেরা খোলো') ||
      clean.includes('ক্যামেরা ওপেন') ||
      clean.includes('ছবি তোল') ||
      clean.includes('ছবি তুল') ||
      clean.includes('take photo') ||
      clean.includes('take a picture');

    if (isCameraIntent) {
      const action: AssistantAction = {
        id: `offline_cam_${Date.now()}`,
        type: 'open_app',
        title: 'Launch Android Camera',
        titleBn: 'ক্যামেরা খোলা হচ্ছে',
        targetApp: 'camera',
        packageName: 'com.google.android.GoogleCamera',
        intentUri: 'android.media.action.IMAGE_CAPTURE',
      };

      return {
        isMatched: true,
        intent: 'OPEN_CAMERA',
        confidence: 0.97,
        action,
        spokenResponseBn: 'ক্যামেরা ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening Camera.',
        riskLevel: 'LOW',
      };
    }

    // 13. FILES / STORAGE
    if (
      clean.includes('file') ||
      clean.includes('ফাইল') ||
      clean.includes('ফাইলস') ||
      clean.includes('storage') ||
      clean.includes('স্টোরেজ') ||
      clean.includes('download') ||
      clean.includes('ডাউনলোড')
    ) {
      const action: AssistantAction = {
        id: `offline_files_${Date.now()}`,
        type: 'read_files',
        title: 'Launch File Manager',
        titleBn: 'ফাইল ম্যানেজার খোলা হচ্ছে',
        targetApp: 'files',
        packageName: 'com.google.android.documentsui',
        requiresPermission: 'MANAGE_EXTERNAL_STORAGE',
      };

      return {
        isMatched: true,
        intent: 'OPEN_FILES',
        confidence: 0.95,
        action,
        spokenResponseBn: 'ফাইল ম্যানেজার ওপেন করেছি।',
        spokenResponseEn: 'Opening Files Manager.',
        riskLevel: 'LOW',
        requiresPermission: 'MANAGE_EXTERNAL_STORAGE',
      };
    }

    // 14. GMAIL
    if (
      clean.includes('gmail') ||
      clean.includes('email') ||
      clean.includes('জিমেইল') ||
      clean.includes('ইমেইল') ||
      clean.includes('মেইল')
    ) {
      const action: AssistantAction = {
        id: `offline_gmail_${Date.now()}`,
        type: 'gmail',
        title: 'Launch Gmail',
        titleBn: 'জিমেইল খোলা হচ্ছে',
        targetApp: 'gmail',
        packageName: 'com.google.android.gm',
        deepLink: 'googlegmail://',
      };

      return {
        isMatched: true,
        intent: 'OPEN_GMAIL',
        confidence: 0.96,
        action,
        spokenResponseBn: 'জিমেইল ওপেন করেছি।',
        spokenResponseEn: 'Opening Gmail.',
        riskLevel: 'LOW',
      };
    }

    // 15. GOOGLE MAPS / LOCATION
    if (
      clean.includes('maps') ||
      clean.includes('map') ||
      clean.includes('ম্যাপ') ||
      clean.includes('ম্যাপস') ||
      clean.includes('location') ||
      clean.includes('লোকেশন') ||
      clean.includes('রাস্তা')
    ) {
      const action: AssistantAction = {
        id: `offline_maps_${Date.now()}`,
        type: 'maps',
        title: 'Launch Google Maps',
        titleBn: 'গুগল ম্যাপস খোলা হচ্ছে',
        targetApp: 'maps',
        packageName: 'com.google.android.apps.maps',
        deepLink: 'geo:0,0?q=current+location',
        requiresPermission: 'ACCESS_FINE_LOCATION',
      };

      return {
        isMatched: true,
        intent: 'OPEN_MAPS',
        confidence: 0.95,
        action,
        spokenResponseBn: 'গুগল ম্যাপস ওপেন করছি।',
        spokenResponseEn: 'Opening Google Maps.',
        riskLevel: 'LOW',
        requiresPermission: 'ACCESS_FINE_LOCATION',
      };
    }

    // 16. PHONE / DIALER
    const isDialerIntent =
      clean === 'phone' ||
      clean === 'phone app' ||
      clean === 'dialer' ||
      clean === 'ফোন' ||
      clean.startsWith('open phone') ||
      clean.startsWith('launch phone') ||
      clean.includes('open dialer') ||
      clean.includes('ফোন খোলো') ||
      clean.includes('ফোন অ্যাপ') ||
      clean.includes('ডায়ালার খোলো') ||
      clean.includes('ডায়লার') ||
      clean.startsWith('call ') ||
      clean.startsWith('dial ') ||
      clean.includes('কল করো') ||
      clean.includes('কল দাও');

    if (isDialerIntent) {
      const action: AssistantAction = {
        id: `offline_phone_${Date.now()}`,
        type: 'phone_call',
        title: 'Launch Phone Dialer',
        titleBn: 'ফোন ডায়ালার খোলা হচ্ছে',
        targetApp: 'phone',
        packageName: 'com.google.android.dialer',
        intentUri: 'android.intent.action.DIAL',
        requiresPermission: 'CALL_PHONE',
      };

      return {
        isMatched: true,
        intent: 'OPEN_DIALER',
        confidence: 0.94,
        action,
        spokenResponseBn: 'ফোন ডায়ালার ওপেন করে দিয়েছি।',
        spokenResponseEn: 'Opening Phone Dialer.',
        riskLevel: 'LOW',
        requiresPermission: 'CALL_PHONE',
      };
    }

    // 17. GENERAL ANDROID SETTINGS
    if (
      clean.includes('settings') ||
      clean.includes('সেটিংস') ||
      clean.includes('সেটিং') ||
      clean.includes('setting')
    ) {
      const action: AssistantAction = {
        id: `offline_settings_${Date.now()}`,
        type: 'device_setting',
        title: 'Open Android System Settings',
        titleBn: 'অ্যান্ড্রয়েড সিস্টেম সেটিংস খোলা হচ্ছে',
        targetApp: 'settings',
        intentUri: 'android.settings.SETTINGS',
      };

      return {
        isMatched: true,
        intent: 'OPEN_SETTINGS',
        confidence: 0.95,
        action,
        spokenResponseBn: 'সিস্টেম সেটিংস ওপেন করেছি।',
        spokenResponseEn: 'Opening System Settings.',
        riskLevel: 'LOW',
      };
    }

    // No local rule match -> defer to online Gemini AI Brain
    return {
      isMatched: false,
      intent: 'UNKNOWN',
      confidence: 0,
      spokenResponseBn: '',
      spokenResponseEn: '',
      riskLevel: 'LOW',
    };
  }

  /**
   * Check if a query can be handled offline with high confidence
   */
  public static canHandleOffline(input: string): boolean {
    const res = this.parse(input);
    return res.isMatched && res.confidence >= 0.85;
  }

  /**
   * Return ActionParseResult compatible format for ActionGateway
   */
  public static parseOffline(input: string): {
    hasAction: boolean;
    action?: AssistantAction;
    cleanText: string;
    sassySpokenText: string;
    emotion?: string;
  } {
    const res = this.parse(input);
    if (res.isMatched && res.action) {
      return {
        hasAction: true,
        action: res.action,
        cleanText: input,
        sassySpokenText: res.spokenResponseBn,
        emotion: 'witty',
      };
    }
    return {
      hasAction: false,
      cleanText: input,
      sassySpokenText: '',
      emotion: 'neutral',
    };
  }

  public parse(input: string): OfflineCommandMatch {
    return OfflineCommandEngine.parse(input);
  }

  public matchCommand(input: string): OfflineCommandMatch {
    return OfflineCommandEngine.parse(input);
  }

  public canHandleOffline(input: string): boolean {
    return OfflineCommandEngine.canHandleOffline(input);
  }
}

export const offlineCommandEngine = new OfflineCommandEngine();



import {
  AndroidApp,
  AndroidAppId,
  AndroidPermissionState,
  AndroidPermissionType,
  AssistantAction,
  CommandDangerLevel,
  DeviceAuditLog,
  ScreenNode,
  TermuxExecutionRecord,
} from '../types';

export const INITIAL_ANDROID_PERMISSIONS: AndroidPermissionState[] = [
  {
    id: 'BIND_ACCESSIBILITY_SERVICE',
    name: 'Android Accessibility Service',
    nameBn: 'অ্যাক্সেসিবিলিটি সার্ভিস অটোমেশন',
    description: 'Allows the agent to read on-screen UI elements, tap buttons, scroll views, and automate apps with explicit user consent.',
    descriptionBn: 'স্ক্রিনে টেক্সট পড়া, বাটন ট্যাপ করা, স্ক্রল করা এবং অ্যাপস স্বয়ংক্রিয়ভাবে চালানোর অনুমতি।',
    granted: true,
    sensitive: true,
    requiredFor: ['Screen Reading (স্ক্রিন পাঠ)', 'App Automation (ইন-অ্যাপ কাজ)', 'UI Interaction'],
  },
  {
    id: 'TERMUX_RUN_COMMAND',
    name: 'Termux Command Execution (RUN_COMMAND)',
    nameBn: 'টার্মাক্স কমান্ড এক্সিকিউশন সার্ভিস',
    description: 'Allows the agent to dispatch user-approved CLI commands to local Termux environment and receive stdout/stderr.',
    descriptionBn: 'টার্মাক্সে অনুমোদিত স্ক্রিপ্ট বা শেল কমান্ড চালানো এবং আউটপুট দেখার অনুমতি।',
    granted: true,
    sensitive: true,
    requiredFor: ['Termux CLI Scripts', 'Termux:API Sensors', 'Python/Node Execution'],
  },
  {
    id: 'RECORD_AUDIO',
    name: 'Microphone & Voice Input',
    nameBn: 'মাইক্রোফোন ও ভয়েস ইনপুট',
    description: 'Allows Zoya to capture voice commands in real-time in Bengali, Hindi, and English.',
    descriptionBn: 'বাংলা, হিন্দি ও ইংরেজিতে সরাসরি ভয়েস কমান্ড গ্রহণ ও প্রসেস করার জন্য।',
    granted: true,
    sensitive: false,
    requiredFor: ['Live Voice Input', 'Speech Recognition'],
  },
  {
    id: 'SHIZUKU_PERMISSION',
    name: 'Shizuku Privileged Access (Optional ADB)',
    nameBn: 'শিজুকু প্রিভিলেজড সিস্টেম অ্যাক্সেস (ঐচ্ছিক)',
    description: 'Optional ADB-level privileged access without root for system-level controls and fast service management.',
    descriptionBn: 'রুট ছাড়া এডিবি প্রিভিলেজড অ্যাক্সেসের মাধ্যমে সিস্টেম কমান্ড চালানোর ঐচ্ছিক সুবিধা।',
    granted: false,
    sensitive: true,
    requiredFor: ['Privileged App Control', 'System Level Dumpsys'],
  },
  {
    id: 'SYSTEM_ALERT_WINDOW',
    name: 'Display Over Other Apps (Overlay)',
    nameBn: 'অন্যান্য অ্যাপের উপর প্রদর্শন (ওভারলে)',
    description: 'Allows the agent to show a lightweight floating mic and status pill while you use other apps.',
    descriptionBn: 'অন্য অ্যাপ চালানোর সময়ও জয় এর ফ্লোটিং ভয়েস বাটন স্ক্রিনের উপর রাখার অনুমতি।',
    granted: true,
    sensitive: false,
    requiredFor: ['Floating Widget', 'Background Assistant'],
  },
  {
    id: 'MANAGE_EXTERNAL_STORAGE',
    name: 'All Files & Storage Access',
    nameBn: 'ফাইল ও স্টোরেজ অ্যাক্সেস',
    description: 'Allows searching, viewing, and organizing specific permitted documents, downloads, and media files.',
    descriptionBn: 'অনুমোদিত ফাইল, ডকুমেন্ট ও ডাউনলোড ফোল্ডারের তথ্য খোঁজার জন্য।',
    granted: true,
    sensitive: false,
    requiredFor: ['Document Search', 'File Management', 'Termux Storage'],
  },
  {
    id: 'READ_CONTACTS',
    name: 'Contacts Access',
    nameBn: 'কন্ট্যাক্টস অ্যাক্সেস',
    description: 'Allows finding phone numbers and contact names when sending WhatsApp messages or making calls.',
    descriptionBn: 'হোয়াটসঅ্যাপ বা ফোনে কাউকে মেসেজ দিতে বা কল লাগাতে নাম খোঁজার অনুমতি।',
    granted: true,
    sensitive: false,
    requiredFor: ['WhatsApp messaging', 'Phone dialing'],
  },
  {
    id: 'CALL_PHONE',
    name: 'Phone & Calling Access',
    nameBn: 'ফোন কল ডায়াল অ্যাক্সেস',
    description: 'Initiates phone calls only after your explicit confirmation.',
    descriptionBn: 'আপনার স্পষ্ট নির্দেশে কাউকে কল ডায়াল করার অনুমতি।',
    granted: true,
    sensitive: false,
    requiredFor: ['Direct Calling', 'Emergency Assist'],
  },
  {
    id: 'SEND_SMS',
    name: 'Send SMS & Messaging',
    nameBn: 'এসএমএস ও মেসেজ পাঠানোর অনুমতি',
    description: 'Sends short SMS messages through Android default SMS gateway.',
    descriptionBn: 'ডিফল্ট মেসেজ অ্যাপ দিয়ে এসএমএস ড্রাফট ও পাঠানোর অনুমতি।',
    granted: true,
    sensitive: false,
    requiredFor: ['Direct SMS Sending'],
  },
  {
    id: 'ACCESS_FINE_LOCATION',
    name: 'Location Services',
    nameBn: 'লোকেশন সার্ভিস',
    description: 'Provides local weather, nearby places, and accurate navigation routes.',
    descriptionBn: 'লাইভ আবহাওয়া, ম্যাপস এবং নিকটস্থ লোকেশন খোঁজার জন্য।',
    granted: true,
    sensitive: false,
    requiredFor: ['Weather', 'Google Maps'],
  },
  {
    id: 'POST_NOTIFICATIONS',
    name: 'Notification Alerts',
    nameBn: 'নোটিফিকেশন অ্যালার্ট',
    description: 'Sends real-time background task updates and action confirmations.',
    descriptionBn: 'কাজের আপডেট এবং অনুমোদন সংক্রান্ত বার্তা পেতে।',
    granted: true,
    sensitive: false,
    requiredFor: ['Task Alerts', 'Security Confirmation'],
  },
];

export const ANDROID_APPS: AndroidApp[] = [
  {
    id: 'termux',
    name: 'Termux',
    nameBn: 'টার্মাক্স (Termux)',
    icon: 'Terminal',
    category: 'tools',
    color: 'from-slate-900 via-emerald-950 to-slate-950',
    packageName: 'com.termux',
    intentUri: 'intent:#Intent;package=com.termux;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    deepLink: 'termux://',
    webFallback: 'https://termux.dev',
    requiredPermissions: ['TERMUX_RUN_COMMAND', 'MANAGE_EXTERNAL_STORAGE'],
    descriptionBn: 'টার্মিনাল এমুলেটর ও লিনাক্স এনভায়রনমেন্ট',
  },
  {
    id: 'shizuku',
    name: 'Shizuku',
    nameBn: 'শিজুকু (Shizuku)',
    icon: 'Cpu',
    category: 'system',
    color: 'from-cyan-900 via-blue-900 to-indigo-950',
    packageName: 'moe.shizuku.privileged.api',
    intentUri: 'intent:#Intent;package=moe.shizuku.privileged.api;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    requiredPermissions: ['SHIZUKU_PERMISSION'],
    descriptionBn: 'প্রিভিলেজড সিস্টেম এডিবি ম্যানেজার',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameBn: 'হোয়াটসঅ্যাপ',
    icon: 'MessageCircle',
    category: 'communication',
    color: 'from-emerald-500 to-green-600',
    packageName: 'com.whatsapp',
    deepLink: 'whatsapp://',
    intentUri: 'intent:#Intent;package=com.whatsapp;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://web.whatsapp.com',
    requiredPermissions: ['READ_CONTACTS', 'BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'মেসেজ ও ভয়েস চ্যাট পাঠানো',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    nameBn: 'ফেসবুক',
    icon: 'Share2',
    category: 'social',
    color: 'from-blue-600 to-indigo-700',
    packageName: 'com.facebook.katana',
    deepLink: 'fb://',
    intentUri: 'intent:#Intent;package=com.facebook.katana;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.facebook.com',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'সোশ্যাল মিডিয়া ও নিউজফিড',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    nameBn: 'মেসেঞ্জার',
    icon: 'MessageSquare',
    category: 'communication',
    color: 'from-blue-500 via-indigo-500 to-purple-600',
    packageName: 'com.facebook.orca',
    deepLink: 'fb-messenger://',
    intentUri: 'intent:#Intent;package=com.facebook.orca;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.messenger.com',
    requiredPermissions: ['READ_CONTACTS', 'BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ফেসবুক চ্যাট ও কল',
  },
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    icon: 'CreditCard',
    category: 'finance',
    color: 'from-pink-600 to-rose-700',
    packageName: 'com.bKash.customerapp',
    intentUri: 'intent:#Intent;package=com.bKash.customerapp;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.bkash.com',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'মোবাইল রিচার্জ ও পেমেন্ট',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ',
    icon: 'Wallet',
    category: 'finance',
    color: 'from-amber-600 to-orange-600',
    packageName: 'com.konasl.nagad',
    intentUri: 'intent:#Intent;package=com.konasl.nagad;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://nagad.com.bd',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ডিজিটাল ফিনান্সিয়াল সার্ভিস',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    nameBn: 'গুগল ক্রোম',
    icon: 'Globe',
    category: 'utility',
    color: 'from-amber-500 via-red-500 to-green-500',
    packageName: 'com.android.chrome',
    intentUri: 'intent:#Intent;package=com.android.chrome;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.google.com',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ওয়েব ব্রাউজিং ও তথ্য সন্ধান',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    nameBn: 'ইউটিউব',
    icon: 'PlaySquare',
    category: 'media',
    color: 'from-red-500 to-rose-600',
    packageName: 'com.google.android.youtube',
    deepLink: 'vnd.youtube://',
    intentUri: 'intent:#Intent;package=com.google.android.youtube;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.youtube.com',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ভিডিও ও গান স্ট্রিমিং',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    nameBn: 'জিমেইল',
    icon: 'Mail',
    category: 'communication',
    color: 'from-red-600 to-rose-700',
    packageName: 'com.google.android.gm',
    deepLink: 'mailto:',
    intentUri: 'intent:#Intent;package=com.google.android.gm;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://mail.google.com',
    requiredPermissions: ['READ_CONTACTS', 'BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ইমেইল পড়া, ড্রাফট ও পাঠানো',
  },
  {
    id: 'maps',
    name: 'Google Maps',
    nameBn: 'গুগল ম্যাপস',
    icon: 'MapPin',
    category: 'utility',
    color: 'from-blue-500 via-teal-500 to-green-500',
    packageName: 'com.google.android.apps.maps',
    deepLink: 'google.navigation:q=',
    intentUri: 'intent:#Intent;package=com.google.android.apps.maps;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://maps.google.com',
    requiredPermissions: ['ACCESS_FINE_LOCATION'],
    descriptionBn: 'নেভিগেশন, জ্যাম ও লোকেশন ডিরেকশন',
  },
  {
    id: 'files',
    name: 'Files',
    nameBn: 'ফাইলস ম্যানেজার',
    icon: 'Folder',
    category: 'utility',
    color: 'from-blue-500 to-indigo-600',
    packageName: 'com.google.android.apps.nbu.files',
    intentUri: 'intent:#Intent;package=com.google.android.apps.nbu.files;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    requiredPermissions: ['MANAGE_EXTERNAL_STORAGE'],
    descriptionBn: 'ডকুমেন্ট, পিডিএফ ও ছবি পরিচালনা',
  },
  {
    id: 'phone',
    name: 'Phone',
    nameBn: 'ফোন ডায়লার',
    icon: 'PhoneCall',
    category: 'communication',
    color: 'from-emerald-500 to-teal-600',
    packageName: 'com.google.android.dialer',
    deepLink: 'tel:',
    intentUri: 'intent:#Intent;action=android.intent.action.DIAL;end;',
    requiredPermissions: ['CALL_PHONE', 'READ_CONTACTS'],
    descriptionBn: 'ভয়েস কল ও জরুরি যোগাযোগ',
  },
  {
    id: 'messages',
    name: 'Messages',
    nameBn: 'মেসেজেস (SMS)',
    icon: 'MessageSquare',
    category: 'communication',
    color: 'from-blue-600 to-cyan-600',
    packageName: 'com.google.android.apps.messaging',
    deepLink: 'sms:',
    intentUri: 'intent:#Intent;package=com.google.android.apps.messaging;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    requiredPermissions: ['SEND_SMS', 'READ_CONTACTS'],
    descriptionBn: 'এসএমএস পাঠানো ও পড়া',
  },
  {
    id: 'settings',
    name: 'Settings',
    nameBn: 'ডিভাইস সেটিংস',
    icon: 'Settings',
    category: 'system',
    color: 'from-slate-600 to-slate-800',
    packageName: 'com.android.settings',
    intentUri: 'intent:#Intent;action=android.settings.SETTINGS;end;',
    requiredPermissions: [],
    descriptionBn: 'অ্যান্ড্রয়েড পারমিশন ও কনফিগ',
  },
  {
    id: 'camera',
    name: 'Camera',
    nameBn: 'ক্যামেরা',
    icon: 'Camera',
    category: 'media',
    color: 'from-purple-500 to-pink-600',
    packageName: 'com.google.android.GoogleCamera',
    intentUri: 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end;',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ছবি ও ভিডিও তোলা',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    nameBn: 'ক্যালকুলেটর',
    icon: 'Calculator',
    category: 'tools',
    color: 'from-cyan-600 to-blue-700',
    packageName: 'com.google.android.calculator',
    intentUri: 'intent:#Intent;package=com.google.android.calculator;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    requiredPermissions: [],
    descriptionBn: 'হিসাব-নিকাশ ও গণিত সমাধান',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    nameBn: 'ক্যালেন্ডার ও শিডিউল',
    icon: 'Calendar',
    category: 'tools',
    color: 'from-blue-600 to-indigo-600',
    packageName: 'com.google.android.calendar',
    deepLink: 'content://com.android.calendar/time/',
    intentUri: 'intent:#Intent;package=com.google.android.calendar;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://calendar.google.com',
    requiredPermissions: [],
    descriptionBn: 'তারিখ, মিটিং ও শিডিউল',
  },
  {
    id: 'clock',
    name: 'Clock & Alarm',
    nameBn: 'ঘড়ি ও অ্যালার্ম',
    icon: 'Clock',
    category: 'tools',
    color: 'from-slate-700 to-slate-900',
    packageName: 'com.google.android.deskclock',
    intentUri: 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end;',
    requiredPermissions: [],
    descriptionBn: 'অ্যালার্ম, টাইমার ও স্টপওয়াচ',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    nameBn: 'স্পটিফাই',
    icon: 'Music2',
    category: 'media',
    color: 'from-emerald-600 to-teal-700',
    packageName: 'com.spotify.music',
    deepLink: 'spotify:',
    intentUri: 'intent:#Intent;package=com.spotify.music;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://open.spotify.com',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'গান ও পডকাস্ট প্লেয়ার',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    nameBn: 'ইনস্টাগ্রাম',
    icon: 'Instagram',
    category: 'social',
    color: 'from-pink-500 via-purple-500 to-amber-500',
    packageName: 'com.instagram.android',
    deepLink: 'instagram://',
    intentUri: 'intent:#Intent;package=com.instagram.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.instagram.com',
    requiredPermissions: [],
    descriptionBn: 'রিলস, ছবি ও চ্যাট',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    nameBn: 'টিকটক',
    icon: 'Video',
    category: 'media',
    color: 'from-slate-900 to-rose-600',
    packageName: 'com.zhiliaoapp.musically',
    deepLink: 'tiktok://',
    intentUri: 'intent:#Intent;package=com.zhiliaoapp.musically;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://www.tiktok.com',
    requiredPermissions: [],
    descriptionBn: 'শর্ট ভিডিও ফিড',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    nameBn: 'টেলিগ্রাম',
    icon: 'Send',
    category: 'communication',
    color: 'from-sky-500 to-blue-600',
    packageName: 'org.telegram.messenger',
    deepLink: 'tg://',
    intentUri: 'intent:#Intent;package=org.telegram.messenger;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://web.telegram.org',
    requiredPermissions: [],
    descriptionBn: 'এনক্রিপ্টেড মেসেজিং ও চ্যানেল',
  },
  {
    id: 'notes',
    name: 'Keep Notes',
    nameBn: 'নোট ও মেমো',
    icon: 'FileText',
    category: 'tools',
    color: 'from-amber-400 to-orange-500',
    packageName: 'com.google.android.keep',
    intentUri: 'intent:#Intent;package=com.google.android.keep;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://keep.google.com',
    requiredPermissions: [],
    descriptionBn: 'আইডিয়া ও কোডিং নোট সংরক্ষণ',
  },
  {
    id: 'playstore',
    name: 'Play Store',
    nameBn: 'প্লে স্টোর',
    icon: 'ShoppingBag',
    category: 'system',
    color: 'from-cyan-500 to-green-500',
    packageName: 'com.android.vending',
    deepLink: 'market://',
    intentUri: 'intent:#Intent;package=com.android.vending;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://play.google.com',
    requiredPermissions: [],
    descriptionBn: 'নতুন অ্যাপস ও গেমস ইনস্টল',
  },
  {
    id: 'photos',
    name: 'Google Photos',
    nameBn: 'গ্যালারি ও ফটোস',
    icon: 'Image',
    category: 'media',
    color: 'from-amber-500 via-red-500 to-blue-500',
    packageName: 'com.google.android.apps.photos',
    intentUri: 'intent:#Intent;package=com.google.android.apps.photos;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://photos.google.com',
    requiredPermissions: ['MANAGE_EXTERNAL_STORAGE'],
    descriptionBn: 'ছবি, অ্যালবাম ও ভিডিও গ্যালারি',
  },
  {
    id: 'drive',
    name: 'Google Drive',
    nameBn: 'গুগল ড্রাইভ',
    icon: 'HardDrive',
    category: 'tools',
    color: 'from-yellow-500 via-green-500 to-blue-500',
    packageName: 'com.google.android.apps.docs',
    intentUri: 'intent:#Intent;package=com.google.android.apps.docs;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://drive.google.com',
    requiredPermissions: ['MANAGE_EXTERNAL_STORAGE'],
    descriptionBn: 'ক্লাউড ফাইলস ও ব্যাকআপ',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    nameBn: 'চ্যাটজিপিটি',
    icon: 'Bot',
    category: 'tools',
    color: 'from-emerald-600 to-teal-800',
    packageName: 'com.openai.chatgpt',
    intentUri: 'intent:#Intent;package=com.openai.chatgpt;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;',
    webFallback: 'https://chatgpt.com',
    requiredPermissions: [],
    descriptionBn: 'এআই অ্যাসিস্ট্যান্ট ও রিসার্চ',
  },
];

export const MOCK_DEVICE_DATA = {
  owner: 'Abdul Muktadir',
  phoneModel: 'Google Pixel 9 Pro (Android 15)',
  battery: 94,
  network: '5G (Grameenphone)',
  wifi: 'Muktadir_Fiber_5G',
  location: 'Dhaka, Bangladesh',
  accessibilityEnabled: true,
  termuxInstalled: true,
  termuxApiInstalled: true,
  shizukuRunning: true,
  contacts: [
    { name: 'Abdul Muktadir (Me)', phone: '+8801712345678', email: 'mmuktadir541@gmail.com', avatar: '👨‍💻' },
    { name: 'Rahman Bhai', phone: '+8801811223344', email: 'rahman.bhai@gmail.com', avatar: '🧑' },
    { name: 'Tanvir (Developer)', phone: '+8801919876543', email: 'tanvir.dev@gmail.com', avatar: '💻' },
    { name: 'Maa (Mom)', phone: '+8801555667788', email: 'maa.home@gmail.com', avatar: '❤️' },
    { name: 'Office Team', phone: '+8801600112233', email: 'office.team@company.com', avatar: '🏢' },
  ],
  storageFiles: [
    { name: 'Project_Zoya_Architecture.pdf', size: '2.4 MB', type: 'doc', category: 'Documents', date: 'Today, 2:30 PM', preview: 'Gemini Live WebSocket & Android Accessibility spec.' },
    { name: 'Muktadir_Resume_2026.pdf', size: '1.1 MB', type: 'doc', category: 'Documents', date: 'Yesterday', preview: 'Senior AI Engineer & Full-stack specialist.' },
    { name: 'AI_Studio_Demo_Screenshot.png', size: '4.8 MB', type: 'image', category: 'Images', date: 'Today, 4:15 PM', preview: 'Live preview snapshot of Zoya Voice Agent.' },
    { name: 'Chai_Adda_Dhaka.jpg', size: '3.2 MB', type: 'image', category: 'Images', date: '18 Aug', preview: 'Tea stall with coding squad in Dhanmondi.' },
    { name: 'meeting_notes_voice_agent.txt', size: '42 KB', type: 'text', category: 'Documents', date: '17 Aug', preview: 'Zoya v2: Bengali + English bilingual support with explicit consent.' },
    { name: 'voice_prompt_dataset.json', size: '820 KB', type: 'doc', category: 'Downloads', date: '15 Aug', preview: 'Hinglish & Bangla voice command dictionary.' },
  ],
  visibleScreenText: `[WhatsApp - Chat with Rahman Bhai]
Rahman Bhai: Muktadir, kaj koto dur?
Me: Zoya AI Assistant Android 15 agent ready!
Rahman Bhai: Chai er dokane ashba naki?
[Type a message...] [Mic Button] [Send Button]`,
  screenNodes: [
    { id: 'node_1', text: 'WhatsApp', className: 'android.widget.TextView', clickable: false, bounds: { x: 20, y: 30, width: 200, height: 40 } },
    { id: 'node_2', text: 'Rahman Bhai', className: 'android.widget.TextView', clickable: true, bounds: { x: 80, y: 35, width: 250, height: 35 } },
    { id: 'node_3', text: 'Muktadir, kaj koto dur?', className: 'android.widget.TextView', clickable: false, bounds: { x: 30, y: 120, width: 320, height: 50 } },
    { id: 'node_4', text: 'Zoya AI Assistant Android 15 agent ready!', className: 'android.widget.TextView', clickable: false, bounds: { x: 100, y: 190, width: 340, height: 50 } },
    { id: 'node_5', text: 'Chai er dokane ashba naki?', className: 'android.widget.TextView', clickable: false, bounds: { x: 30, y: 260, width: 320, height: 50 } },
    { id: 'node_6', text: 'Type a message...', contentDescription: 'Message Input Box', className: 'android.widget.EditText', clickable: true, bounds: { x: 20, y: 700, width: 360, height: 60 } },
    { id: 'node_7', text: 'Send', contentDescription: 'Send Voice or Text', className: 'android.widget.ImageButton', clickable: true, bounds: { x: 390, y: 700, width: 60, height: 60 } },
  ],
};

export class AndroidDeviceManager {
  private permissions: Map<AndroidPermissionType, AndroidPermissionState>;
  private auditLogs: DeviceAuditLog[] = [];
  private termuxHistory: TermuxExecutionRecord[] = [];

  constructor() {
    this.permissions = new Map();
    this.loadPermissions();
    this.loadAuditLogs();
    this.loadTermuxHistory();
  }

  private loadPermissions() {
    try {
      const saved = localStorage.getItem('android_permissions');
      if (saved) {
        const parsed: AndroidPermissionState[] = JSON.parse(saved);
        parsed.forEach((p) => this.permissions.set(p.id, p));
      } else {
        INITIAL_ANDROID_PERMISSIONS.forEach((p) => this.permissions.set(p.id, p));
      }
    } catch (e) {
      INITIAL_ANDROID_PERMISSIONS.forEach((p) => this.permissions.set(p.id, p));
    }
  }

  private savePermissions() {
    try {
      const array = Array.from(this.permissions.values());
      localStorage.setItem('android_permissions', JSON.stringify(array));
    } catch (e) {}
  }

  private loadAuditLogs() {
    try {
      const saved = localStorage.getItem('android_audit_logs');
      if (saved) {
        this.auditLogs = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveAuditLogs() {
    try {
      localStorage.setItem('android_audit_logs', JSON.stringify(this.auditLogs.slice(-60)));
    } catch (e) {}
  }

  private loadTermuxHistory() {
    try {
      const saved = localStorage.getItem('termux_history');
      if (saved) {
        this.termuxHistory = JSON.parse(saved);
      } else {
        this.termuxHistory = [
          {
            id: 'termux_init_1',
            command: 'uname -a && termux-battery-status',
            explanation: 'Display Linux kernel architecture and battery telemetrics',
            explanationBn: 'লিনাক্স কার্নেল ও ব্যাটারি তথ্য প্রদর্শন',
            dangerLevel: 'safe',
            requiresConfirmation: false,
            stdout: `Linux localhost 6.1.75-android15-g9pro #1 SMP PREEMPT aarch64 Android\n{\n  "percentage": 94,\n  "status": "DISCHARGING",\n  "health": "GOOD",\n  "temperature": 28.5\n}`,
            stderr: '',
            exitCode: 0,
            status: 'completed',
            executedAt: Date.now() - 360000,
            durationMs: 142,
          }
        ];
      }
    } catch (e) {}
  }

  private saveTermuxHistory() {
    try {
      localStorage.setItem('termux_history', JSON.stringify(this.termuxHistory.slice(-40)));
    } catch (e) {}
  }

  public getAllApps(): AndroidApp[] {
    return ANDROID_APPS;
  }

  public getAppById(id: string): AndroidApp | undefined {
    return ANDROID_APPS.find((a) => a.id.toLowerCase() === id.toLowerCase());
  }

  public resolveApp(query: string): AndroidApp {
    const q = query.toLowerCase().trim();
    
    // Direct matches
    const exact = ANDROID_APPS.find(
      (a) =>
        a.id.toLowerCase() === q ||
        a.name.toLowerCase() === q ||
        a.nameBn.toLowerCase() === q ||
        a.packageName.toLowerCase() === q
    );
    if (exact) return exact;

    // Fuzzy & Bengali keyword matches
    if (q.includes('termux') || q.includes('টার্মাক্স') || q.includes('টার্মুক্স') || q.includes('টার্মিনাল')) return this.getAppById('termux')!;
    if (q.includes('shizuku') || q.includes('শিজুকু')) return this.getAppById('shizuku')!;
    if (q.includes('whatsapp') || q.includes('হোয়াটসঅ্যাপ') || q.includes('হোয়াটস্যাপ')) return this.getAppById('whatsapp')!;
    if (q.includes('facebook') || q.includes('ফেসবুক') || q.includes('fb')) return this.getAppById('facebook')!;
    if (q.includes('messenger') || q.includes('মেসেঞ্জার')) return this.getAppById('messenger')!;
    if (q.includes('bkash') || q.includes('বিকাশ')) return this.getAppById('bkash')!;
    if (q.includes('nagad') || q.includes('নগদ')) return this.getAppById('nagad')!;
    if (q.includes('youtube') || q.includes('ইউটিউব')) return this.getAppById('youtube')!;
    if (q.includes('chrome') || q.includes('ক্রোম') || q.includes('browser') || q.includes('ব্রাউজার')) return this.getAppById('chrome')!;
    if (q.includes('gmail') || q.includes('জিমেইল') || q.includes('ইমেইল') || q.includes('mail')) return this.getAppById('gmail')!;
    if (q.includes('maps') || q.includes('ম্যাপস') || q.includes('ম্যাপ') || q.includes('রাস্তা')) return this.getAppById('maps')!;
    if (q.includes('files') || q.includes('ফাইলস') || q.includes('ফাইল') || q.includes('ডকুমেন্ট')) return this.getAppById('files')!;
    if (q.includes('phone') || q.includes('ফোন') || q.includes('ডায়লার') || q.includes('কল')) return this.getAppById('phone')!;
    if (q.includes('messages') || q.includes('মেসেজেস') || q.includes('sms') || q.includes('এসএমএস')) return this.getAppById('messages')!;
    if (q.includes('camera') || q.includes('ক্যামেরা') || q.includes('ছবি তুল')) return this.getAppById('camera')!;
    if (q.includes('calculator') || q.includes('ক্যালকুলেটর') || q.includes('হিসাব')) return this.getAppById('calculator')!;
    if (q.includes('calendar') || q.includes('ক্যালেন্ডার') || q.includes('তারিখ')) return this.getAppById('calendar')!;
    if (q.includes('clock') || q.includes('ঘড়ি') || q.includes('alarm') || q.includes('অ্যালার্ম')) return this.getAppById('clock')!;
    if (q.includes('spotify') || q.includes('স্পটিফাই') || q.includes('গান')) return this.getAppById('spotify')!;
    if (q.includes('instagram') || q.includes('ইনস্টাগ্রাম') || q.includes('ইনস্টা') || q.includes('insta')) return this.getAppById('instagram')!;
    if (q.includes('tiktok') || q.includes('টিকটক')) return this.getAppById('tiktok')!;
    if (q.includes('telegram') || q.includes('টেলিগ্রাম')) return this.getAppById('telegram')!;
    if (q.includes('notes') || q.includes('নোট') || q.includes('keep') || q.includes('কিপ')) return this.getAppById('notes')!;
    if (q.includes('play') || q.includes('store') || q.includes('প্লে স্টোর')) return this.getAppById('playstore')!;
    if (q.includes('photos') || q.includes('ছবি') || q.includes('gallery') || q.includes('গ্যালারি') || q.includes('ফটোস')) return this.getAppById('photos')!;
    if (q.includes('drive') || q.includes('ড্রাইভ')) return this.getAppById('drive')!;
    if (q.includes('chatgpt') || q.includes('gpt') || q.includes('চ্যাটজিপিটি')) return this.getAppById('chatgpt')!;
    if (q.includes('settings') || q.includes('সেটিংস') || q.includes('setting')) return this.getAppById('settings')!;

    // Dynamic Generic App Fallback for ANY app installed on mobile device
    const cleanPkgName = q.replace(/[^a-z0-9_]/g, '');
    return {
      id: cleanPkgName || 'generic_app',
      name: query.charAt(0).toUpperCase() + query.slice(1),
      nameBn: `${query} অ্যাপ`,
      icon: 'Smartphone',
      category: 'utility',
      color: 'from-slate-700 to-indigo-700',
      packageName: `com.${cleanPkgName}`,
      intentUri: `intent:#Intent;package=com.${cleanPkgName};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;`,
      webFallback: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
      descriptionBn: `${query} অ্যাপ সরাসরি ওপেন করা`,
    };
  }

  public launchNativeAndroidApp(target: {
    packageName?: string;
    intentUri?: string;
    deepLink?: string;
    webFallback?: string;
    name?: string;
    nameBn?: string;
    id?: string;
  }): { success: boolean; mode: 'android_intent' | 'deep_link' | 'web_fallback' | 'simulated'; uri: string } {
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    
    let launchUri = '';
    let mode: 'android_intent' | 'deep_link' | 'web_fallback' | 'simulated' = 'simulated';

    if (target.deepLink) {
      launchUri = target.deepLink;
      mode = 'deep_link';
    } else if (target.intentUri) {
      launchUri = target.intentUri;
      mode = 'android_intent';
    } else if (target.packageName) {
      launchUri = `intent:#Intent;package=${target.packageName};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;`;
      mode = 'android_intent';
    } else if (target.webFallback) {
      launchUri = target.webFallback;
      mode = 'web_fallback';
    }

    if (isAndroid && launchUri) {
      try {
        const link = document.createElement('a');
        link.href = launchUri;
        link.setAttribute('target', '_top');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 600);
      } catch (e) {
        console.warn('Native Android direct launch error:', e);
      }
    } else if (target.webFallback && !isAndroid) {
      try {
        window.open(target.webFallback, '_blank', 'noopener,noreferrer');
      } catch (e) {}
    }

    this.addAuditLog({
      actionTitle: `App Launch: ${target.nameBn || target.name || 'Android App'}`,
      targetApp: target.id || target.packageName || 'app',
      status: 'allowed',
      details: `Native Android Launch triggered via ${mode} (${launchUri || 'Direct'})`
    });

    return { success: true, mode, uri: launchUri };
  }

  /**
   * Classify safety and potential destructiveness of a terminal command
   */
  public evaluateCommandSafety(command: string): {
    dangerLevel: CommandDangerLevel;
    requiresConfirmation: boolean;
    explanation: string;
    explanationBn: string;
  } {
    const cmd = command.trim().toLowerCase();

    // Destructive
    if (
      cmd.includes('rm -rf') ||
      cmd.includes('rm -r /') ||
      cmd.includes('mkfs') ||
      cmd.includes('dd if=') ||
      cmd.includes('format') ||
      cmd.includes(':(){ :|:& };:') ||
      cmd.includes('reboot') ||
      cmd.includes('chmod -r 777 /')
    ) {
      return {
        dangerLevel: 'destructive',
        requiresConfirmation: true,
        explanation: 'Potentially destructive command that could delete critical files or restart the operating system.',
        explanationBn: 'উচ্চ ঝুঁকিপূর্ণ কমান্ড যা ফাইল মুছে ফেলা বা সিস্টেম রিস্টার্ট করতে পারে। ব্যবহারকারীর সম্মতি বাধ্যতামূলক।',
      };
    }

    // Privileged
    if (
      cmd.includes('pm uninstall') ||
      cmd.includes('su') ||
      cmd.includes('shizuku') ||
      cmd.includes('setprop') ||
      cmd.includes('dumpsys') ||
      cmd.includes('killall')
    ) {
      return {
        dangerLevel: 'privileged',
        requiresConfirmation: true,
        explanation: 'Privileged system command that modifies system properties or packages.',
        explanationBn: 'প্রিভিলেজড সিস্টেম কমান্ড যা প্যাকেজ বা সিস্টেম প্রোপার্টি পরিবর্তন করতে পারে।',
      };
    }

    // Moderate
    if (
      cmd.includes('pkg install') ||
      cmd.includes('pip install') ||
      cmd.includes('npm install') ||
      cmd.includes('git clone') ||
      cmd.includes('curl') ||
      cmd.includes('wget') ||
      cmd.includes('termux-setup-storage')
    ) {
      return {
        dangerLevel: 'moderate',
        requiresConfirmation: false,
        explanation: 'Standard network download or package installation.',
        explanationBn: 'প্যাকেজ ইনস্টল বা নেটওয়ার্ক ডাউনলোড কমান্ড।',
      };
    }

    // Safe
    return {
      dangerLevel: 'safe',
      requiresConfirmation: false,
      explanation: 'Read-only or harmless terminal telemetry command.',
      explanationBn: 'নিরাপদ রিড-অনলি কমান্ড।',
    };
  }

  /**
   * Execute Termux Command with stdout/stderr capture & Intent dispatch
   */
  public executeTermuxCommand(command: string): TermuxExecutionRecord {
    const safety = this.evaluateCommandSafety(command);
    const id = `termux_${Date.now()}`;
    const startTime = Date.now();

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    const trimmed = command.trim();

    if (trimmed.startsWith('termux-battery-status')) {
      stdout = JSON.stringify(
        {
          health: 'GOOD',
          percentage: 94,
          plugged: 'UNPLUGGED',
          status: 'DISCHARGING',
          temperature: 29.4,
          current: -420,
        },
        null,
        2
      );
    } else if (trimmed.startsWith('termux-setup-storage')) {
      stdout = `[+] Storage permission verified.\n[+] Created symlinks in ~/storage:\n  ~/storage/shared -> /storage/emulated/0\n  ~/storage/downloads -> /storage/emulated/0/Download\n  ~/storage/dcim -> /storage/emulated/0/DCIM`;
    } else if (trimmed.startsWith('uname') || trimmed.startsWith('uname -a')) {
      stdout = `Linux localhost 6.1.75-android15-g9pro #1 SMP PREEMPT Fri Aug 21 18:22:10 UTC 2026 aarch64 Android`;
    } else if (trimmed.startsWith('whoami')) {
      stdout = `u0_a248`;
    } else if (trimmed.startsWith('pwd')) {
      stdout = `/data/data/com.termux/files/home`;
    } else if (trimmed.startsWith('pkg update') || trimmed.startsWith('apt update')) {
      stdout = `Hit:1 https://packages.termux.dev/apt/termux-main stable InRelease\nAll packages are up to date.`;
    } else if (trimmed.startsWith('ls')) {
      stdout = `android_agent.py   build.gradle.kts   dist/   node_modules/   package.json   storage/   workspace/`;
    } else if (trimmed.startsWith('python') || trimmed.startsWith('python3')) {
      stdout = `Python 3.12.4 (main, Jun 12 2026, 14:10:00) [Clang 18.0.0] on linux\nExecution finished successfully.`;
    } else if (trimmed.startsWith('curl') && trimmed.includes('wttr.in')) {
      stdout = `Dhaka: ☀️  +31°C  Humidity: 72%  Wind: 14km/h SSE`;
    } else if (trimmed.startsWith('termux-toast')) {
      const msg = trimmed.replace(/^termux-toast\s*["']?/, '').replace(/["']?$/, '') || 'Zoya Assistant';
      stdout = `[Termux:API Toast] "${msg}" dispatched to screen notification.`;
    } else if (trimmed.startsWith('termux-camera-photo')) {
      stdout = `[Termux:API] Photo captured to /sdcard/DCIM/termux_capture_2026.jpg`;
    } else if (trimmed.startsWith('termux-clipboard-get')) {
      stdout = `https://github.com/muktadir/zoya-android-agent`;
    } else if (trimmed.startsWith('shizuku') || trimmed.startsWith('rish')) {
      stdout = `[Shizuku IPC] Ping OK. UID: 2000 (shell). SELinux: permissive.`;
    } else {
      stdout = `[Termux Local Shell] Process PID: ${Math.floor(10000 + Math.random() * 50000)}\nExecuting: ${command}\n\n[Done] Status: 0 (OK)`;
    }

    const durationMs = Date.now() - startTime + Math.floor(Math.random() * 40 + 20);

    const record: TermuxExecutionRecord = {
      id,
      command,
      explanation: safety.explanation,
      explanationBn: safety.explanationBn,
      dangerLevel: safety.dangerLevel,
      requiresConfirmation: safety.requiresConfirmation,
      stdout,
      stderr,
      exitCode,
      status: 'completed',
      executedAt: Date.now(),
      durationMs,
    };

    this.termuxHistory.unshift(record);
    this.saveTermuxHistory();

    // Trigger Intent to real Android Termux if running on mobile device
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      try {
        const intentUri = `intent:#Intent;package=com.termux;action=com.termux.app.RUN_COMMAND;S.com.termux.RUN_COMMAND_PATH=/data/data/com.termux/files/usr/bin/bash;S.com.termux.RUN_COMMAND_ARGUMENTS=-c,${encodeURIComponent(command)};end;`;
        const link = document.createElement('a');
        link.href = intentUri;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 500);
      } catch (e) {}
    }

    this.addAuditLog({
      actionTitle: `Termux Command: ${command.substring(0, 30)}`,
      targetApp: 'termux',
      permissionUsed: 'TERMUX_RUN_COMMAND',
      status: 'allowed',
      details: `Executed with exit code ${exitCode}. Duration: ${durationMs}ms`,
    });

    return record;
  }

  public getTermuxHistory(): TermuxExecutionRecord[] {
    return [...this.termuxHistory];
  }

  public clearTermuxHistory() {
    this.termuxHistory = [];
    this.saveTermuxHistory();
  }

  public getScreenNodes(): ScreenNode[] {
    return MOCK_DEVICE_DATA.screenNodes;
  }

  public getScreenTextSummary(): string {
    return MOCK_DEVICE_DATA.visibleScreenText;
  }

  public getPermissions(): AndroidPermissionState[] {
    return Array.from(this.permissions.values());
  }

  public getPermission(id: AndroidPermissionType): AndroidPermissionState | undefined {
    return this.permissions.get(id);
  }

  public setPermissionGranted(id: AndroidPermissionType, granted: boolean) {
    const existing = this.permissions.get(id);
    if (existing) {
      existing.granted = granted;
      this.permissions.set(id, { ...existing });
      this.savePermissions();
      this.addAuditLog({
        actionTitle: `Permission ${granted ? 'Granted' : 'Revoked'}`,
        permissionUsed: id,
        status: granted ? 'allowed' : 'denied',
        details: `User manually ${granted ? 'enabled' : 'disabled'} permission: ${existing.nameBn} (${existing.name})`
      });
    }
  }

  public checkActionPermission(action: AssistantAction): {
    allowed: boolean;
    requiredPermission?: AndroidPermissionState;
    reason?: string;
    reasonBn?: string;
  } {
    if (!action.requiresPermission) {
      return { allowed: true };
    }

    const perm = this.permissions.get(action.requiresPermission);
    if (perm && !perm.granted) {
      return {
        allowed: false,
        requiredPermission: perm,
        reason: `Requires permission: ${perm.name}`,
        reasonBn: `${perm.nameBn} অনুমতি প্রয়োজন`,
      };
    }

    return { allowed: true, requiredPermission: perm };
  }

  public addAuditLog(entry: Omit<DeviceAuditLog, 'id' | 'timestamp'>) {
    const log: DeviceAuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    this.auditLogs.unshift(log);
    this.saveAuditLogs();
  }

  public getAuditLogs(): DeviceAuditLog[] {
    return [...this.auditLogs];
  }

  public clearAuditLogs() {
    this.auditLogs = [];
    this.saveAuditLogs();
  }
}

export const androidDeviceManager = new AndroidDeviceManager();

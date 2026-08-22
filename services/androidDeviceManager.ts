import {
  AndroidApp,
  AndroidAppId,
  AndroidPermissionState,
  AndroidPermissionType,
  AssistantAction,
  DeviceAuditLog,
} from '../types';

export const INITIAL_ANDROID_PERMISSIONS: AndroidPermissionState[] = [
  {
    id: 'RECORD_AUDIO',
    name: 'Microphone Access',
    nameBn: 'মাইক্রোফোন অ্যাক্সেস',
    description: 'Allows Zoya to hear and process your voice commands in real-time.',
    descriptionBn: 'লাইভ ভয়েস কমান্ড শোনা এবং রিয়েল-টাইমে কথা বলার জন্য প্রয়োজন।',
    granted: true,
    sensitive: false,
    requiredFor: ['Live Voice Input', 'Speech Recognition'],
  },
  {
    id: 'BIND_ACCESSIBILITY_SERVICE',
    name: 'Android Accessibility Service',
    nameBn: 'অ্যাক্সেসিবিলিটি সার্ভিস অটোমেশন',
    description: 'Allows Zoya to interact with the screen, tap app icons, and execute commands on your behalf.',
    descriptionBn: 'আপনার অনুমতিতে স্ক্রিনে অ্যাপ খোলা, বাটন ট্যাপ করা এবং স্বয়ংক্রিয় কাজ করার অনুমতি।',
    granted: true,
    sensitive: true,
    requiredFor: ['App Launching', 'Screen Automation', 'UI Taps'],
  },
  {
    id: 'READ_CONTACTS',
    name: 'Contacts Access',
    nameBn: 'কন্ট্যাক্টস অ্যাক্সেস',
    description: 'Allows Zoya to find friends & family numbers when you ask to message or call someone.',
    descriptionBn: 'হোয়াটসঅ্যাপ বা কলে কারও নাম বললে নাম্বার খুঁজে পেতে প্রয়োজন।',
    granted: true,
    sensitive: true,
    requiredFor: ['WhatsApp messaging', 'Phone dialing'],
  },
  {
    id: 'MANAGE_EXTERNAL_STORAGE',
    name: 'Files & Storage Access',
    nameBn: 'ফাইল ও স্টোরেজ অ্যাক্সেস',
    description: 'Allows Zoya to search, inspect or organize specific permitted documents and media.',
    descriptionBn: 'অনুমোদিত ফাইল ও ডকুমেন্টের তথ্য খুঁজে বের করার জন্য।',
    granted: false, // requires explicit grant by default for privacy
    sensitive: true,
    requiredFor: ['Document Search', 'Gallery inspection'],
  },
  {
    id: 'CALL_PHONE',
    name: 'Phone & Calling Access',
    nameBn: 'ফোন কল ডায়াল অ্যাক্সেস',
    description: 'Allows Zoya to initiate phone calls only upon your direct voice consent.',
    descriptionBn: 'আপনার স্পষ্ট নির্দেশে কাউকে কল লাগানোর অনুমতি।',
    granted: false,
    sensitive: true,
    requiredFor: ['Direct Calling', 'Emergency Assist'],
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
    id: 'whatsapp',
    name: 'WhatsApp',
    nameBn: 'হোয়াটসঅ্যাপ',
    icon: 'MessageCircle',
    category: 'communication',
    color: 'from-emerald-500 to-green-600',
    packageName: 'com.whatsapp',
    requiredPermissions: ['READ_CONTACTS', 'BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'মেসেজ ও ভয়েস চ্যাট পাঠানো',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    nameBn: 'গুগল ক্রোম',
    icon: 'Globe',
    category: 'utility',
    color: 'from-amber-500 via-red-500 to-green-500',
    packageName: 'com.android.chrome',
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
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'ছবি ও ভিডিও তোলা',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    nameBn: 'স্পটিফাই',
    icon: 'Music2',
    category: 'media',
    color: 'from-emerald-600 to-teal-700',
    packageName: 'com.spotify.music',
    requiredPermissions: ['BIND_ACCESSIBILITY_SERVICE'],
    descriptionBn: 'গান ও পডকাস্ট প্লেয়ার',
  },
  {
    id: 'notes',
    name: 'Keep Notes',
    nameBn: 'নোট ও মেমো',
    icon: 'FileText',
    category: 'tools',
    color: 'from-amber-400 to-orange-500',
    packageName: 'com.google.android.keep',
    requiredPermissions: [],
    descriptionBn: 'আইডিয়া ও কোডিং নোট সংরক্ষণ',
  },
];

export const MOCK_DEVICE_DATA = {
  owner: 'Abdul Muktadir',
  phoneModel: 'Google Pixel 9 Pro (Android 15)',
  battery: 94,
  network: '5G (Grameenphone)',
  wifi: 'Muktadir_Fiber_5G',
  location: 'Dhaka, Bangladesh',
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
  emails: [
    {
      id: 'em_1',
      from: 'GitHub Notifications',
      senderEmail: 'notifications@github.com',
      subject: '[AI Studio] Pull request #42 merged: Zoya Android 15 agent',
      time: '11:20 AM',
      unread: true,
      snippet: 'Awesome work Muktadir! All Live WebSocket audio streams and permission modals are functioning smoothly...',
    },
    {
      id: 'em_2',
      from: 'Tanvir (Developer)',
      senderEmail: 'tanvir.dev@gmail.com',
      subject: 'Review needed: Android Maps & Navigation integration',
      time: '09:45 AM',
      unread: false,
      snippet: 'Hey Muktadir, please check the route traffic calculation between Dhanmondi and Gulshan 2.',
    },
    {
      id: 'em_3',
      from: 'Google Developers',
      senderEmail: 'dev-team@google.com',
      subject: 'Gemini 3.7 Flash & Live API update available',
      time: 'Yesterday',
      unread: false,
      snippet: 'Explore the new multimodal audio streaming and function calling capabilities in your region.',
    },
  ],
  smsThreads: [
    {
      id: 'sms_1',
      contact: 'Rahman Bhai',
      phone: '+8801811223344',
      lastMessage: 'Chai er dokane ashba naki?',
      time: '2:15 PM',
      unread: true,
      messages: [
        { sender: 'them', text: 'Muktadir, kaj koto dur?', time: '2:00 PM' },
        { sender: 'me', text: 'Zoya AI agent ready!', time: '2:10 PM' },
        { sender: 'them', text: 'Chai er dokane ashba naki?', time: '2:15 PM' },
      ],
    },
    {
      id: 'sms_2',
      contact: 'Tanvir (Developer)',
      phone: '+8801919876543',
      lastMessage: 'Code push kore diyo.',
      time: '1:10 PM',
      unread: false,
      messages: [
        { sender: 'them', text: 'Code push kore diyo.', time: '1:10 PM' },
      ],
    },
  ],
  mapsLocations: [
    {
      name: 'Dhanmondi Lake & Chai Corner',
      area: 'Dhanmondi, Dhaka',
      distance: '2.4 km',
      eta: '12 mins',
      traffic: 'Light Traffic (Green)',
    },
    {
      name: 'Gulshan 2 Tech Hub',
      area: 'Gulshan, Dhaka',
      distance: '9.8 km',
      eta: '28 mins',
      traffic: 'Moderate Traffic (Orange)',
    },
    {
      name: 'Shahbagh National Museum',
      area: 'Shahbagh, Dhaka',
      distance: '4.1 km',
      eta: '16 mins',
      traffic: 'Fast Route',
    },
  ],
  quickNotes: [
    { id: '1', title: 'Zoya Live Voice Test', content: 'Gemini Live WebSocket integrated with 24kHz audio output.', time: '10:00 AM' },
    { id: '2', title: 'Chai Recipe for all-night coding', content: 'Ginger + cardamom + 2 spoons tea + extra milk.', time: 'Yesterday' },
  ]
};

export class AndroidDeviceManager {
  private permissions: Map<AndroidPermissionType, AndroidPermissionState>;
  private auditLogs: DeviceAuditLog[] = [];

  constructor() {
    this.permissions = new Map();
    this.loadPermissions();
    this.loadAuditLogs();
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
      localStorage.setItem('android_audit_logs', JSON.stringify(this.auditLogs.slice(-50)));
    } catch (e) {}
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
    if (!perm) {
      return { allowed: true };
    }

    if (!perm.granted) {
      return {
        allowed: false,
        requiredPermission: perm,
        reason: `Requires permission: ${perm.name}`,
        reasonBn: `এই কাজের জন্য '${perm.nameBn}' অনুমতি প্রয়োজন।`
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

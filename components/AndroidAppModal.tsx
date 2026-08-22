import React, { useState } from 'react';
import {
  X,
  Send,
  Phone,
  PhoneOff,
  Video,
  Play,
  Pause,
  Folder,
  FileText,
  Image,
  Camera,
  Shield,
  Check,
  ChevronRight,
  Search,
  ExternalLink,
  Volume2,
  Lock,
  Unlock,
  Sparkles,
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Navigation,
  Compass,
  ArrowUpRight,
  Layers,
  Clock,
  User,
  Paperclip,
  Trash2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { AndroidAppId, AssistantAction, AndroidPermissionState } from '../types';
import { ANDROID_APPS, MOCK_DEVICE_DATA, androidDeviceManager } from '../services/androidDeviceManager';

interface AndroidAppModalProps {
  appId: AndroidAppId | null;
  actionPayload?: AssistantAction['payload'];
  isOpen: boolean;
  onClose: () => void;
  onGrantPermission?: (permId: any) => void;
  onReadAloud?: (text: string) => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  appId,
  actionPayload,
  isOpen,
  onClose,
  onGrantPermission,
  onReadAloud,
}) => {
  if (!isOpen || !appId) return null;

  const currentApp = ANDROID_APPS.find((a) => a.id === appId);

  // 1. WhatsApp State
  const [selectedContact, setSelectedContact] = useState<string>(
    actionPayload?.contactName || 'Rahman Bhai'
  );
  const [chatMessage, setChatMessage] = useState<string>(
    actionPayload?.message || 'Hey! Meeting at 5 PM today?'
  );
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'them', text: 'Ki obostha Muktadir? AI assistant koto dur?', time: '10:15 AM' },
    { sender: 'me', text: 'Gemini Live voice engine integrate korechi!', time: '10:18 AM' },
  ]);

  // 2. Chrome State
  const [chromeUrl, setChromeUrl] = useState<string>(
    actionPayload?.query
      ? `https://www.google.com/search?q=${encodeURIComponent(actionPayload.query)}`
      : 'https://www.google.com'
  );
  const [chromeSearchQuery, setChromeSearchQuery] = useState<string>(
    actionPayload?.query || 'Artificial Intelligence trends in Bangladesh'
  );

  // 3. YouTube State
  const [isPlayingYouTube, setIsPlayingYouTube] = useState<boolean>(true);
  const [ytSearchQuery, setYtSearchQuery] = useState<string>(
    actionPayload?.query || 'Bangla Lofi Chill Beats to Code'
  );

  // 4. Gmail State
  const [isComposingEmail, setIsComposingEmail] = useState<boolean>(
    !!actionPayload?.recipientEmail || !!actionPayload?.subject
  );
  const [emailTo, setEmailTo] = useState<string>(
    actionPayload?.recipientEmail || actionPayload?.contactName || 'tanvir.dev@gmail.com'
  );
  const [emailSubject, setEmailSubject] = useState<string>(
    actionPayload?.subject || 'Zoya Android Assistant Updates'
  );
  const [emailBody, setEmailBody] = useState<string>(
    actionPayload?.message || 'Hey Tanvir, Zoya AI is now fully configured with Bengali + English support!'
  );
  const [emailList, setEmailList] = useState(MOCK_DEVICE_DATA.emails);
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);

  // 5. Maps State
  const [mapDestination, setMapDestination] = useState<string>(
    actionPayload?.destination || actionPayload?.query || 'Dhanmondi Lake & Chai Corner'
  );
  const [isNavigating, setIsNavigating] = useState<boolean>(true);

  // 6. Files State
  const [fileFilter, setFileFilter] = useState<'All' | 'Documents' | 'Images' | 'Downloads'>('All');
  const [fileSearchQuery, setFileSearchQuery] = useState<string>(actionPayload?.query || '');
  const [selectedFilePreview, setSelectedFilePreview] = useState<any>(null);

  // 7. Phone State
  const [isCalling, setIsCalling] = useState<boolean>(true);
  const [dialerNumber, setDialerNumber] = useState<string>(actionPayload?.phone || '+8801712345678');

  // 8. Messages (SMS) State
  const [smsRecipient, setSmsRecipient] = useState<string>(
    actionPayload?.contactName || 'Rahman Bhai'
  );
  const [smsText, setSmsText] = useState<string>(
    actionPayload?.message || 'Ami 5 minute e ashtesi!'
  );
  const [smsThread, setSmsThread] = useState(MOCK_DEVICE_DATA.smsThreads[0].messages);

  // Permissions state in settings
  const [permissions, setPermissions] = useState<AndroidPermissionState[]>(() =>
    androidDeviceManager.getPermissions()
  );

  const handleTogglePermission = (perm: AndroidPermissionState) => {
    const next = !perm.granted;
    androidDeviceManager.setPermissionGranted(perm.id, next);
    setPermissions(androidDeviceManager.getPermissions());
    if (onGrantPermission) onGrantPermission(perm.id);
  };

  const handleSendWhatsApp = () => {
    if (!chatMessage.trim()) return;
    setChatHistory((prev) => [
      ...prev,
      { sender: 'me', text: chatMessage, time: 'Just now' },
    ]);
    androidDeviceManager.addAuditLog({
      actionTitle: 'WhatsApp Message Sent',
      targetApp: 'whatsapp',
      permissionUsed: 'READ_CONTACTS',
      status: 'allowed',
      details: `Sent message to ${selectedContact}: "${chatMessage}"`,
    });
    setChatMessage('');
  };

  const handleSendGmail = () => {
    if (!emailTo.trim() || !emailSubject.trim()) return;
    setEmailSentSuccess(true);
    androidDeviceManager.addAuditLog({
      actionTitle: 'Gmail Email Sent',
      targetApp: 'gmail',
      permissionUsed: 'READ_CONTACTS',
      status: 'allowed',
      details: `Sent email to ${emailTo} with subject "${emailSubject}"`,
    });
    setTimeout(() => {
      setIsComposingEmail(false);
      setEmailSentSuccess(false);
    }, 1200);
  };

  const handleSendSms = () => {
    if (!smsText.trim()) return;
    setSmsThread((prev) => [...prev, { sender: 'me', text: smsText, time: 'Just now' }]);
    androidDeviceManager.addAuditLog({
      actionTitle: 'SMS Sent via Messages',
      targetApp: 'messages',
      permissionUsed: 'SEND_SMS',
      status: 'allowed',
      details: `Sent SMS to ${smsRecipient}: "${smsText}"`,
    });
    setSmsText('');
  };

  const filteredFiles = MOCK_DEVICE_DATA.storageFiles.filter((f) => {
    const matchesFilter = fileFilter === 'All' || f.category === fileFilter;
    const matchesQuery = !fileSearchQuery || f.name.toLowerCase().includes(fileSearchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div
      id="android-app-window"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
    >
      <div className="w-full max-w-lg h-[86vh] max-h-[760px] bg-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* App Title Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${currentApp?.color} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
              {currentApp?.name.substring(0, 1)}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentApp?.nameBn}</span>
                <span className="text-[10px] text-slate-400 font-normal">({currentApp?.name})</span>
              </h3>
              <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Sandbox • Android 15</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReadAloud && (
              <button
                type="button"
                onClick={() => {
                  const summary = `এখন ${currentApp?.nameBn} খোলা আছে। আপনি এখান থেকে যেকোনো কাজ জয়াকে দিয়ে করিয়ে নিতে পারেন।`;
                  onReadAloud(summary);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="পড়ে শোনাও (Read Aloud)"
              >
                <Volume2 className="w-4 h-4 text-pink-400" />
              </button>
            )}
            <button
              id="btn-close-app-window"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* App Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4">
          {/* ======================================================== */}
          {/* 1. WHATSAPP APP */}
          {/* ======================================================== */}
          {appId === 'whatsapp' && (
            <div className="flex flex-col h-full gap-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedContact[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{selectedContact}</div>
                    <div className="text-[10px] text-emerald-400">Online • End-to-end encrypted</div>
                  </div>
                </div>
                <div className="flex gap-2 text-slate-400">
                  <Phone className="w-4 h-4 hover:text-white cursor-pointer" />
                  <Video className="w-4 h-4 hover:text-white cursor-pointer" />
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2 bg-slate-900/40 rounded-2xl border border-slate-900">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[80%] p-2.5 rounded-2xl text-xs ${
                      msg.sender === 'me'
                        ? 'ml-auto bg-emerald-700 text-white rounded-br-none'
                        : 'mr-auto bg-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className="text-[9px] text-slate-300 self-end mt-1">{msg.time}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="মেসেজ লিখুন..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. CHROME BROWSER APP */}
          {/* ======================================================== */}
          {appId === 'chrome' && (
            <div className="flex flex-col h-full gap-3">
              {/* Address bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                <Globe className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={chromeSearchQuery}
                  onChange={(e) => setChromeSearchQuery(e.target.value)}
                  placeholder="গুগলে খুঁজুন বা URL লিখুন..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://www.google.com/search?q=${encodeURIComponent(chromeSearchQuery)}`;
                    window.open(url, '_blank');
                  }}
                  className="p-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[10px] font-semibold flex items-center gap-1"
                >
                  <span>খুলুন</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Web View Card */}
              <div className="flex-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white">Google Search Results</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <h4 className="text-xs font-bold text-cyan-400">"{chromeSearchQuery}"</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      জয়া গুগল সার্চ এবং ক্রোম ব্রাউজারের মাধ্যমে রিয়েল-টাইম তথ্য খুঁজে পেতে প্রস্তুত।
                      আপনি যেকোনো তথ্য জানতে চাইলে জয়া সরাসরি পড়ে শোনাবে।
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Search Engine: Google AI Powered</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onReadAloud) {
                        onReadAloud(`গুগলে ${chromeSearchQuery} সম্পর্কে ফলাফল পাওয়া গেছে।`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>পড়ে শোনাও</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. YOUTUBE APP */}
          {/* ======================================================== */}
          {appId === 'youtube' && (
            <div className="flex flex-col gap-3">
              <div className="w-full aspect-video rounded-2xl bg-black border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => {
                    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(ytSearchQuery)}`;
                    window.open(ytUrl, '_blank');
                  }}
                  className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/40 group-hover:scale-110 transition-transform z-10"
                >
                  <Play className="w-6 h-6 fill-white ml-1" />
                </button>
                <div className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white z-10 truncate">
                  {ytSearchQuery}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">YouTube Integration</span>
                  <span className="text-[10px] text-red-400 font-mono">Live Video Sandbox</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  জয়া আপনার অনুমতিতে ইউটিউবে গান ও ভিডিও সার্চ এবং প্লে করতে পারে।
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. GMAIL APP */}
          {/* ======================================================== */}
          {appId === 'gmail' && (
            <div className="flex flex-col h-full gap-3">
              {isComposingEmail ? (
                /* Compose Email View */
                <div className="flex flex-col h-full gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white">নতুন ইমেইল ড্রাফট (Compose Email)</span>
                    <button
                      type="button"
                      onClick={() => setIsComposingEmail(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      বাতিল
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 w-12">প্রাপক:</span>
                      <input
                        type="text"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 w-12">বিষয়:</span>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="ইমেইলের বিষয়..."
                        className="flex-1 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="ইমেইলের মূল বক্তব্য..."
                    className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-white focus:outline-none resize-none"
                  />

                  {emailSentSuccess ? (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs text-center font-bold">
                      ✓ ইমেইল সফলভাবে পাঠানো হয়েছে!
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendGmail}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>অনুমতি নিয়ে ইমেইল পাঠান (Send with Consent)</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Inbox View */
                <div className="flex flex-col h-full gap-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">ইনবক্স ({MOCK_DEVICE_DATA.owner})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsComposingEmail(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                    >
                      <span>+ ড্রাফট তৈরি</span>
                    </button>
                  </div>

                  <div className="space-y-2 overflow-y-auto flex-1">
                    {emailList.map((em) => (
                      <div
                        key={em.id}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          em.unread
                            ? 'bg-slate-900/90 border-red-500/40 shadow-sm'
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${em.unread ? 'font-bold text-white' : 'text-slate-300'}`}>
                            {em.from}
                          </span>
                          <span className="text-[10px] text-slate-400">{em.time}</span>
                        </div>
                        <div className="text-xs font-semibold text-cyan-300 mt-1 truncate">{em.subject}</div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{em.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. GOOGLE MAPS APP */}
          {/* ======================================================== */}
          {appId === 'maps' && (
            <div className="flex flex-col h-full gap-3">
              {/* Destination Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                <MapPin className="w-4 h-4 text-rose-500" />
                <input
                  type="text"
                  value={mapDestination}
                  onChange={(e) => setMapDestination(e.target.value)}
                  placeholder="গন্তব্য খুঁজুন (যেমন: ধানমন্ডি, গুলশান, বিমানবন্দর)..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapDestination)}`;
                    window.open(mapUrl, '_blank');
                  }}
                  className="p-1.5 rounded-lg bg-rose-600/30 text-rose-300 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>নেভিগেট</span>
                </button>
              </div>

              {/* Interactive Route Simulation Box */}
              <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <span>লাইভ রুট ও ট্রাফিক তথ্য</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                      Fastest Route
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">শুরু (Origin):</span>
                      <span className="font-semibold text-white">ঢাকা, বাংলাদেশ (Current GPS)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">গন্তব্য (Destination):</span>
                      <span className="font-semibold text-rose-400">{mapDestination}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-850">
                      <span className="text-slate-400">আনুমানিক সময় (ETA):</span>
                      <span className="font-bold text-emerald-400 font-mono">~ ১৮ মিনিট (৪.২ কি.মি.)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Traffic: Moderate on Mirpur Rd</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onReadAloud) {
                        onReadAloud(`${mapDestination} যাওয়ার সবচেয়ে দ্রুত রাস্তা পাওয়া গেছে। আনুমানিক সময় ১৮ মিনিট।`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>রাস্তা পড়ে শোনাও</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. FILES & STORAGE APP */}
          {/* ======================================================== */}
          {appId === 'files' && (
            <div className="flex flex-col h-full gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(['All', 'Documents', 'Images', 'Downloads'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFileFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      fileFilter === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                <Search className="w-4 h-4 text-blue-400" />
                <input
                  type="text"
                  value={fileSearchQuery}
                  onChange={(e) => setFileSearchQuery(e.target.value)}
                  placeholder="ফাইল বা ডকুমেন্ট নাম দিয়ে খুঁজুন..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Files List */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {filteredFiles.map((file, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFilePreview(file)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400">
                        {file.type === 'doc' ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{file.name}</div>
                        <div className="text-[10px] text-slate-400">{file.size} • {file.date}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                ))}
              </div>

              {/* File Inspector Preview Modal */}
              {selectedFilePreview && (
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">{selectedFilePreview.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFilePreview(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      বন্ধ
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 italic">{selectedFilePreview.preview}</p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. PHONE APP */}
          {/* ======================================================== */}
          {appId === 'phone' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-24 h-24 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-300 text-3xl font-bold animate-pulse shadow-xl shadow-emerald-500/20">
                {actionPayload?.contactName?.[0] || 'M'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {actionPayload?.contactName || 'Abdul Muktadir'}
                </h3>
                <p className="text-xs text-emerald-400 mt-1">
                  {isCalling ? '📞 Calling via Android Dialer (00:14)' : 'Call Ended'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{dialerNumber}</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCalling(!isCalling)}
                  className={`p-4 rounded-full shadow-lg transition-all ${
                    isCalling
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isCalling ? <PhoneOff className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. MESSAGES (SMS) APP */}
          {/* ======================================================== */}
          {appId === 'messages' && (
            <div className="flex flex-col h-full gap-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {smsRecipient[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{smsRecipient}</div>
                    <div className="text-[10px] text-blue-400">SMS / MMS Carrier Active</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-2 bg-slate-900/40 rounded-2xl border border-slate-900">
                {smsThread.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[80%] p-2.5 rounded-2xl text-xs ${
                      msg.sender === 'me'
                        ? 'ml-auto bg-blue-600 text-white rounded-br-none'
                        : 'mr-auto bg-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className="text-[9px] text-slate-300 self-end mt-1">{msg.time}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800">
                <input
                  type="text"
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="এসএমএস লিখুন..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none px-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendSms()}
                />
                <button
                  type="button"
                  onClick={handleSendSms}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 9. SETTINGS APP */}
          {/* ======================================================== */}
          {appId === 'settings' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">অ্যান্ড্রয়েড অনুমতি ও প্রাইভেসি সেন্টার</h4>
                    <p className="text-[10px] text-slate-400">Manage AI Agent access to device capabilities</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ডিভাইস পারমিশন তালিকা:
                </div>
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      perm.granted
                        ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                        : 'bg-slate-900/40 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{perm.nameBn}</span>
                        <span className="text-[10px] text-slate-400">({perm.name})</span>
                        {perm.sensitive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                            Sensitive
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{perm.descriptionBn}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePermission(perm)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        perm.granted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                      }`}
                    >
                      {perm.granted ? 'অনুমোদিত (Granted)' : 'বন্ধ (Denied)'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 10. OTHER APPS (CAMERA / SPOTIFY) */}
          {/* ======================================================== */}
          {appId === 'camera' && (
            <div className="flex flex-col items-center justify-between h-full bg-black rounded-2xl p-4 border border-slate-800">
              <div className="w-full flex justify-between text-xs text-slate-400">
                <span>0.5x • 1x • 2x</span>
                <span>HDR On</span>
              </div>
              <div className="w-full flex-1 flex items-center justify-center text-slate-600">
                <Camera className="w-16 h-16 stroke-1 animate-pulse" />
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform">
                <div className="w-12 h-12 rounded-full bg-white" />
              </div>
            </div>
          )}

          {appId === 'spotify' && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-4">
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-800 p-4 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Sparkles className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{actionPayload?.query || 'Top Bangla Hits'}</h3>
                <p className="text-xs text-emerald-400 mt-0.5">Spotify Playing on Android 15</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


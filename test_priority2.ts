import { ActionGateway } from './services/actionGateway';
import { OfflineCommandEngine } from './services/offlineCommandEngine';
import { androidDeviceManager } from './services/androidDeviceManager';
import { ActionParser } from './services/actionParser';

async function runPriority2Tests() {
  console.log('================================================================');
  console.log('ZOYA AI — PRIORITY 2: ACTION GATEWAY & OFFLINE ENGINE TEST SUITE');
  console.log('================================================================\n');

  const gateway = new ActionGateway();
  let passCount = 0;
  let failCount = 0;

  // Grant required permissions for pipeline testing
  androidDeviceManager.setPermissionGranted('TERMUX_RUN_COMMAND', true);
  androidDeviceManager.setPermissionGranted('MANAGE_EXTERNAL_STORAGE', true);
  androidDeviceManager.setPermissionGranted('BIND_ACCESSIBILITY_SERVICE', true);

  function assertTest(testNum: number, name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${name}`);
      console.log(`       Details: ${details}\n`);
      passCount++;
    } else {
      console.error(`[FAIL] Test ${testNum}: ${name}`);
      console.error(`       Details: ${details}\n`);
      failCount++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Online Command Handling
  // -------------------------------------------------------------
  const res1 = await gateway.processRequest('কেমন আছো জয়া', { isOffline: false });
  assertTest(
    1,
    'Online Command Handling',
    res1.success && res1.status === 'executed',
    `Response: "${res1.spokenReply.substring(0, 60)}..."`
  );

  // -------------------------------------------------------------
  // Test 2: Offline Command Handling Fallback
  // -------------------------------------------------------------
  const res2 = await gateway.processRequest('Open WhatsApp', { isOffline: true });
  assertTest(
    2,
    'Offline Command Handling Fallback',
    res2.success && res2.action?.targetApp === 'whatsapp',
    `Action: ${res2.action?.title} (${res2.action?.targetApp}) via Offline Engine`
  );

  // -------------------------------------------------------------
  // Test 3: "Open WhatsApp" Execution & Intent Generation
  // -------------------------------------------------------------
  const res3 = await gateway.processRequest('Open WhatsApp');
  assertTest(
    3,
    '"Open WhatsApp" Execution',
    res3.success && (res3.action?.packageName === 'com.whatsapp' || res3.action?.targetApp === 'whatsapp'),
    `Package: ${res3.action?.packageName}, Intent: ${res3.action?.intentUri || 'Native Intent Scheme'}`
  );

  // -------------------------------------------------------------
  // Test 4: "Turn on Flashlight" Device Control
  // -------------------------------------------------------------
  const res4 = await gateway.processRequest('Turn on Flashlight');
  assertTest(
    4,
    '"Turn on Flashlight" Device Control',
    res4.success &&
      res4.action?.type === 'device_control' &&
      res4.action?.payload?.settingKey === 'flashlight' &&
      res4.action?.payload?.settingValue === true,
    `Action: ${res4.action?.title}, Flashlight State: ${res4.action?.payload?.settingValue}`
  );

  // -------------------------------------------------------------
  // Test 5: "Open Battery Settings"
  // -------------------------------------------------------------
  const res5 = await gateway.processRequest('Open Battery Settings');
  assertTest(
    5,
    '"Open Battery Settings"',
    res5.success &&
      res5.action?.type === 'device_setting' &&
      (res5.action?.intentUri?.includes('BATTERY') || res5.action?.payload?.settingKey === 'battery_settings'),
    `Action: ${res5.action?.title}, Intent URI: ${res5.action?.intentUri}`
  );

  // -------------------------------------------------------------
  // Test 6: "Open Wi-Fi Settings"
  // -------------------------------------------------------------
  const res6 = await gateway.processRequest('Open Wi-Fi Settings');
  assertTest(
    6,
    '"Open Wi-Fi Settings"',
    res6.success &&
      res6.action?.type === 'device_setting' &&
      (res6.action?.intentUri?.includes('WIFI') || res6.action?.payload?.settingKey === 'wifi_settings'),
    `Action: ${res6.action?.title}, Intent URI: ${res6.action?.intentUri}`
  );

  // -------------------------------------------------------------
  // Test 7: "Set a 5 minute timer"
  // -------------------------------------------------------------
  const res7 = await gateway.processRequest('Set a 5 minute timer');
  assertTest(
    7,
    '"Set a 5 minute timer"',
    res7.success &&
      res7.action?.type === 'device_control' &&
      res7.action?.payload?.settingKey === 'timer' &&
      res7.action?.payload?.settingValue === 300,
    `Action: ${res7.action?.title}, Duration: ${res7.action?.payload?.settingValue}s, Label: ${res7.action?.payload?.durationLabel}`
  );

  // -------------------------------------------------------------
  // Test 8: Bengali Voice Command ("হোয়াটসঅ্যাপ খোলো", "ব্যাটারি সেটিংস খোলো")
  // -------------------------------------------------------------
  const res8 = await gateway.processRequest('হোয়াটসঅ্যাপ খোলো');
  const res8b = await gateway.processRequest('ব্যাটারি সেটিংস খোলো');
  assertTest(
    8,
    'Bengali Voice Commands',
    res8.success && res8.action?.targetApp === 'whatsapp' && res8b.success && res8b.action?.type === 'device_setting',
    `Bengali 1: ${res8.action?.titleBn}, Bengali 2: ${res8b.action?.titleBn}`
  );

  // -------------------------------------------------------------
  // Test 9: English Voice Command ("Open Bluetooth Settings", "Open Camera")
  // -------------------------------------------------------------
  const res9 = await gateway.processRequest('Open Camera');
  assertTest(
    9,
    'English Voice Command',
    res9.success && res9.action?.targetApp === 'camera',
    `Action: ${res9.action?.title}, Target App: ${res9.action?.targetApp}`
  );

  // -------------------------------------------------------------
  // Test 10: Banglish Voice Command ("Flashlight jalao", "Battery settings kholo", "5 min timer dao")
  // -------------------------------------------------------------
  const res10a = await gateway.processRequest('Flashlight jalao');
  const res10b = await gateway.processRequest('Battery settings open koro');
  assertTest(
    10,
    'Banglish Voice Commands',
    res10a.success && res10a.action?.payload?.settingKey === 'flashlight' &&
    res10b.success && res10b.action?.type === 'device_setting',
    `Banglish 1: "${res10a.action?.title}", Banglish 2: "${res10b.action?.title}"`
  );

  // -------------------------------------------------------------
  // Test 11: Unsupported Intent Handling (Graceful degradation)
  // -------------------------------------------------------------
  const res11 = await gateway.processRequest('Quantum teleport my phone to Mars');
  assertTest(
    11,
    'Unsupported Intent Handling',
    res11.status === 'executed' && !res11.action,
    `Gracefully treated as conversational query without crashing or false action claims.`
  );

  // -------------------------------------------------------------
  // Test 12: Missing Permission Behavior
  // -------------------------------------------------------------
  // Temporarily revoke accessibility service permission
  androidDeviceManager.setPermissionGranted('BIND_ACCESSIBILITY_SERVICE', false);
  const res12 = await gateway.processRequest('স্ক্রিনে যা আছে পড়ে শোনাও');
  assertTest(
    12,
    'Missing Permission Behavior',
    res12.status === 'needs_permission' && res12.permissionRequired?.id === 'BIND_ACCESSIBILITY_SERVICE',
    `Correctly blocked unpermitted action. Required: ${res12.permissionRequired?.nameBn} (${res12.permissionRequired?.id})`
  );
  // Restore permission
  androidDeviceManager.setPermissionGranted('BIND_ACCESSIBILITY_SERVICE', true);

  // -------------------------------------------------------------
  // Test 13: Risk Classification & Confirmation Prompt for Sensitive/Destructive Actions
  // -------------------------------------------------------------
  const res13 = await gateway.processRequest('Termux-এ rm -rf /sdcard/Photos কমান্ড চালাও');
  assertTest(
    13,
    'Risk Classification & Confirmation Prompt',
    res13.status === 'needs_consent' && res13.dangerLevel === 'destructive',
    `Risk Tier: ${res13.dangerLevel?.toUpperCase()}, Blocked until user confirms in Consent Modal.`
  );

  console.log('================================================================');
  console.log(`TEST RESULTS SUMMARY: ${passCount}/13 PASSED, ${failCount}/13 FAILED`);
  console.log('================================================================');
}

runPriority2Tests().catch(console.error);

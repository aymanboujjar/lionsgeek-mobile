/**
 * Expo config plugin: wire PushKit VoIP + CallKeep in AppDelegate so
 * incoming calls can be reported to CallKit before JS boots (cold start).
 *
 * react-native-voip-push-notification and react-native-callkeep are ObjC
 * pods without DEFINES_MODULE, so Swift `import RNVoipPushNotification`
 * fails on EAS ("no such module"). Expose them through a bridging header
 * instead, matching the libraries' AppDelegate.m integration.
 */
const fs = require('fs');
const path = require('path');
const {
  withAppDelegate,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const COMMENT_KEY = /_comment$/;

const BRIDGING_IMPORTS = `// VoIP / CallKeep (ObjC) — do not use Swift \`import RNVoipPushNotification\`
#import <PushKit/PushKit.h>
#if __has_include(<RNVoipPushNotification/RNVoipPushNotificationManager.h>)
#import <RNVoipPushNotification/RNVoipPushNotificationManager.h>
#else
#import "RNVoipPushNotificationManager.h"
#endif
#if __has_include(<RNCallKeep/RNCallKeep.h>)
#import <RNCallKeep/RNCallKeep.h>
#else
#import "RNCallKeep.h"
#endif
`;

const SWIFT_VOIP_HELPERS = `
  // MARK: - PushKit VoIP (incoming calls when app is killed)
  private func setupVoipPush() {
    RNVoipPushNotificationManager.voipRegistration()
  }
`;

const SWIFT_DELEGATE_METHODS = `
// MARK: - PKPushRegistryDelegate
extension AppDelegate: PKPushRegistryDelegate {
  public func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    // Swift importer: ObjC didUpdatePushCredentials:forType: → didUpdate(_:forType:)
    RNVoipPushNotificationManager.didUpdate(credentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    // Token invalidated — JS will re-register on next launch.
  }

  public func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    let dict = payload.dictionaryPayload
    let uuid = (dict["uuid"] as? String) ?? UUID().uuidString.lowercased()
    let callerName = (dict["callerName"] as? String)
      ?? (dict["caller_name"] as? String)
      ?? "LionsGeek user"
    let handle = (dict["handle"] as? String)
      ?? String(describing: dict["call_id"] ?? uuid)
    let callType = (dict["call_type"] as? String) ?? (dict["callType"] as? String) ?? "audio"
    let hasVideo = callType == "video"

    RNVoipPushNotificationManager.addCompletionHandler(uuid, completionHandler: completion)
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)

    // Apple requires CallKit report before completion() on iOS 13+.
    RNCallKeep.reportNewIncomingCall(
      uuid,
      handle: handle,
      handleType: "generic",
      hasVideo: hasVideo,
      localizedCallerName: callerName,
      supportsHolding: true,
      supportsDTMF: true,
      supportsGrouping: true,
      supportsUngrouping: true,
      fromPushKit: true,
      payload: dict,
      withCompletionHandler: nil
    )

    completion()
  }
}
`;

function nonComments(obj) {
  const next = {};
  for (const key of Object.keys(obj)) {
    if (!COMMENT_KEY.test(key)) next[key] = obj[key];
  }
  return next;
}

function unquote(str) {
  return str ? String(str).replace(/^"(.*)"$/, '$1') : str;
}

function ensureHeaderSearchPath(project, file) {
  const configurations = nonComments(project.pbxXCBuildConfigurationSection());
  const INHERITED = '"$(inherited)"';
  for (const config of Object.keys(configurations)) {
    const buildSettings = configurations[config].buildSettings;
    if (!buildSettings) continue;
    if (unquote(buildSettings.PRODUCT_NAME) !== project.productName) continue;
    if (!buildSettings.HEADER_SEARCH_PATHS) {
      buildSettings.HEADER_SEARCH_PATHS = [INHERITED];
    }
    if (!buildSettings.HEADER_SEARCH_PATHS.includes(file)) {
      buildSettings.HEADER_SEARCH_PATHS.push(file);
    }
  }
}

function ensureBridgingHeaderSetting(project, relativeHeader) {
  const configurations = nonComments(project.pbxXCBuildConfigurationSection());
  for (const config of Object.keys(configurations)) {
    const buildSettings = configurations[config].buildSettings;
    if (!buildSettings) continue;
    if (unquote(buildSettings.PRODUCT_NAME) !== project.productName) continue;
    if (!buildSettings.SWIFT_OBJC_BRIDGING_HEADER) {
      buildSettings.SWIFT_OBJC_BRIDGING_HEADER = `"${relativeHeader}"`;
    }
  }
}

function mergeBridgingHeader(filePath) {
  let contents = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const required = [
    '#import <PushKit/PushKit.h>',
    '#import <RNVoipPushNotification/RNVoipPushNotificationManager.h>',
    '#import "RNVoipPushNotificationManager.h"',
    '#import <RNCallKeep/RNCallKeep.h>',
    '#import "RNCallKeep.h"',
  ];
  const missing = required.some((line) => !contents.includes(line));
  if (!contents.trim()) {
    contents = BRIDGING_IMPORTS;
  } else if (missing) {
    contents = `${contents.trimEnd()}\n\n${BRIDGING_IMPORTS}`;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents.endsWith('\n') ? contents : `${contents}\n`);
}

function ensureSwiftVoip(contents) {
  let next = contents
    .replace(/^import RNVoipPushNotification\s*\n/gm, '')
    .replace(/^import RNCallKeep\s*\n/gm, '');

  if (!next.includes('import PushKit')) {
    if (next.includes('import Expo')) {
      next = next.replace('import Expo', 'import Expo\nimport PushKit');
    } else if (next.includes('import UIKit')) {
      next = next.replace('import UIKit', 'import UIKit\nimport PushKit');
    } else {
      next = `import PushKit\n${next}`;
    }
  }

  // Replace the first-version helper that created a second PKPushRegistry.
  next = next.replace(
    /\n  \/\/ MARK: - PushKit VoIP \(incoming calls when app is killed\)\n  private var voipRegistry: PKPushRegistry\?\n\n  private func setupVoipPush\(\) \{[\s\S]*?RNVoipPushNotificationManager\.voipRegistration\(\)\n  \}\n/,
    SWIFT_VOIP_HELPERS
  );

  if (!next.includes('setupVoipPush()')) {
    if (next.includes('var window:')) {
      next = next.replace(
        /var window:[^\n]+\n/,
        (m) => `${m}${SWIFT_VOIP_HELPERS}\n`
      );
    } else if (next.includes('class AppDelegate')) {
      next = next.replace(
        /class AppDelegate[^{]*\{\n/,
        (m) => `${m}${SWIFT_VOIP_HELPERS}\n`
      );
    }

    if (next.includes('didFinishLaunchingWithOptions')) {
      next = next.replace(
        /(didFinishLaunchingWithOptions[^{]*\{\n)/,
        `$1    setupVoipPush()\n`
      );
    }
  }

  const hasWrongSwiftSelectors =
    next.includes('didUpdatePushCredentials(') ||
    next.includes('didReceiveIncomingPush(withPayload:');

  if (hasWrongSwiftSelectors || !next.includes('PKPushRegistryDelegate')) {
    next = next.replace(/\n\/\/ MARK: - PKPushRegistryDelegate[\s\S]*$/, '\n');
    next = `${next.trimEnd()}\n${SWIFT_DELEGATE_METHODS}\n`;
  }

  return next;
}

const OBJC_CALLKEEP_REPORT = `[RNCallKeep reportNewIncomingCall:uuid
                           handle:handle
                       handleType:@"generic"
                         hasVideo:hasVideo
              localizedCallerName:callerName
                  supportsHolding:YES
                     supportsDTMF:YES
                 supportsGrouping:YES
               supportsUngrouping:YES
                      fromPushKit:YES
                          payload:dict
            withCompletionHandler:nil];`;

function ensureObjCVoip(contents) {
  let next = contents;

  if (!next.includes('#import <PushKit/PushKit.h>')) {
    next = next.replace(
      /#import "AppDelegate.h"/,
      `#import "AppDelegate.h"\n#import <PushKit/PushKit.h>\n#import "RNVoipPushNotificationManager.h"\n#import "RNCallKeep.h"`
    );
  }

  if (!next.includes('voipRegistration')) {
    next = next.replace(
      /didFinishLaunchingWithOptions:[\s\S]*?\{/,
      (m) => `${m}\n  [RNVoipPushNotificationManager voipRegistration];`
    );
  }

  if (!next.includes('didReceiveIncomingPushWithPayload')) {
    const methods = `
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  NSDictionary *dict = payload.dictionaryPayload;
  NSString *uuid = dict[@"uuid"] ?: [[NSUUID UUID] UUIDString].lowercaseString;
  NSString *callerName = dict[@"callerName"] ?: dict[@"caller_name"] ?: @"LionsGeek user";
  NSString *handle = dict[@"handle"] ?: [NSString stringWithFormat:@"%@", dict[@"call_id"] ?: uuid];
  NSString *callType = dict[@"call_type"] ?: dict[@"callType"] ?: @"audio";
  BOOL hasVideo = [callType isEqualToString:@"video"];

  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];
  ${OBJC_CALLKEEP_REPORT}
  completion();
}
`;
    next = next.replace(/\n@end\s*$/, `\n${methods}\n@end\n`);
  }

  return next;
}

const withVoipBridgingHeader = (config) =>
  withXcodeProject(config, (cfg) => {
    const projectName = cfg.modRequest.projectName;
    const relativeHeader = `${projectName}/${projectName}-Bridging-Header.h`;
    mergeBridgingHeader(
      path.join(cfg.modRequest.platformProjectRoot, relativeHeader)
    );
    ensureBridgingHeaderSetting(cfg.modResults, relativeHeader);
    ensureHeaderSearchPath(
      cfg.modResults,
      '"$(SRCROOT)/../node_modules/react-native-voip-push-notification/ios/RNVoipPushNotification"'
    );
    return cfg;
  });

const withVoipPushCallKeepAppDelegate = (config) =>
  withAppDelegate(config, (cfg) => {
    const file = cfg.modResults;
    if (file.language === 'swift' || (file.path || '').endsWith('.swift')) {
      file.contents = ensureSwiftVoip(file.contents);
    } else {
      file.contents = ensureObjCVoip(file.contents);
    }
    return cfg;
  });

const withVoipEntitlements = (config) =>
  withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['aps-environment'] =
      cfg.modResults['aps-environment'] || 'production';
    return cfg;
  });

const withVoipInfoPlist = (config) =>
  withInfoPlist(config, (cfg) => {
    const modes = new Set(cfg.modResults.UIBackgroundModes || []);
    // Keep voip for CallKit/PushKit. Do not add "audio" — App Store 2.5.4
    // rejects unused background audio unless persistent playback is demoed.
    modes.add('voip');
    modes.add('remote-notification');
    cfg.modResults.UIBackgroundModes = Array.from(modes);
    return cfg;
  });

const withVoipPushCallKeep = (config) => {
  config = withVoipInfoPlist(config);
  config = withVoipEntitlements(config);
  config = withVoipBridgingHeader(config);
  config = withVoipPushCallKeepAppDelegate(config);
  return config;
};

module.exports = createRunOncePlugin(
  withVoipPushCallKeep,
  'withVoipPushCallKeep',
  '1.1.1'
);

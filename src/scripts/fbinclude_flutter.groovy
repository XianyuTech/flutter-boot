// Generated file. Do not edit.
// by flutter boot

boolean enableDetectFlutterDir = gradle.android_enableDetectFlutterDir && gradle.android_enableDetectFlutterDir.toBoolean()
def localConfigFile = new File(gradle.settingsDir, 'fbConfig.local.json')
String flutterProjectRoot = ''
if (localConfigFile.exists()) {
    String fileStr = localConfigFile.getText('UTF-8')
    def configJsonObj = new groovy.json.JsonSlurper().parseText(fileStr)
    flutterProjectRoot = configJsonObj.flutterPath
}

if (flutterProjectRoot == null || flutterProjectRoot.isEmpty()) {
    def remoteConfigFile = new File(gradle.settingsDir, 'fbConfig.json')
    if (remoteConfigFile.exists()) {
        def result = "flutter-boot update".execute()
        flutterProjectRoot = '.fbflutter'
    }
}

boolean isDetectedFlutterDir = flutterProjectRoot != null && !flutterProjectRoot.isEmpty() && enableDetectFlutterDir
gradle.getGradle().ext.isDetectedFlutterDir = isDetectedFlutterDir
if (isDetectedFlutterDir) {
    evaluate(new File(flutterProjectRoot, '.android/include_flutter.groovy'))
}
# https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/podfile/dsl.rb#L256

$REGISTERED_DEPENDENCIES = Hash.new
$REGISTER_MODE = true

fbFlutterPath = ''
fbJsonPath = File.join(File.dirname(__FILE__), 'fbconfig.local.json')
if File.exists? fbJsonPath
    fbjson = File.read(fbJsonPath)
    fbConfig = JSON.parse(fbjson)
    if fbConfig['flutterPath']
        fbFlutterPath = fbConfig['flutterPath']
    end
end
if fbFlutterPath == nil
    result = `flutter-boot update`
    fbFlutterPath = '.fbflutter'
end

flutter_application_path = fbFlutterPath
require File.join(flutter_application_path, '.ios', 'Flutter', 'podhelper.rb')
install_flutter_engine_pod
install_flutter_plugin_pods(flutter_application_path)
install_flutter_application_pod(flutter_application_path)

$REGISTER_MODE = false

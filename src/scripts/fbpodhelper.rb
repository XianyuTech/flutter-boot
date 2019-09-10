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
eval(File.read(File.join(flutter_application_path, '.ios', 'Flutter', 'podhelper.rb')), binding) 

$REGISTER_MODE = false

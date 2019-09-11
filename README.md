
# Description
A native-flutter-hybrid develop tool helps you add and develop flutter with your existing app.
We supports a standard hybrid project structure following google.
We supports a fast intergration of flutter-boost which is a standard solution to manage native and flutter pages.

# Host app requirements
1. support flutter version ^1.5.0
2. commit all native code before using me :)

# Installation
1. install from npm
    ```
    npm install -g flutter-boot
    ```
2. initialize flutter module
    Let's assume you have an existing Flutter environment, if you don't, please read [Flutter Get Started](https://flutter.dev/docs/get-started/install)
    run init command
    ```
    flutter-boot init
    ```
    then follow the instruction to complete the initialization

3. add flutter-boost
    In Android
    * run use command in android project
    ```
    flutter-boot use
    ```
    * select FlutterBoost

    * create a MyApplication class if your project does not have a custom application, then add it to AndroidManifest.xml
    ```
    android:name=".MyApplication"
    ```

    * insert the code below into the "onCreate" method in your application class
    ```
    /// initialize the flutter boost
    FBInitializer.init(this);
    ```

    * insert the code below into the "onCreate" method in your Actvity class
    ```
    /// add a button in native activity for navigating to flutter
    FBViewEntry.setup(this);
    ```
    
    In iOS
    * change the super class of Appdelegate to FLBFlutterAppDelegate, import code:
    ```
    #import <flutter_boost/FLBFlutterAppDelegate.h>

    @interface AppDelegate : FLBFlutterAppDelegate <UIApplicationDelegate>
    ```
    * insert the code below into the "application:didFinishLaunchingWithOptions" method in your Appdelegate.m
    ```
    #import "FBDemoRouter.h"

    [FBDemoRouter registerInFlutterBoost];
    ```
    * insert the code below into your viewcontroller
    ```
    #import "FBDemoRouter.h"
    /// add a button in native controller for navigating to flutter
    [[FBDemoRouter shared]addEntryView:self];
    ```
    * run target Runner

4. your workmates do
    if you have prepared hybrid enviroment by flutter-boot, and your workmates want to develop flutter, then they should run flutter-boot link before running flutter.

# Usage
## run in native
Just run your app as normal
## run in flutter
use 'flutter run' in your flutter project

# How it works
## command create
command create invokes the original flutter module creation command, then creates shell projects for flutter archiving, and prepares git environment. Changed files as below:
```
somepath/my_repo
└──my_android
└──my_ios
└──my_flutter
    └──.git
    └──.gitignore
    └──android_shell
    └──ios_shell
    └──android
    └──ios
```


## command link
command link is used for linking native project and flutter project locally, you can run your app both in native and flutter after project linked. 
### Changed files as below:
```
somepath/my_repo
└──my_android
    └──fbConfig.local.json
    └──fbinclude_flutter.groovy
    └──build.gradle
└──my_ios
    └──fbConfig.local.json
    └──fbpodhelper.rb
    └──.xcworkspace
    └──Podfile
└──my_flutter
    └──.gitignore
    └──android symlink with my_android
    └──ios symlink with my_ios
```
#### The existed filed being modified
##### my_ios
.xcworkspace:
1. we copied a scheme named Runner, which is limited by flutter, from the scheme named by project
2.  scripts added to build phase setting
    ```
    "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" build 
    "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" embed
    ```
Podfile:
```
# Created by flutter-boot
target 'Runner' do
  # Uncomment the next line if you're using Swift or would like to use dynamic frameworks
  # use_frameworks!

  # Pods for Runner

  target 'RunnerTests' do
    inherit! :search_paths
    # Pods for testing
  end

  target 'RunnerUITests' do
    inherit! :search_paths
    # Pods for testing
  end


  eval(File.read(File.join(File.dirname(__FILE__), 'fbpodhelper.rb')), binding)

end
```
##### my_android
build.gradle:
```
    // [FLUTTER_DEPENDENCY_BEGIN] 
    if (gradle.isDetectedFlutterDir) { 
        implementation project(':flutter') 
    } else { 
        // 换成自己的远程flutter产物 
    } 
```
setting.gradle:
```
// [FLUTTER_CONFIG_BEGIN]
setBinding(new Binding([gradle: this])) 
evaluate(new File('fbinclude_flutter.groovy')) 
// [FLUTTER_CONFIG_END]
```
gradle.properties:
```
android_enableDetectFlutterDir=true 
```

## command remotelink
command remotelink is to record your remote flutter git repository which will generate a shared config file. Changed files as below:
```
somepath/my_repo
└──my_android
    └──fbConfig.json
└──my_ios
    └──fbConfig.json
└──my_flutter
```

## command update
command update will fetch your remote linked flutter repository into your native project. Changed files as below:
```
somepath/my_repo
└──my_android
    └──.fbflutter
└──my_ios
    └──.fbflutter
└──my_flutter
```

## command use
### use FlutterBoost
FlutterBoost dependency will be added and sample code will be added in android when use FlutterBoost. Changed files as below:
```
somepath/my_repo
└──my_android
    └──com.example.fbi.fb
└──my_ios
└──my_flutter
    └──pubspec.yaml
```

## command init
command init assembles a bunch of other commands that helps you build native-flutter hybrid developing enviroment smoothly.


# 简介
这是一个帮助你在已有原生应用的情况下，搭建flutter混合开发环境的工具。
我们提供了标准的混合工程结构，同时支持混合栈（一套原生和flutter之前页面通信和过渡的方案）的快速接入。

# 安装的app必需
1. 拥有^1.5.0的flutter环境
2. 在使用前提交你所有待提交的代码

# 安装
1. 从npm安装
    ```
    npm install -g flutter-boot
    ```
2. 我们假设你已经拥有了基础的flutter环境（如果没有可以参考[Flutter Get Started](https://flutter.dev/docs/get-started/install)），然后你可以使用以下命令来初始化你的混合工程
    ```
    flutter-boot init
    ```
    然后根据命令内的提示完成所有步骤

3. 添加混合栈
    Android应用
    * 在android应用内运行
    ```
    flutter-boot use
    ```
    * 选择FlutterBoost

    * 如果你的工程没有Application类，请创建自定义的Application类，然后把它添加到AndroidManifest.xml
    ```
    android:name=".MyApplication"
    ```

    * 将以下代码插入到Application类的"onCreate"方法内
    ```
    /// initialize the flutter boost
    FBInitializer.init(this);
    ```

    * 将以下代码插入到你的Actvity类的"onCreate"方法内，来显示一个跳转flutter的视图
    ```
    /// add a button in native activity for navigating to flutter
    FBViewEntry.setup(this);
    ```

    iOS应用
    * 暂请根据混合栈[官方文档](https://github.com/alibaba/flutter_boost)进行接入

4. 如果你的同事已经使用flutter-boot创建好了混合工程，而你又需要进行flutter开发，那么你需要的是在启动app前运行flutter-boot link来关联你的本地的flutter工程和native工程


# 使用
## 原生视角使用
像平时运行原生应用一样
## flutter视角使用
像其他flutter开发者一样使用'flutter run'

# 它是怎么生效的
## create命令
create命令调用了flutter module的创建命令，同时为了打包产物而创建了壳工程，然后提供了一个快速链接git仓库的方式。受影响的文件如下
```
somepath/my_repo
└──my_android
└──my_ios
└──my_flutter
    └──.git
    └──.gitignore
    └──android_shell
    └──ios_shell
    └──android
    └──ios
```

## link命令
link命令是用来关联你本地的flutter工程和原生工程，这样你就同时拥有了两种开发视角. 
### 受影响的文件如下:
```
somepath/my_repo
└──my_android
    └──fbConfig.local.json
    └──fbinclude_flutter.groovy
    └──build.gradle
└──my_ios
    └──fbConfig.local.json
    └──fbpodhelper.rb
    └──.xcworkspace
    └──Podfile
└──my_flutter
    └──.gitignore
    └──android symlink with my_android
    └──ios symlink with my_ios
```
#### 已存在的文件修改记录如下
##### my_ios
.xcworkspace:
1. 在目前的flutter环境下，我们根据与工程名称同名的scheme，复制了一份名为runner的
2.  在build phase setting内添加了如下脚本引用
    ```
    "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" build 
    "$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" embed
    ```
Podfile:
```
# Created by flutter-boot
target 'Runner' do
  # Uncomment the next line if you're using Swift or would like to use dynamic frameworks
  # use_frameworks!

  # Pods for Runner

  target 'RunnerTests' do
    inherit! :search_paths
    # Pods for testing
  end

  target 'RunnerUITests' do
    inherit! :search_paths
    # Pods for testing
  end


  eval(File.read(File.join(File.dirname(__FILE__), 'fbpodhelper.rb')), binding)

end
```
##### my_android
build.gradle:
```
    // [FLUTTER_DEPENDENCY_BEGIN] 
    if (gradle.isDetectedFlutterDir) { 
        implementation project(':flutter') 
    } else { 
        // 换成自己的远程flutter产物 
    } 
```
setting.gradle:
```
// [FLUTTER_CONFIG_BEGIN]
setBinding(new Binding([gradle: this])) 
evaluate(new File('fbinclude_flutter.groovy')) 
// [FLUTTER_CONFIG_END]
```
gradle.properties:
```
android_enableDetectFlutterDir=true 
```

## remotelink命令
remotelink命令用来记录你的flutter git仓库. 受影响的文件如下:
```
somepath/my_repo
└──my_android
    └──fbConfig.json
└──my_ios
    └──fbConfig.json
└──my_flutter
```

## update命令
update命令会从远端拉取你的flutter仓库代码，然后放置在你的原生工程内. 受影响的文件如下:
```
somepath/my_repo
└──my_android
    └──.fbflutter
└──my_ios
    └──.fbflutter
└──my_flutter
```

## use命令
### 使用FlutterBoost
FlutterBoost的依赖会被注入到flutter配置文件中，同时在android侧我们会添加一些示例代码. 受影响的文件如下:
```
somepath/my_repo
└──my_android
    └──com.example.fbi.fb
└──my_ios
└──my_flutter
    └──pubspec.yaml
```

## init命令
init命令是上述一些命令的功能集合，它能帮助你流程的完成整个混合工程的搭建。


# Add flutter-boost

create a MyApplication class if your project do not have a custom application, then add it to AndroidManifest.xml
```
android:name=".MyApplication"
```

insert the code below into the "onCreate" method in your application class
```
/// initialize the flutter boost
FBInitializer.init(this);
```

insert the code below into the "onCreate" method in your Actvity class
```
/// add a button in native activity for navigating to flutter
FBViewEntry.setup(this);
```
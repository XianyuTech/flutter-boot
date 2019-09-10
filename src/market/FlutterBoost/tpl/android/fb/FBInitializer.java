package com.example.fbi.fb;

import android.app.Application;
import android.content.Context;

import com.idlefish.flutterboost.BoostEngineProvider;
import com.idlefish.flutterboost.BoostFlutterEngine;
import com.idlefish.flutterboost.FlutterBoost;
import com.idlefish.flutterboost.Platform;
import com.idlefish.flutterboost.interfaces.IFlutterEngineProvider;

import java.util.Map;

import io.flutter.app.FlutterApplication;
import io.flutter.embedding.engine.dart.DartExecutor;
import io.flutter.view.FlutterMain;

public class FBInitializer {

    public static void init(Application app) {
        if(!(app instanceof FlutterApplication)) {
            FlutterMain.startInitialization(app);
        }
        FlutterBoost.init(new Platform() {

            @Override
            public Application getApplication() {
                return app;
            }

            @Override
            public boolean isDebug() {
                return true;
            }

            @Override
            public void openContainer(Context context, String url, Map<String, Object> urlParams, int requestCode,
                    Map<String, Object> exts) {
                /// TODO
                // open a new activity from flutter
            }

            @Override
            public IFlutterEngineProvider engineProvider() {
                return new BoostEngineProvider() {
                    @Override
                    public BoostFlutterEngine createEngine(Context context) {
                        return new BoostFlutterEngine(context,
                                new DartExecutor.DartEntrypoint(context.getResources().getAssets(),
                                        FlutterMain.findAppBundlePath(context), "main"),
                                "/");
                    }
                };
            }

            @Override
            public int whenEngineStart() {
                return ANY_ACTIVITY_CREATED;
            }
        });
    }
}
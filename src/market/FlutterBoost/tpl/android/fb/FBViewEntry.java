package com.example.fbi.fb;

import android.app.Activity;
import android.graphics.Color;
import android.os.Handler;
import android.text.Layout;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.PopupWindow;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.idlefish.flutterboost.containers.BoostFlutterDefaultActivity;

public class FBViewEntry {

    public static void setup(Activity activity) {
        final Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                final RelativeLayout context = new RelativeLayout(activity);
                context.setBackgroundColor(Color.rgb(27,163,251));

                final TextView text = new TextView(activity);
                text.setTextColor(Color.WHITE);
                text.setText("Navigate To Flutter");
                text.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        BoostFlutterDefaultActivity.open(activity, "demo://mypage", null);
                    }
                });

                final RelativeLayout.LayoutParams tvLayoutParams = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                tvLayoutParams.setMargins(15,5,15,5);

                text.setLayoutParams(tvLayoutParams);
                context.addView(text);

                final PopupWindow popupWindow = new PopupWindow(context, ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                popupWindow.setOutsideTouchable(false);
                popupWindow.showAtLocation(activity.getWindow().getDecorView(), Gravity.BOTTOM,0,150);
            }
        }, 1000);
    }
}
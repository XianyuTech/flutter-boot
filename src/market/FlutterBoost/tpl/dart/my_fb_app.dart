import 'package:flutter/material.dart';
import 'package:flutter_boost/flutter_boost.dart';

class MyFlutterBoostApp extends StatefulWidget {
  final Map<String, PageBuilder> builders;

  MyFlutterBoostApp(this.builders);

  @override
  _MyFlutterBoostAppState createState() => _MyFlutterBoostAppState();
}

class _MyFlutterBoostAppState extends State<MyFlutterBoostApp> {
  @override
  void initState() {
    super.initState();
    FlutterBoost.singleton.registerPageBuilders(widget.builders);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      builder: FlutterBoost.init(postPush: _onRoutePushed),
      home: Container(),
    );
  }

  void _onRoutePushed(
    String pageName,
    String uniqueId,
    Map params,
    Route route,
    Future _,
  ) {}
}

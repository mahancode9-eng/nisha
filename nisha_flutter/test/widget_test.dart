import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:nisha_flutter/app.dart';

void main() {
  testWidgets('shows the Persian-first landing page', (tester) async {
    WidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues(<String, Object>{});
    FlutterSecureStorage.setMockInitialValues(<String, String>{});

    await tester.pumpWidget(
      const ProviderScope(
        child: NishaApp(),
      ),
    );
    await tester.pump(const Duration(seconds: 1));

    expect(find.text('نیشا'), findsWidgets);
    expect(find.text('ویترین یکپارچه برای همه نقش‌ها'), findsOneWidget);
    expect(find.byIcon(Icons.palette_rounded), findsWidgets);
  });
}

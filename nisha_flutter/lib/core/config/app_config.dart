import 'package:flutter/widgets.dart';

class AppConfig {
  AppConfig._();

  static const String appName = 'Nisha';
  static const String apiPrefix = '/api/v1';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );
  static const Locale defaultLocale = Locale('fa');
  static const List<Locale> supportedLocales = <Locale>[
    Locale('fa'),
    Locale('en'),
  ];

  static String get apiUrl => '$apiBaseUrl$apiPrefix';

  static String resolveUrl(String? value) {
    if (value == null || value.isEmpty) {
      return '';
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    if (value.startsWith('/')) {
      return '$apiBaseUrl$value';
    }
    return '$apiBaseUrl/$value';
  }
}

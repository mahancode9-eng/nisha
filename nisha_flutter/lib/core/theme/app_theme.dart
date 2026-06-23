import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final scheme = const ColorScheme(
      brightness: Brightness.light,
      primary: AppColors.purple,
      onPrimary: Colors.white,
      primaryContainer: AppColors.purpleSoft,
      onPrimaryContainer: AppColors.textLight,
      secondary: AppColors.purpleDark,
      onSecondary: Colors.white,
      secondaryContainer: Color(0xFFF2E8FF),
      onSecondaryContainer: AppColors.textLight,
      tertiary: Color(0xFFB45309),
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFFDE68A),
      onTertiaryContainer: AppColors.textLight,
      error: Color(0xFFB91C1C),
      onError: Colors.white,
      errorContainer: Color(0xFFFECACA),
      onErrorContainer: Color(0xFF7F1D1D),
      surface: AppColors.whiteSurface,
      onSurface: AppColors.textLight,
      surfaceContainerHighest: Color(0xFFF0E8FF),
      onSurfaceVariant: Color(0xFF5D4A77),
      outline: AppColors.borderLight,
      outlineVariant: Color(0xFFE8DDF6),
      shadow: Color(0x1F140F22),
      scrim: Colors.black,
      inverseSurface: AppColors.blackSoft,
      onInverseSurface: AppColors.textDark,
      inversePrimary: Color(0xFFC4B5FD),
    );

    return _buildTheme(
      colorScheme: scheme,
      brightness: Brightness.light,
    );
  }

  static ThemeData dark() {
    final scheme = const ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xFFC4B5FD),
      onPrimary: AppColors.black,
      primaryContainer: AppColors.purpleDark,
      onPrimaryContainer: AppColors.textDark,
      secondary: Color(0xFFD8B4FE),
      onSecondary: AppColors.black,
      secondaryContainer: Color(0xFF3B2462),
      onSecondaryContainer: AppColors.textDark,
      tertiary: Color(0xFFFBBF24),
      onTertiary: AppColors.black,
      tertiaryContainer: Color(0xFF6B4E00),
      onTertiaryContainer: Color(0xFFFFF7D6),
      error: Color(0xFFF87171),
      onError: AppColors.black,
      errorContainer: Color(0xFF7F1D1D),
      onErrorContainer: Color(0xFFFECACA),
      surface: AppColors.black,
      onSurface: AppColors.textDark,
      surfaceContainerHighest: AppColors.blackSurface,
      onSurfaceVariant: Color(0xFFD8C6FF),
      outline: AppColors.borderDark,
      outlineVariant: Color(0xFF2B2241),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: AppColors.whiteSoft,
      onInverseSurface: AppColors.textLight,
      inversePrimary: AppColors.purple,
    );

    return _buildTheme(
      colorScheme: scheme,
      brightness: Brightness.dark,
    );
  }

  static ThemeData _buildTheme({
    required ColorScheme colorScheme,
    required Brightness brightness,
  }) {
    final baseTheme = brightness == Brightness.dark
        ? ThemeData.dark(useMaterial3: true)
        : ThemeData.light(useMaterial3: true);
    final textTheme = baseTheme.textTheme.apply(
      bodyColor: colorScheme.onSurface,
      displayColor: colorScheme.onSurface,
      fontFamily: 'Vazirmatn',
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.surface,
      textTheme: textTheme,
      fontFamily: 'Vazirmatn',
      fontFamilyFallback: const <String>['Noto Sans Arabic', 'Roboto'],
      cardTheme: CardThemeData(
        color: colorScheme.surfaceContainerHighest.withValues(
          alpha: brightness == Brightness.dark ? 0.65 : 0.85,
        ),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface.withValues(
          alpha: brightness == Brightness.dark ? 0.92 : 0.94,
        ),
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colorScheme.surface.withValues(
          alpha: brightness == Brightness.dark ? 0.94 : 0.98,
        ),
        indicatorColor: colorScheme.primaryContainer,
        labelTextStyle: WidgetStatePropertyAll(
          textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: brightness == Brightness.dark
            ? const Color(0xFF1B1528)
            : const Color(0xFFF6F0FF),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surfaceContainerHighest,
        selectedColor: colorScheme.primaryContainer,
        labelStyle: textTheme.labelMedium,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
      dividerTheme: DividerThemeData(
        color: colorScheme.outlineVariant,
        thickness: 1,
      ),
    );
  }
}

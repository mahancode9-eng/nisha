import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/locale_controller.dart';
import '../../core/theme/theme_controller.dart';
import '../extensions/build_context_x.dart';

class AppearanceButton extends StatelessWidget {
  const AppearanceButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => showAppearanceSheet(context),
      tooltip: context.l10n.appearance,
      icon: const Icon(Icons.palette_rounded),
    );
  }
}

Future<void> showAppearanceSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => const Padding(
      padding: EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: AppearanceSection(),
    ),
  );
}

class AppearanceSection extends ConsumerWidget {
  const AppearanceSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);
    final locale = ref.watch(localeControllerProvider);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.l10n.appearanceSectionTitle,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          context.l10n.appearanceSectionDescription,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 20),
        _SectionLabel(label: context.l10n.themeModeLabel),
        const SizedBox(height: 10),
        SegmentedButton<ThemeMode>(
          segments: [
            ButtonSegment<ThemeMode>(
              value: ThemeMode.system,
              label: Text(context.l10n.themeSystem),
              icon: const Icon(Icons.settings_rounded),
            ),
            ButtonSegment<ThemeMode>(
              value: ThemeMode.light,
              label: Text(context.l10n.themeLight),
              icon: const Icon(Icons.light_mode_rounded),
            ),
            ButtonSegment<ThemeMode>(
              value: ThemeMode.dark,
              label: Text(context.l10n.themeDark),
              icon: const Icon(Icons.dark_mode_rounded),
            ),
          ],
          selected: {themeMode},
          onSelectionChanged: (selected) {
            if (selected.isNotEmpty) {
              ref.read(themeControllerProvider.notifier).setThemeMode(
                    selected.first,
                  );
            }
          },
          showSelectedIcon: false,
        ),
        const SizedBox(height: 20),
        _SectionLabel(label: context.l10n.appLanguageLabel),
        const SizedBox(height: 10),
        SegmentedButton<Locale>(
          segments: [
            ButtonSegment<Locale>(
              value: const Locale('fa'),
              label: Text(context.l10n.languagePersian),
              icon: const Icon(Icons.language_rounded),
            ),
            ButtonSegment<Locale>(
              value: const Locale('en'),
              label: Text(context.l10n.languageEnglish),
              icon: const Icon(Icons.translate_rounded),
            ),
          ],
          selected: {locale},
          onSelectionChanged: (selected) {
            if (selected.isNotEmpty) {
              ref.read(localeControllerProvider.notifier).setLocale(
                    selected.first,
                  );
            }
          },
          showSelectedIcon: false,
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
          ),
    );
  }
}

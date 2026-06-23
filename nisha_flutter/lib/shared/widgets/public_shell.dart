import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/route_paths.dart';
import '../extensions/build_context_x.dart';
import 'app_brand_mark.dart';
import 'appearance_controls.dart';

class PublicShell extends ConsumerWidget {
  const PublicShell({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const AppBrandMark(size: 28),
            const SizedBox(width: 10),
            Text(
              context.l10n.appTitle,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ],
        ),
        actions: const [
          AppearanceButton(),
          SizedBox(width: 8),
        ],
      ),
      body: child,
      floatingActionButton: _QuickActionsFab(),
    );
  }
}

class _QuickActionsFab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      onPressed: () => context.go(RoutePaths.trackOrder),
      icon: const Icon(Icons.local_shipping_rounded),
      label: Text(context.l10n.trackOrder),
    );
  }
}

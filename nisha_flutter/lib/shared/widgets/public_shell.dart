import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/router/route_paths.dart';
import '../extensions/build_context_x.dart';
import 'app_brand_mark.dart';
import 'appearance_controls.dart';

class PublicShell extends StatelessWidget {
  const PublicShell({
    super.key,
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.sizeOf(context).width >= 720;

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
        actions: [
          if (isWide)
            TextButton.icon(
              onPressed: () => context.go(RoutePaths.trackOrder),
              icon: const Icon(Icons.local_shipping_rounded),
              label: Text(context.l10n.trackOrder),
            ),
          const AppearanceButton(),
          const SizedBox(width: 8),
        ],
      ),
      body: child,
      floatingActionButton: isWide
          ? null
          : FloatingActionButton.extended(
              onPressed: () => context.go(RoutePaths.trackOrder),
              icon: const Icon(Icons.local_shipping_rounded),
              label: Text(context.l10n.trackOrder),
            ),
    );
  }
}

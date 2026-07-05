import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/session/app_session.dart';
import '../../core/session/session_controller.dart';
import '../extensions/build_context_x.dart';
import 'appearance_controls.dart';
import 'user_chip.dart';

class WorkspaceDestination {
  const WorkspaceDestination({
    required this.label,
    required this.icon,
    required this.route,
  });

  final String label;
  final IconData icon;
  final String route;
}

class WorkspaceShell extends ConsumerWidget {
  const WorkspaceShell({
    super.key,
    required this.title,
    required this.child,
    required this.destinations,
    required this.currentIndex,
  });

  final String title;
  final Widget child;
  final List<WorkspaceDestination> destinations;
  final int currentIndex;

  ({String name, String? meta})? _sessionIdentity(AppSession session) {
    return switch (session) {
      SellerSession(:final user) => (name: user.fullName, meta: user.email),
      CustomerSession(:final customer) => (
          name: customer.fullName,
          meta: customer.email ?? customer.phone,
        ),
      _ => null,
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    final identity = _sessionIdentity(session);

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (identity != null) ...[
            UserChip(name: identity.name, meta: identity.meta),
            const SizedBox(width: 8),
          ],
          const AppearanceButton(),
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            children: [
              if (identity != null) ...[
                UserChip(name: identity.name, meta: identity.meta),
                const SizedBox(height: 16),
              ],
              for (var index = 0; index < destinations.length; index++)
                ListTile(
                  selected: index == currentIndex,
                  leading: Icon(destinations[index].icon),
                  title: Text(destinations[index].label),
                  onTap: () => context.go(destinations[index].route),
                ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout_rounded),
                title: Text(context.l10n.logout),
                onTap: () async {
                  Navigator.of(context).pop();
                  await ref.read(sessionControllerProvider.notifier).signOut();
                  if (context.mounted) {
                    context.go('/');
                  }
                },
              ),
            ],
          ),
        ),
      ),
      body: SafeArea(child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          context.go(destinations[index].route);
        },
        destinations: [
          for (final destination in destinations)
            NavigationDestination(
              icon: Icon(destination.icon),
              label: destination.label,
            ),
        ],
      ),
    );
  }
}

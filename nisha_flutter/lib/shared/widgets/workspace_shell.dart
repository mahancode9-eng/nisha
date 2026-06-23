import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/session/session_controller.dart';
import '../extensions/build_context_x.dart';
import 'appearance_controls.dart';

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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(sessionControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: const [
          AppearanceButton(),
          SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            children: [
              ListTile(
                title: Text(
                  context.l10n.appearance,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                subtitle: Text(context.l10n.appearanceSectionDescription),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: AppearanceSection(),
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_paths.dart';
import '../../../../shared/extensions/build_context_x.dart';
import '../../../../shared/widgets/app_backdrop.dart';
import '../../../../shared/widgets/app_brand_mark.dart';
import '../../../../shared/widgets/public_shell.dart';
import '../../../../shared/widgets/section_card.dart';

class PublicHomePage extends StatelessWidget {
  const PublicHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return PublicShell(
      child: AppBackdrop(
        topPadding: 18,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SectionCard(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const AppBrandMark(size: 48),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    context.l10n.appTitle,
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineSmall
                                        ?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(context.l10n.appSubtitle),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 22),
                        Text(
                          context.l10n.heroTitle,
                          style: Theme.of(context)
                              .textTheme
                              .displaySmall
                              ?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          context.l10n.heroSubtitle,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 20),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            FilledButton.icon(
                              onPressed: () => context.go(RoutePaths.trackOrder),
                              icon: const Icon(Icons.local_shipping_rounded),
                              label: Text(context.l10n.trackOrder),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => context.go(RoutePaths.sellerLogin),
                              icon: const Icon(Icons.storefront_rounded),
                              label: Text(context.l10n.openSellerSpace),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => context.go(RoutePaths.customerLogin),
                              icon: const Icon(Icons.person_rounded),
                              label: Text(context.l10n.openCustomerSpace),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => context.go(RoutePaths.adminDashboard),
                              icon: const Icon(Icons.admin_panel_settings_rounded),
                              label: Text(context.l10n.openAdminSpace),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    context.l10n.featuredAreas,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 14),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final width = constraints.maxWidth;
                      final cardWidth = width >= 900
                          ? (width - 32) / 3
                          : width >= 620
                              ? (width - 16) / 2
                              : width;

                      return Wrap(
                        spacing: 16,
                        runSpacing: 16,
                        children: [
                          SizedBox(
                            width: cardWidth,
                            child: _RoleLaunchCard(
                              icon: Icons.store_rounded,
                              title: context.l10n.publicSpace,
                              description: context.l10n.publicSpaceDescription,
                              actionLabel: context.l10n.browseCatalog,
                              onTap: () => context.go('/store/nisha-demo'),
                            ),
                          ),
                          SizedBox(
                            width: cardWidth,
                            child: _RoleLaunchCard(
                              icon: Icons.storefront_rounded,
                              title: context.l10n.sellerSpace,
                              description: context.l10n.sellerSpaceDescription,
                              actionLabel: context.l10n.openSellerSpace,
                              onTap: () => context.go(RoutePaths.sellerLogin),
                            ),
                          ),
                          SizedBox(
                            width: cardWidth,
                            child: _RoleLaunchCard(
                              icon: Icons.person_rounded,
                              title: context.l10n.customerSpace,
                              description: context.l10n.customerSpaceDescription,
                              actionLabel: context.l10n.openCustomerSpace,
                              onTap: () => context.go(RoutePaths.customerLogin),
                            ),
                          ),
                          SizedBox(
                            width: cardWidth,
                            child: _RoleLaunchCard(
                              icon: Icons.admin_panel_settings_rounded,
                              title: context.l10n.adminSpace,
                              description: context.l10n.adminSpaceDescription,
                              actionLabel: context.l10n.platformControl,
                              onTap: () => context.go(RoutePaths.adminDashboard),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleLaunchCard extends StatelessWidget {
  const _RoleLaunchCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer.withValues(
                    alpha: 0.55,
                  ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              icon,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(description),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: onTap,
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

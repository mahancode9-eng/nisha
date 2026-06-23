import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/customer_login_page.dart';
import '../../features/auth/presentation/customer_register_page.dart';
import '../../features/auth/presentation/customer_recovery_page.dart';
import '../../features/auth/presentation/seller_login_page.dart';
import '../../features/auth/presentation/seller_register_page.dart';
import '../../features/public/presentation/home/public_home_page.dart';
import '../../shared/extensions/build_context_x.dart';
import '../../shared/widgets/appearance_controls.dart';
import '../../shared/widgets/feature_placeholder_page.dart';
import '../../shared/widgets/public_shell.dart';
import '../../shared/widgets/section_card.dart';
import '../../shared/widgets/workspace_shell.dart';
import '../session/app_session.dart';
import '../session/session_controller.dart';
import 'route_paths.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final session = ref.watch(sessionControllerProvider);

  return GoRouter(
    initialLocation: RoutePaths.home,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final location = state.uri.path;

      if (session is SessionLoading) {
        return null;
      }

      if (_isSellerRoute(location)) {
        if (session is SellerSession) {
          return null;
        }
        return '${RoutePaths.sellerLogin}?redirect=${Uri.encodeComponent(location)}';
      }

      if (_isCustomerRoute(location)) {
        if (session is CustomerSession) {
          return null;
        }
        return '${RoutePaths.customerLogin}?redirect=${Uri.encodeComponent(location)}';
      }

      if (_isAdminRoute(location)) {
        if (session is SellerSession && session.isAdmin) {
          return null;
        }
        if (session is SellerSession) {
          return RoutePaths.sellerDashboard;
        }
        if (session is CustomerSession) {
          return RoutePaths.customerDashboard;
        }
        return '${RoutePaths.sellerLogin}?redirect=${Uri.encodeComponent(location)}';
      }

      if (location == RoutePaths.sellerLogin &&
          session is SellerSession) {
        return session.isAdmin
            ? RoutePaths.adminDashboard
            : RoutePaths.sellerDashboard;
      }
      if (location == RoutePaths.customerLogin &&
          session is CustomerSession) {
        return RoutePaths.customerDashboard;
      }

      return null;
    },
    routes: [
      GoRoute(
        path: RoutePaths.home,
        builder: (context, state) => const PublicHomePage(),
      ),
      GoRoute(
        path: RoutePaths.trackOrder,
        builder: (context, state) => PublicShell(
          child: FeaturePlaceholderPage(
            icon: Icons.local_shipping_rounded,
            title: context.l10n.trackOrder,
            subtitle: context.l10n.trackOrderSubtitle,
            primaryActionLabel: context.l10n.backToHome,
            onPrimaryAction: () => context.go(RoutePaths.home),
          ),
        ),
      ),
      GoRoute(
        path: '/store/:slug',
        builder: (context, state) {
          final slug = state.pathParameters['slug'] ?? '';
          return PublicShell(
            child: FeaturePlaceholderPage(
              icon: Icons.store_rounded,
              title: context.l10n.publicSpace,
              subtitle: slug.isEmpty
                  ? context.l10n.publicSpaceDescription
                  : '$slug - ${context.l10n.publicSpaceDescription}',
              primaryActionLabel: context.l10n.backToHome,
              onPrimaryAction: () => context.go(RoutePaths.home),
            ),
          );
        },
      ),
      GoRoute(
        path: '/store/:slug/products/:productId',
        builder: (context, state) {
          final slug = state.pathParameters['slug'] ?? '';
          final productId = state.pathParameters['productId'] ?? '';
          return PublicShell(
            child: FeaturePlaceholderPage(
              icon: Icons.shopping_bag_rounded,
              title: context.l10n.browseCatalog,
              subtitle: [slug, productId]
                  .where((value) => value.isNotEmpty)
                  .join(' - '),
              primaryActionLabel: context.l10n.backToHome,
              onPrimaryAction: () => context.go(RoutePaths.home),
            ),
          );
        },
      ),
      GoRoute(
        path: '/store/:slug/checkout',
        builder: (context, state) => PublicShell(
          child: FeaturePlaceholderPage(
            icon: Icons.shopping_cart_checkout_rounded,
            title: context.l10n.comingSoon,
            subtitle: context.l10n.publicSpaceDescription,
            primaryActionLabel: context.l10n.backToHome,
            onPrimaryAction: () => context.go(RoutePaths.home),
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.invoice,
        builder: (context, state) {
          final invoiceCode = state.pathParameters['invoiceCode'] ?? '';
          return PublicShell(
            child: FeaturePlaceholderPage(
              icon: Icons.receipt_long_rounded,
              title: context.l10n.invoiceCode,
              subtitle: invoiceCode.isEmpty
                  ? context.l10n.publicSpaceDescription
                  : '${context.l10n.invoiceCode}: $invoiceCode',
              primaryActionLabel: context.l10n.backToHome,
              onPrimaryAction: () => context.go(RoutePaths.home),
            ),
          );
        },
      ),
      GoRoute(
        path: RoutePaths.sellerLogin,
        builder: (context, state) => SellerLoginPage(
          redirectPath: state.uri.queryParameters['redirect'],
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerRegister,
        builder: (context, state) => const SellerRegisterPage(),
      ),
      GoRoute(
        path: RoutePaths.customerLogin,
        builder: (context, state) => CustomerLoginPage(
          redirectPath: state.uri.queryParameters['redirect'],
        ),
      ),
      GoRoute(
        path: RoutePaths.customerRegister,
        builder: (context, state) => const CustomerRegisterPage(),
      ),
      GoRoute(
        path: RoutePaths.customerRecover,
        builder: (context, state) => const CustomerRecoveryPage(),
      ),
      GoRoute(
        path: RoutePaths.sellerDashboard,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 0,
          destinations: _sellerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.dashboard_rounded,
            title: context.l10n.dashboard,
            subtitle: context.l10n.sellerSpaceDescription,
            primaryActionLabel: context.l10n.comingSoon,
            onPrimaryAction: null,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerProducts,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 1,
          destinations: _sellerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.inventory_2_rounded,
            title: context.l10n.products,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerOrders,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 2,
          destinations: _sellerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.receipt_rounded,
            title: context.l10n.orders,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerStore,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 3,
          destinations: _sellerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.store_rounded,
            title: context.l10n.store,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerConversations,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 4,
          destinations: _sellerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.forum_rounded,
            title: context.l10n.conversations,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.sellerAppearance,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.sellerSpace,
          currentIndex: 0,
          destinations: _sellerDestinations(context),
          child: const _AppearanceWorkspaceBody(),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerDashboard,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 0,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.dashboard_rounded,
            title: context.l10n.dashboard,
            subtitle: context.l10n.customerSpaceDescription,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerOrders,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 1,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.receipt_rounded,
            title: context.l10n.orders,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerProfile,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 2,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.person_rounded,
            title: context.l10n.profile,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerReviews,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 3,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.star_rounded,
            title: context.l10n.reviews,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerComplaints,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 4,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.report_problem_rounded,
            title: context.l10n.complaints,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerConversations,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 5,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.forum_rounded,
            title: context.l10n.conversations,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerDownloads,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 6,
          destinations: _customerDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.download_rounded,
            title: context.l10n.downloads,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.customerAppearance,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.customerSpace,
          currentIndex: 0,
          destinations: _customerDestinations(context),
          child: const _AppearanceWorkspaceBody(),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminDashboard,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 0,
          destinations: _adminDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.dashboard_rounded,
            title: context.l10n.dashboard,
            subtitle: context.l10n.adminSpaceDescription,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminStores,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 1,
          destinations: _adminDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.store_rounded,
            title: context.l10n.stores,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminOrders,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 2,
          destinations: _adminDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.receipt_long_rounded,
            title: context.l10n.orders,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminReviews,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 3,
          destinations: _adminDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.star_rounded,
            title: context.l10n.reviews,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminChats,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 4,
          destinations: _adminDestinations(context),
          child: FeaturePlaceholderPage(
            icon: Icons.chat_rounded,
            title: context.l10n.chats,
            subtitle: context.l10n.comingSoon,
          ),
        ),
      ),
      GoRoute(
        path: RoutePaths.adminAppearance,
        builder: (context, state) => _workspacePage(
          context: context,
          title: context.l10n.adminSpace,
          currentIndex: 0,
          destinations: _adminDestinations(context),
          child: const _AppearanceWorkspaceBody(),
        ),
      ),
    ],
  );
});

Widget _workspacePage({
  required BuildContext context,
  required String title,
  required int currentIndex,
  required List<WorkspaceDestination> destinations,
  required Widget child,
}) {
  return WorkspaceShell(
    title: title,
    currentIndex: currentIndex,
    destinations: destinations,
    child: child,
  );
}

List<WorkspaceDestination> _sellerDestinations(BuildContext context) {
  return [
    WorkspaceDestination(
      label: context.l10n.dashboard,
      icon: Icons.dashboard_rounded,
      route: RoutePaths.sellerDashboard,
    ),
    WorkspaceDestination(
      label: context.l10n.products,
      icon: Icons.inventory_2_rounded,
      route: RoutePaths.sellerProducts,
    ),
    WorkspaceDestination(
      label: context.l10n.orders,
      icon: Icons.receipt_rounded,
      route: RoutePaths.sellerOrders,
    ),
    WorkspaceDestination(
      label: context.l10n.store,
      icon: Icons.store_rounded,
      route: RoutePaths.sellerStore,
    ),
    WorkspaceDestination(
      label: context.l10n.conversations,
      icon: Icons.forum_rounded,
      route: RoutePaths.sellerConversations,
    ),
  ];
}

List<WorkspaceDestination> _customerDestinations(BuildContext context) {
  return [
    WorkspaceDestination(
      label: context.l10n.dashboard,
      icon: Icons.dashboard_rounded,
      route: RoutePaths.customerDashboard,
    ),
    WorkspaceDestination(
      label: context.l10n.orders,
      icon: Icons.receipt_rounded,
      route: RoutePaths.customerOrders,
    ),
    WorkspaceDestination(
      label: context.l10n.profile,
      icon: Icons.person_rounded,
      route: RoutePaths.customerProfile,
    ),
    WorkspaceDestination(
      label: context.l10n.reviews,
      icon: Icons.star_rounded,
      route: RoutePaths.customerReviews,
    ),
    WorkspaceDestination(
      label: context.l10n.complaints,
      icon: Icons.report_problem_rounded,
      route: RoutePaths.customerComplaints,
    ),
    WorkspaceDestination(
      label: context.l10n.conversations,
      icon: Icons.forum_rounded,
      route: RoutePaths.customerConversations,
    ),
    WorkspaceDestination(
      label: context.l10n.downloads,
      icon: Icons.download_rounded,
      route: RoutePaths.customerDownloads,
    ),
  ];
}

List<WorkspaceDestination> _adminDestinations(BuildContext context) {
  return [
    WorkspaceDestination(
      label: context.l10n.dashboard,
      icon: Icons.dashboard_rounded,
      route: RoutePaths.adminDashboard,
    ),
    WorkspaceDestination(
      label: context.l10n.stores,
      icon: Icons.store_rounded,
      route: RoutePaths.adminStores,
    ),
    WorkspaceDestination(
      label: context.l10n.orders,
      icon: Icons.receipt_long_rounded,
      route: RoutePaths.adminOrders,
    ),
    WorkspaceDestination(
      label: context.l10n.reviews,
      icon: Icons.star_rounded,
      route: RoutePaths.adminReviews,
    ),
    WorkspaceDestination(
      label: context.l10n.chats,
      icon: Icons.chat_rounded,
      route: RoutePaths.adminChats,
    ),
  ];
}

bool _isSellerRoute(String location) => location.startsWith('/seller');

bool _isCustomerRoute(String location) => location.startsWith('/customer');

bool _isAdminRoute(String location) => location.startsWith('/admin');

class _AppearanceWorkspaceBody extends StatelessWidget {
  const _AppearanceWorkspaceBody();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: const SectionCard(
            padding: EdgeInsets.all(24),
            child: AppearanceSection(),
          ),
        ),
      ),
    );
  }
}

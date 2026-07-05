import '../../features/auth/models/auth_models.dart';

sealed class AppSession {
  const AppSession();
}

final class SessionLoading extends AppSession {
  const SessionLoading();
}

final class SessionUnauthenticated extends AppSession {
  const SessionUnauthenticated();
}

final class SellerSession extends AppSession {
  const SellerSession({
    required this.user,
    required this.token,
  });

  final SellerUser user;
  final String token;

  bool get isAdmin => user.role.toUpperCase() == 'ADMIN';
}

final class CustomerSession extends AppSession {
  const CustomerSession({
    required this.customer,
    required this.token,
  });

  final CustomerUser customer;
  final String token;
}

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/models/auth_models.dart';
import 'app_session.dart';
import 'session_storage.dart';

final sessionControllerProvider =
    NotifierProvider<SessionController, AppSession>(SessionController.new);

class SessionController extends Notifier<AppSession> {
  @override
  AppSession build() {
    unawaited(_restore());
    return const SessionLoading();
  }

  Future<void> _restore() async {
    final storage = ref.read(sessionStorageProvider);
    final sellerSession = await storage.readSellerSession();
    if (sellerSession != null) {
      state = sellerSession;
      return;
    }

    final customerSession = await storage.readCustomerSession();
    if (customerSession != null) {
      state = customerSession;
      return;
    }

    state = const SessionUnauthenticated();
  }

  Future<void> signInSeller({
    required String email,
    required String password,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final storage = ref.read(sessionStorageProvider);
    final response = await repository.signInSeller(
      email: email,
      password: password,
    );
    await storage.saveSellerSession(response);
    state = SellerSession(
      user: response.user,
      token: response.accessToken,
    );
  }

  Future<void> signUpSeller({
    required String email,
    required String password,
    required String fullName,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final storage = ref.read(sessionStorageProvider);
    final response = await repository.signUpSeller(
      email: email,
      password: password,
      fullName: fullName,
    );
    await storage.saveSellerSession(response);
    state = SellerSession(
      user: response.user,
      token: response.accessToken,
    );
  }

  Future<void> signInCustomer({
    required String login,
    required String password,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final storage = ref.read(sessionStorageProvider);
    final response = await repository.signInCustomer(
      login: login,
      password: password,
    );
    await storage.saveCustomerSession(response);
    state = CustomerSession(
      customer: response.customer,
      token: response.accessToken,
    );
  }

  Future<void> signUpCustomer({
    String? email,
    String? phone,
    String? postalCode,
    required String password,
    required String fullName,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final storage = ref.read(sessionStorageProvider);
    final response = await repository.signUpCustomer(
      email: email,
      phone: phone,
      postalCode: postalCode,
      password: password,
      fullName: fullName,
    );
    await storage.saveCustomerSession(response);
    state = CustomerSession(
      customer: response.customer,
      token: response.accessToken,
    );
  }

  Future<void> signOut() async {
    final storage = ref.read(sessionStorageProvider);
    await storage.clearAll();
    state = const SessionUnauthenticated();
  }

  Future<CustomerRecoveryStartResponse> requestRecovery({
    required String login,
    required RecoveryChannel channel,
  }) {
    final repository = ref.read(authRepositoryProvider);
    return repository.requestCustomerRecovery(
      login: login,
      channel: channel,
    );
  }

  Future<CustomerRecoveryVerifyResponse> verifyRecovery({
    required int recoveryId,
    required String code,
    required String newPassword,
  }) async {
    final repository = ref.read(authRepositoryProvider);
    final storage = ref.read(sessionStorageProvider);
    final response = await repository.verifyCustomerRecovery(
      recoveryId: recoveryId,
      code: code,
      newPassword: newPassword,
    );
    await storage.saveCustomerSession(
      CustomerTokenResponse(
        accessToken: response.accessToken,
        tokenType: response.tokenType,
        customer: response.customer,
      ),
    );
    state = CustomerSession(
      customer: response.customer,
      token: response.accessToken,
    );
    return response;
  }
}

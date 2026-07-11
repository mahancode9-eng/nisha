import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../models/auth_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

class AuthRepository {
  AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<SellerTokenResponse> signInSeller({
    required String email,
    required String password,
  }) {
    return _apiClient.post(
      '/auth/login',
      (data) => SellerTokenResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'email': email,
        'password': password,
      },
    );
  }

  Future<SellerTokenResponse> signUpSeller({
    required String email,
    required String password,
    required String fullName,
  }) {
    return _apiClient.post(
      '/auth/register',
      (data) => SellerTokenResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'email': email,
        'password': password,
        'full_name': fullName,
      },
    );
  }

  Future<CustomerTokenResponse> signInCustomer({
    required String login,
    required String password,
  }) {
    return _apiClient.post(
      '/customer/login',
      (data) => CustomerTokenResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'login': login,
        'password': password,
      },
    );
  }

  Future<CustomerTokenResponse> signUpCustomer({
    String? email,
    String? phone,
    String? postalCode,
    required String password,
    required String fullName,
  }) {
    return _apiClient.post(
      '/customer/register',
      (data) => CustomerTokenResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'email': email,
        'phone': phone,
        'postal_code': postalCode,
        'password': password,
        'full_name': fullName,
      },
    );
  }

  Future<CustomerRecoveryStartResponse> requestCustomerRecovery({
    required String login,
    required RecoveryChannel channel,
  }) {
    return _apiClient.post(
      '/customer/password-recovery/request',
      (data) => CustomerRecoveryStartResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'login': login,
        'channel': channel.apiValue,
      },
    );
  }

  Future<CustomerRecoveryVerifyResponse> verifyCustomerRecovery({
    required int recoveryId,
    required String code,
    required String newPassword,
  }) {
    return _apiClient.post(
      '/customer/password-recovery/verify',
      (data) => CustomerRecoveryVerifyResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'recovery_id': recoveryId,
        'code': code,
        'new_password': newPassword,
      },
    );
  }

  Future<void> verifyEmail({
    required String token,
    required String kind,
  }) {
    return _apiClient.post(
      '/public/verify-email',
      (_) {},
      data: <String, dynamic>{'token': token, 'kind': kind},
    );
  }

  Future<void> resendVerificationEmail({
    required String email,
    required String kind,
  }) {
    return _apiClient.post(
      '/public/verify-email/resend',
      (_) {},
      data: <String, dynamic>{'email': email, 'kind': kind},
    );
  }

  Future<SellerRecoveryStartResponse> requestSellerRecovery({
    required String email,
  }) {
    return _apiClient.post(
      '/auth/password-recovery/request',
      (data) => SellerRecoveryStartResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{'email': email},
    );
  }

  Future<SellerTokenResponse> verifySellerRecovery({
    required int recoveryId,
    required String code,
    required String newPassword,
  }) {
    return _apiClient.post(
      '/auth/password-recovery/verify',
      (data) => SellerTokenResponse.fromJson(_asJsonMap(data)),
      data: <String, dynamic>{
        'recovery_id': recoveryId,
        'code': code,
        'new_password': newPassword,
      },
    );
  }

  Map<String, dynamic> _asJsonMap(Object? data) {
    if (data is Map<String, dynamic>) {
      return data;
    }
    if (data is Map) {
      return data.cast<String, dynamic>();
    }
    return <String, dynamic>{};
  }
}

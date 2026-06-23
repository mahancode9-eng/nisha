import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/models/auth_models.dart';
import 'app_session.dart';

final sessionStorageProvider = Provider<SessionStorage>((ref) {
  return SessionStorage(const FlutterSecureStorage());
});

class SessionStorage {
  const SessionStorage(this._storage);

  static const String sellerTokenKey = 'nisha_access_token';
  static const String sellerUserKey = 'nisha_user';
  static const String customerTokenKey = 'nisha_customer_token';
  static const String customerUserKey = 'nisha_customer';

  final FlutterSecureStorage _storage;

  Future<SellerSession?> readSellerSession() async {
    final token = await _storage.read(key: sellerTokenKey);
    final rawUser = await _storage.read(key: sellerUserKey);
    if (token == null || rawUser == null) {
      return null;
    }
    return SellerSession(
      token: token,
      user: SellerUser.fromJson(
        jsonDecode(rawUser) as Map<String, dynamic>,
      ),
    );
  }

  Future<CustomerSession?> readCustomerSession() async {
    final token = await _storage.read(key: customerTokenKey);
    final rawUser = await _storage.read(key: customerUserKey);
    if (token == null || rawUser == null) {
      return null;
    }
    return CustomerSession(
      token: token,
      customer: CustomerUser.fromJson(
        jsonDecode(rawUser) as Map<String, dynamic>,
      ),
    );
  }

  Future<void> saveSellerSession(SellerTokenResponse response) async {
    await _storage.write(key: sellerTokenKey, value: response.accessToken);
    await _storage.write(
      key: sellerUserKey,
      value: jsonEncode(response.user.toJson()),
    );
  }

  Future<void> saveCustomerSession(CustomerTokenResponse response) async {
    await _storage.write(key: customerTokenKey, value: response.accessToken);
    await _storage.write(
      key: customerUserKey,
      value: jsonEncode(response.customer.toJson()),
    );
  }

  Future<void> clearAll() async {
    await _storage.delete(key: sellerTokenKey);
    await _storage.delete(key: sellerUserKey);
    await _storage.delete(key: customerTokenKey);
    await _storage.delete(key: customerUserKey);
  }
}

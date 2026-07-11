enum RecoveryChannel {
  email('EMAIL'),
  sms('SMS');

  const RecoveryChannel(this.apiValue);

  final String apiValue;

  static RecoveryChannel fromApiValue(String value) {
    return value.toUpperCase() == 'SMS' ? RecoveryChannel.sms : RecoveryChannel.email;
  }
}

class SellerUser {
  const SellerUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    this.storeSlug,
  });

  final int id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final String? storeSlug;

  factory SellerUser.fromJson(Map<String, dynamic> json) {
    return SellerUser(
      id: (json['id'] as num).toInt(),
      email: (json['email'] ?? '') as String,
      fullName: (json['full_name'] ?? '') as String,
      role: (json['role'] ?? 'SELLER') as String,
      isActive: json['is_active'] as bool? ?? true,
      storeSlug: json['store_slug'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'full_name': fullName,
      'role': role,
      'is_active': isActive,
      'store_slug': storeSlug,
    };
  }
}

class CustomerUser {
  const CustomerUser({
    required this.id,
    this.email,
    this.phone,
    this.postalCode,
    required this.fullName,
  });

  final int id;
  final String? email;
  final String? phone;
  final String? postalCode;
  final String fullName;

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: (json['id'] as num).toInt(),
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      postalCode: json['postal_code'] as String?,
      fullName: (json['full_name'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'phone': phone,
      'postal_code': postalCode,
      'full_name': fullName,
    };
  }
}

class SellerTokenResponse {
  const SellerTokenResponse({
    required this.accessToken,
    required this.tokenType,
    required this.user,
    this.needsEmailVerification = false,
    this.email,
  });

  final String accessToken;
  final String tokenType;
  final SellerUser user;
  final bool needsEmailVerification;
  final String? email;

  factory SellerTokenResponse.fromJson(Map<String, dynamic> json) {
    return SellerTokenResponse(
      accessToken: (json['access_token'] ?? '') as String,
      tokenType: (json['token_type'] ?? 'bearer') as String,
      user: SellerUser.fromJson(
        (json['user'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      ),
      needsEmailVerification: json['needs_email_verification'] as bool? ?? false,
      email: json['email'] as String?,
    );
  }
}

class CustomerTokenResponse {
  const CustomerTokenResponse({
    required this.accessToken,
    required this.tokenType,
    required this.customer,
    this.needsEmailVerification = false,
    this.email,
  });

  final String accessToken;
  final String tokenType;
  final CustomerUser customer;
  final bool needsEmailVerification;
  final String? email;

  factory CustomerTokenResponse.fromJson(Map<String, dynamic> json) {
    return CustomerTokenResponse(
      accessToken: (json['access_token'] ?? '') as String,
      tokenType: (json['token_type'] ?? 'bearer') as String,
      customer: CustomerUser.fromJson(
        (json['customer'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      ),
      needsEmailVerification: json['needs_email_verification'] as bool? ?? false,
      email: json['email'] as String?,
    );
  }
}

class CustomerRecoveryStartResponse {
  const CustomerRecoveryStartResponse({
    required this.recoveryId,
    required this.channel,
    required this.expiresAt,
    this.deliveryHint,
    this.debugCode,
  });

  final int recoveryId;
  final RecoveryChannel channel;
  final DateTime expiresAt;
  final String? deliveryHint;
  final String? debugCode;

  factory CustomerRecoveryStartResponse.fromJson(Map<String, dynamic> json) {
    return CustomerRecoveryStartResponse(
      recoveryId: (json['recovery_id'] as num).toInt(),
      channel: RecoveryChannel.fromApiValue((json['channel'] ?? 'EMAIL') as String),
      expiresAt: DateTime.parse((json['expires_at'] ?? DateTime.now().toIso8601String()) as String),
      deliveryHint: json['delivery_hint'] as String?,
      debugCode: json['debug_code'] as String?,
    );
  }
}

class CustomerRecoveryVerifyResponse {
  const CustomerRecoveryVerifyResponse({
    required this.accessToken,
    required this.tokenType,
    required this.customer,
  });

  final String accessToken;
  final String tokenType;
  final CustomerUser customer;

  factory CustomerRecoveryVerifyResponse.fromJson(Map<String, dynamic> json) {
    return CustomerRecoveryVerifyResponse(
      accessToken: (json['access_token'] ?? '') as String,
      tokenType: (json['token_type'] ?? 'bearer') as String,
      customer: CustomerUser.fromJson(
        (json['customer'] as Map<String, dynamic>? ?? const <String, dynamic>{}),
      ),
    );
  }
}

class SellerRecoveryStartResponse {
  const SellerRecoveryStartResponse({
    required this.recoveryId,
    required this.expiresAt,
    this.deliveryHint,
    this.debugCode,
  });

  final int recoveryId;
  final DateTime expiresAt;
  final String? deliveryHint;
  final String? debugCode;

  factory SellerRecoveryStartResponse.fromJson(Map<String, dynamic> json) {
    return SellerRecoveryStartResponse(
      recoveryId: (json['recovery_id'] as num).toInt(),
      expiresAt: DateTime.parse((json['expires_at'] ?? DateTime.now().toIso8601String()) as String),
      deliveryHint: json['delivery_hint'] as String?,
      debugCode: json['debug_code'] as String?,
    );
  }
}

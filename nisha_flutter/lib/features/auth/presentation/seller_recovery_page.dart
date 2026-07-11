import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/session_controller.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class SellerRecoveryPage extends ConsumerStatefulWidget {
  const SellerRecoveryPage({super.key});

  @override
  ConsumerState<SellerRecoveryPage> createState() => _SellerRecoveryPageState();
}

class _SellerRecoveryPageState extends ConsumerState<SellerRecoveryPage> {
  final _requestFormKey = GlobalKey<FormState>();
  final _verifyFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  int? _recoveryId;
  String? _deliveryHint;
  String? _debugCode;
  bool _requesting = false;
  bool _verifying = false;

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: 'Recover seller password',
      subtitle: 'We will email you a recovery code.',
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_recoveryId == null)
              Form(
                key: _requestFormKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: context.l10n.email,
                        prefixIcon: const Icon(Icons.email_rounded),
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _requesting ? null : _requestCode,
                      child: _requesting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(context.l10n.requestRecovery),
                    ),
                  ],
                ),
              )
            else
              Form(
                key: _verifyFormKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _codeController,
                      decoration: InputDecoration(
                        labelText: context.l10n.recoveryCode,
                        prefixIcon: const Icon(Icons.pin_rounded),
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _newPasswordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: context.l10n.newPassword,
                        prefixIcon: const Icon(Icons.lock_rounded),
                      ),
                      validator: (value) =>
                          value == null || value.length < 8 ? 'Min 8 chars' : null,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _verifying ? null : _verifyCode,
                      child: _verifying
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(context.l10n.verifyRecovery),
                    ),
                    if (_deliveryHint != null) ...[
                      const SizedBox(height: 12),
                      Text('Delivery hint: $_deliveryHint'),
                    ],
                    if (_debugCode != null) ...[
                      const SizedBox(height: 8),
                      Text('Dev code: $_debugCode'),
                    ],
                  ],
                ),
              ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go(RoutePaths.sellerLogin),
              child: Text(context.l10n.signInButton),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _requestCode() async {
    if (!_requestFormKey.currentState!.validate()) return;
    setState(() => _requesting = true);
    try {
      final response = await ref
          .read(sessionControllerProvider.notifier)
          .requestSellerRecovery(email: _emailController.text.trim());
      setState(() {
        _recoveryId = response.recoveryId;
        _deliveryHint = response.deliveryHint;
        _debugCode = response.debugCode;
      });
    } on ApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _requesting = false);
    }
  }

  Future<void> _verifyCode() async {
    if (!_verifyFormKey.currentState!.validate() || _recoveryId == null) return;
    setState(() => _verifying = true);
    try {
      await ref.read(sessionControllerProvider.notifier).verifySellerRecovery(
            recoveryId: _recoveryId!,
            code: _codeController.text.trim(),
            newPassword: _newPasswordController.text,
          );
      if (!mounted) return;
      context.go(RoutePaths.sellerDashboard);
    } on ApiException catch (error) {
      _showMessage(error.message);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

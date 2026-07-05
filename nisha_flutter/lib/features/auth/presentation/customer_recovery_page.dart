import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/session_controller.dart';
import '../models/auth_models.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class CustomerRecoveryPage extends ConsumerStatefulWidget {
  const CustomerRecoveryPage({super.key});

  @override
  ConsumerState<CustomerRecoveryPage> createState() =>
      _CustomerRecoveryPageState();
}

class _CustomerRecoveryPageState extends ConsumerState<CustomerRecoveryPage> {
  final _requestFormKey = GlobalKey<FormState>();
  final _verifyFormKey = GlobalKey<FormState>();
  final _loginController = TextEditingController();
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  RecoveryChannel _channel = RecoveryChannel.email;
  int? _recoveryId;
  String? _deliveryHint;
  String? _debugCode;
  bool _requesting = false;
  bool _verifying = false;

  @override
  void dispose() {
    _loginController.dispose();
    _codeController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: context.l10n.customerRecoverTitle,
      subtitle: context.l10n.customerRecoverSubtitle,
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_recoveryId == null) ...[
              Form(
                key: _requestFormKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _loginController,
                      decoration: InputDecoration(
                        labelText: context.l10n.phoneOrEmail,
                        hintText: context.l10n.loginIdentifierHint,
                        prefixIcon: const Icon(Icons.person_rounded),
                      ),
                      validator: (value) => _requiredValidator(
                        context,
                        value,
                        context.l10n.phoneOrEmail,
                      ),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<RecoveryChannel>(
                      initialValue: _channel,
                      decoration: InputDecoration(
                        labelText: context.l10n.recoveryChannel,
                        prefixIcon: const Icon(Icons.swap_horiz_rounded),
                      ),
                      items: [
                        DropdownMenuItem(
                          value: RecoveryChannel.email,
                          child: Text(context.l10n.channelEmail),
                        ),
                        DropdownMenuItem(
                          value: RecoveryChannel.sms,
                          child: Text(context.l10n.channelSms),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _channel = value;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 22),
                    FilledButton(
                      onPressed: _requesting ? null : _requestRecovery,
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
              ),
            ] else ...[
              _RecoverySummary(
                recoveryId: _recoveryId!,
                deliveryHint: _deliveryHint,
                debugCode: _debugCode,
              ),
              const SizedBox(height: 18),
              Form(
                key: _verifyFormKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _codeController,
                      decoration: InputDecoration(
                        labelText: context.l10n.recoveryCode,
                        prefixIcon: const Icon(Icons.pin_rounded),
                      ),
                      validator: (value) => _requiredValidator(
                        context,
                        value,
                        context.l10n.recoveryCode,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _newPasswordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: context.l10n.newPassword,
                        hintText: context.l10n.passwordHint,
                        prefixIcon: const Icon(Icons.lock_rounded),
                      ),
                      validator: (value) => _requiredValidator(
                        context,
                        value,
                        context.l10n.newPassword,
                      ),
                    ),
                    const SizedBox(height: 22),
                    FilledButton(
                      onPressed: _verifying ? null : _verifyRecovery,
                      child: _verifying
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(context.l10n.verifyRecovery),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _resetFlow,
                      child: Text(context.l10n.requestRecovery),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go(RoutePaths.customerLogin),
              child: Text(context.l10n.signInButton),
            ),
            TextButton(
              onPressed: () => context.go(RoutePaths.home),
              child: Text(context.l10n.backToHome),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _requestRecovery() async {
    if (!_requestFormKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _requesting = true;
    });

    try {
      final response = await ref.read(sessionControllerProvider.notifier).requestRecovery(
            login: _loginController.text.trim(),
            channel: _channel,
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _recoveryId = response.recoveryId;
        _deliveryHint = response.deliveryHint;
        _debugCode = response.debugCode;
      });
      _showMessage(context.l10n.recoveryRequested);
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _requesting = false;
        });
      }
    }
  }

  Future<void> _verifyRecovery() async {
    if (!_verifyFormKey.currentState!.validate() || _recoveryId == null) {
      return;
    }

    setState(() {
      _verifying = true;
    });

    try {
      await ref.read(sessionControllerProvider.notifier).verifyRecovery(
            recoveryId: _recoveryId!,
            code: _codeController.text.trim(),
            newPassword: _newPasswordController.text,
          );
      if (!mounted) {
        return;
      }
      _showMessage(context.l10n.recoveryVerified);
      context.go(RoutePaths.customerDashboard);
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _verifying = false;
        });
      }
    }
  }

  void _resetFlow() {
    setState(() {
      _recoveryId = null;
      _deliveryHint = null;
      _debugCode = null;
      _requesting = false;
      _verifying = false;
      _codeController.clear();
      _newPasswordController.clear();
    });
  }

  String? _requiredValidator(
    BuildContext context,
    String? value,
    String fieldName,
  ) {
    if (value == null || value.trim().isEmpty) {
      return context.l10n.fieldRequired(fieldName);
    }
    return null;
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _RecoverySummary extends StatelessWidget {
  const _RecoverySummary({
    required this.recoveryId,
    this.deliveryHint,
    this.debugCode,
  });

  final int recoveryId;
  final String? deliveryHint;
  final String? debugCode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${context.l10n.recoveryId}: $recoveryId',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          if (deliveryHint != null) ...[
            const SizedBox(height: 8),
            Text(deliveryHint!),
          ],
          if (debugCode != null) ...[
            const SizedBox(height: 8),
            SelectableText('${context.l10n.recoveryCode}: $debugCode'),
          ],
        ],
      ),
    );
  }
}

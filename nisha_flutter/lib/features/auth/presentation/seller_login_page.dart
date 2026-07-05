import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/app_session.dart';
import '../../../core/session/session_controller.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class SellerLoginPage extends ConsumerStatefulWidget {
  const SellerLoginPage({super.key, this.redirectPath});

  final String? redirectPath;

  @override
  ConsumerState<SellerLoginPage> createState() => _SellerLoginPageState();
}

class _SellerLoginPageState extends ConsumerState<SellerLoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: context.l10n.sellerLoginTitle,
      subtitle: context.l10n.sellerLoginSubtitle,
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: context.l10n.email,
                  hintText: context.l10n.emailHint,
                  prefixIcon: const Icon(Icons.email_rounded),
                ),
                validator: (value) => _requiredValidator(
                  context,
                  value,
                  context.l10n.email,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: context.l10n.password,
                  hintText: context.l10n.passwordHint,
                  prefixIcon: const Icon(Icons.lock_rounded),
                ),
                validator: (value) => _requiredValidator(
                  context,
                  value,
                  context.l10n.password,
                ),
              ),
              const SizedBox(height: 22),
              FilledButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.signInButton),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go(RoutePaths.sellerRegister),
                child: Text(context.l10n.createAccountButton),
              ),
              TextButton(
                onPressed: () => context.go(RoutePaths.home),
                child: Text(context.l10n.backToHome),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      await ref.read(sessionControllerProvider.notifier).signInSeller(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );

      if (!mounted) {
        return;
      }

      final session = ref.read(sessionControllerProvider);
      if (widget.redirectPath != null && widget.redirectPath!.isNotEmpty) {
        context.go(widget.redirectPath!);
      } else if (session is SellerSession && session.isAdmin) {
        context.go(RoutePaths.adminDashboard);
      } else {
        context.go(RoutePaths.sellerDashboard);
      }
    } on ApiException catch (error) {
      _showMessage(error.message);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
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

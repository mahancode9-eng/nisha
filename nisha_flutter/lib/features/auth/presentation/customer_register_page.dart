import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/session_controller.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class CustomerRegisterPage extends ConsumerStatefulWidget {
  const CustomerRegisterPage({super.key});

  @override
  ConsumerState<CustomerRegisterPage> createState() =>
      _CustomerRegisterPageState();
}

class _CustomerRegisterPageState extends ConsumerState<CustomerRegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _postalCodeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: context.l10n.customerRegisterTitle,
      subtitle: context.l10n.customerRegisterSubtitle,
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _fullNameController,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.l10n.fullName,
                  hintText: context.l10n.fullNameHint,
                  prefixIcon: const Icon(Icons.badge_rounded),
                ),
                validator: (value) => _requiredValidator(
                  context,
                  value,
                  context.l10n.fullName,
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.l10n.email,
                  hintText: context.l10n.emailHint,
                  prefixIcon: const Icon(Icons.email_rounded),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.l10n.phone,
                  hintText: context.l10n.phoneOrEmail,
                  prefixIcon: const Icon(Icons.phone_rounded),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _postalCodeController,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.l10n.postalCodeHint,
                  hintText: context.l10n.postalCodeHint,
                  prefixIcon: const Icon(Icons.local_post_office_rounded),
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
                    : Text(context.l10n.createAccountButton),
              ),
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
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    if (email.isEmpty && phone.isEmpty) {
      _showMessage(context.l10n.loginIdentifierHint);
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      final pendingEmail = await ref.read(sessionControllerProvider.notifier).signUpCustomer(
            email: email.isEmpty ? null : email,
            phone: phone.isEmpty ? null : phone,
            postalCode: _postalCodeController.text.trim().isEmpty
                ? null
                : _postalCodeController.text.trim(),
            password: _passwordController.text,
            fullName: _fullNameController.text.trim(),
          );
      if (!mounted) {
        return;
      }
      if (pendingEmail != null) {
        context.go(
          '${RoutePaths.verifyEmail}/pending?email=${Uri.encodeComponent(pendingEmail)}&kind=customer',
        );
        return;
      }
      context.go(RoutePaths.customerDashboard);
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

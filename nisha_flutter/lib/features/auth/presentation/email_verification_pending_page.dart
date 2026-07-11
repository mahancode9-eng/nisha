import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/session_controller.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class EmailVerificationPendingPage extends ConsumerStatefulWidget {
  const EmailVerificationPendingPage({
    super.key,
    required this.email,
    required this.kind,
    required this.loginPath,
  });

  final String email;
  final String kind;
  final String loginPath;

  @override
  ConsumerState<EmailVerificationPendingPage> createState() =>
      _EmailVerificationPendingPageState();
}

class _EmailVerificationPendingPageState
    extends ConsumerState<EmailVerificationPendingPage> {
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      title: 'Verify your email',
      subtitle: 'We sent a confirmation link to ${widget.email}.',
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton(
              onPressed: _sending ? null : _resend,
              child: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Resend verification email'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.go(widget.loginPath),
              child: Text(context.l10n.signInButton),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _resend() async {
    setState(() => _sending = true);
    try {
      await ref.read(sessionControllerProvider.notifier).resendVerificationEmail(
            email: widget.email,
            kind: widget.kind,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification email sent again.')),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}

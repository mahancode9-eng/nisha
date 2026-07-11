import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/api_exception.dart';
import '../../../core/router/route_paths.dart';
import '../../../core/session/session_controller.dart';
import '../../../shared/extensions/build_context_x.dart';
import '../../../shared/widgets/auth_shell.dart';
import '../../../shared/widgets/section_card.dart';

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({
    super.key,
    required this.token,
    required this.kind,
  });

  final String token;
  final String kind;

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  late Future<void> _verification;

  @override
  void initState() {
    super.initState();
    _verification = _runVerification();
  }

  Future<void> _runVerification() {
    return ref.read(sessionControllerProvider.notifier).verifyEmail(
          token: widget.token,
          kind: widget.kind,
        );
  }

  @override
  Widget build(BuildContext context) {
    final loginPath =
        widget.kind == 'seller' ? RoutePaths.sellerLogin : RoutePaths.customerLogin;

    return AuthShell(
      title: 'Email verification',
      subtitle: 'Confirming your email address...',
      child: SectionCard(
        padding: const EdgeInsets.all(24),
        child: FutureBuilder<void>(
          future: _verification,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              final message = snapshot.error is ApiException
                  ? (snapshot.error! as ApiException).message
                  : 'Verification failed.';
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(message),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => context.go(loginPath),
                    child: Text(context.l10n.signInButton),
                  ),
                ],
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Your email has been verified.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go(loginPath),
                  child: Text(context.l10n.signInButton),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

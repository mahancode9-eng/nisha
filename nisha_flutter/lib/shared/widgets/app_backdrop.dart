import 'package:flutter/material.dart';

class AppBackdrop extends StatelessWidget {
  const AppBackdrop({
    super.key,
    required this.child,
    this.topPadding = 28,
  });

  final Widget child;
  final double topPadding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.surface,
            theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: theme.brightness == Brightness.dark ? 0.52 : 0.72,
            ),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -90,
            left: theme.brightness == Brightness.dark ? -80 : null,
            right: theme.brightness == Brightness.dark ? null : -80,
            child: _Glow(
              color: theme.colorScheme.primary.withValues(alpha: 0.18),
              size: 220,
            ),
          ),
          Positioned(
            bottom: -100,
            left: theme.brightness == Brightness.dark ? null : -100,
            right: theme.brightness == Brightness.dark ? -100 : null,
            child: _Glow(
              color: theme.colorScheme.secondary.withValues(alpha: 0.14),
              size: 260,
            ),
          ),
          Padding(
            padding: EdgeInsets.only(top: topPadding),
            child: child,
          ),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({
    required this.color,
    required this.size,
  });

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
      ),
    );
  }
}

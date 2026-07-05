import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class AppBrandMark extends StatelessWidget {
  const AppBrandMark({super.key, this.size = 40});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.purple, AppColors.purpleDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size * 0.32),
        boxShadow: const [
          BoxShadow(
            color: Color(0x331B102C),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: const Center(
        child: Text(
          'ن',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            letterSpacing: -1,
          ),
        ),
      ),
    );
  }
}

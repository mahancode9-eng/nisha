import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';

extension BuildContextX on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);

  bool get isRtl => Directionality.of(this) == TextDirection.rtl;
}

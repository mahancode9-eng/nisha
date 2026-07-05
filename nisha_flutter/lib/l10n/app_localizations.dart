import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fa.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fa'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Nisha'**
  String get appTitle;

  /// No description provided for @appSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Purple-black commerce platform'**
  String get appSubtitle;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @theme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get theme;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @languagePersian.
  ///
  /// In en, this message translates to:
  /// **'Persian'**
  String get languagePersian;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @publicHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get publicHome;

  /// No description provided for @trackOrder.
  ///
  /// In en, this message translates to:
  /// **'Track order'**
  String get trackOrder;

  /// No description provided for @trackOrderSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Check a guest order by invoice code and password.'**
  String get trackOrderSubtitle;

  /// No description provided for @loginSeller.
  ///
  /// In en, this message translates to:
  /// **'Seller login'**
  String get loginSeller;

  /// No description provided for @loginCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer login'**
  String get loginCustomer;

  /// No description provided for @registerSeller.
  ///
  /// In en, this message translates to:
  /// **'Seller register'**
  String get registerSeller;

  /// No description provided for @registerCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer register'**
  String get registerCustomer;

  /// No description provided for @recoverAccount.
  ///
  /// In en, this message translates to:
  /// **'Recover account'**
  String get recoverAccount;

  /// No description provided for @appearance.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get appearance;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get signUp;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @phoneOrEmail.
  ///
  /// In en, this message translates to:
  /// **'Phone or email'**
  String get phoneOrEmail;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @invoiceCode.
  ///
  /// In en, this message translates to:
  /// **'Invoice code'**
  String get invoiceCode;

  /// No description provided for @storeSlug.
  ///
  /// In en, this message translates to:
  /// **'Store slug'**
  String get storeSlug;

  /// No description provided for @buyerName.
  ///
  /// In en, this message translates to:
  /// **'Buyer name'**
  String get buyerName;

  /// No description provided for @buyerPhone.
  ///
  /// In en, this message translates to:
  /// **'Buyer phone'**
  String get buyerPhone;

  /// No description provided for @buyerAddress.
  ///
  /// In en, this message translates to:
  /// **'Buyer address'**
  String get buyerAddress;

  /// No description provided for @heroTitle.
  ///
  /// In en, this message translates to:
  /// **'A storefront built for every role'**
  String get heroTitle;

  /// No description provided for @heroSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Browse, sell, manage, and support from one Persian-first experience.'**
  String get heroSubtitle;

  /// No description provided for @openSellerSpace.
  ///
  /// In en, this message translates to:
  /// **'Open seller space'**
  String get openSellerSpace;

  /// No description provided for @openCustomerSpace.
  ///
  /// In en, this message translates to:
  /// **'Open customer space'**
  String get openCustomerSpace;

  /// No description provided for @openAdminSpace.
  ///
  /// In en, this message translates to:
  /// **'Open admin space'**
  String get openAdminSpace;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get quickActions;

  /// No description provided for @featuredAreas.
  ///
  /// In en, this message translates to:
  /// **'Featured areas'**
  String get featuredAreas;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get welcomeBack;

  /// No description provided for @themeModeLabel.
  ///
  /// In en, this message translates to:
  /// **'Theme mode'**
  String get themeModeLabel;

  /// No description provided for @appLanguageLabel.
  ///
  /// In en, this message translates to:
  /// **'App language'**
  String get appLanguageLabel;

  /// No description provided for @guestMode.
  ///
  /// In en, this message translates to:
  /// **'Guest mode'**
  String get guestMode;

  /// No description provided for @sellerSpace.
  ///
  /// In en, this message translates to:
  /// **'Seller space'**
  String get sellerSpace;

  /// No description provided for @customerSpace.
  ///
  /// In en, this message translates to:
  /// **'Customer space'**
  String get customerSpace;

  /// No description provided for @adminSpace.
  ///
  /// In en, this message translates to:
  /// **'Admin space'**
  String get adminSpace;

  /// No description provided for @publicSpace.
  ///
  /// In en, this message translates to:
  /// **'Public space'**
  String get publicSpace;

  /// No description provided for @publicSpaceDescription.
  ///
  /// In en, this message translates to:
  /// **'Browse stores, products, checkout, and invoice tools.'**
  String get publicSpaceDescription;

  /// No description provided for @sellerSpaceDescription.
  ///
  /// In en, this message translates to:
  /// **'Manage products, orders, payment methods, and chats.'**
  String get sellerSpaceDescription;

  /// No description provided for @customerSpaceDescription.
  ///
  /// In en, this message translates to:
  /// **'Review orders, profile data, complaints, and downloads.'**
  String get customerSpaceDescription;

  /// No description provided for @adminSpaceDescription.
  ///
  /// In en, this message translates to:
  /// **'Moderate stores, orders, reviews, and chat rooms.'**
  String get adminSpaceDescription;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @products.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get products;

  /// No description provided for @orders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get orders;

  /// No description provided for @store.
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get store;

  /// No description provided for @paymentMethods.
  ///
  /// In en, this message translates to:
  /// **'Payment methods'**
  String get paymentMethods;

  /// No description provided for @conversations.
  ///
  /// In en, this message translates to:
  /// **'Conversations'**
  String get conversations;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @reviews.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviews;

  /// No description provided for @complaints.
  ///
  /// In en, this message translates to:
  /// **'Complaints'**
  String get complaints;

  /// No description provided for @downloads.
  ///
  /// In en, this message translates to:
  /// **'Downloads'**
  String get downloads;

  /// No description provided for @chats.
  ///
  /// In en, this message translates to:
  /// **'Chats'**
  String get chats;

  /// No description provided for @stores.
  ///
  /// In en, this message translates to:
  /// **'Stores'**
  String get stores;

  /// No description provided for @appearanceSectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get appearanceSectionTitle;

  /// No description provided for @appearanceSectionDescription.
  ///
  /// In en, this message translates to:
  /// **'Control theme and language for the whole app.'**
  String get appearanceSectionDescription;

  /// No description provided for @system.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get system;

  /// No description provided for @light.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get light;

  /// No description provided for @dark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get dark;

  /// No description provided for @sellerLoginTitle.
  ///
  /// In en, this message translates to:
  /// **'Seller portal'**
  String get sellerLoginTitle;

  /// No description provided for @sellerLoginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to manage your store and workflow.'**
  String get sellerLoginSubtitle;

  /// No description provided for @sellerRegisterTitle.
  ///
  /// In en, this message translates to:
  /// **'Create a seller account'**
  String get sellerRegisterTitle;

  /// No description provided for @sellerRegisterSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Start a new seller workspace for Nisha.'**
  String get sellerRegisterSubtitle;

  /// No description provided for @customerLoginTitle.
  ///
  /// In en, this message translates to:
  /// **'Customer portal'**
  String get customerLoginTitle;

  /// No description provided for @customerLoginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to track orders and manage your profile.'**
  String get customerLoginSubtitle;

  /// No description provided for @customerRegisterTitle.
  ///
  /// In en, this message translates to:
  /// **'Create a customer account'**
  String get customerRegisterTitle;

  /// No description provided for @customerRegisterSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Save your orders, addresses, and conversations.'**
  String get customerRegisterSubtitle;

  /// No description provided for @customerRecoverTitle.
  ///
  /// In en, this message translates to:
  /// **'Recover your account'**
  String get customerRecoverTitle;

  /// No description provided for @customerRecoverSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Request a code and reset your password safely.'**
  String get customerRecoverSubtitle;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'name@example.com'**
  String get emailHint;

  /// No description provided for @loginIdentifierHint.
  ///
  /// In en, this message translates to:
  /// **'Phone number or email'**
  String get loginIdentifierHint;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get passwordHint;

  /// No description provided for @fullNameHint.
  ///
  /// In en, this message translates to:
  /// **'Type your full name'**
  String get fullNameHint;

  /// No description provided for @postalCodeHint.
  ///
  /// In en, this message translates to:
  /// **'Postal code'**
  String get postalCodeHint;

  /// No description provided for @recoveryChannel.
  ///
  /// In en, this message translates to:
  /// **'Recovery channel'**
  String get recoveryChannel;

  /// No description provided for @channelEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get channelEmail;

  /// No description provided for @channelSms.
  ///
  /// In en, this message translates to:
  /// **'SMS'**
  String get channelSms;

  /// No description provided for @recoveryId.
  ///
  /// In en, this message translates to:
  /// **'Recovery ID'**
  String get recoveryId;

  /// No description provided for @recoveryCode.
  ///
  /// In en, this message translates to:
  /// **'Recovery code'**
  String get recoveryCode;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get newPassword;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @requestRecovery.
  ///
  /// In en, this message translates to:
  /// **'Request code'**
  String get requestRecovery;

  /// No description provided for @verifyRecovery.
  ///
  /// In en, this message translates to:
  /// **'Verify code'**
  String get verifyRecovery;

  /// No description provided for @backToHome.
  ///
  /// In en, this message translates to:
  /// **'Back to home'**
  String get backToHome;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @signInButton.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signInButton;

  /// No description provided for @createAccountButton.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccountButton;

  /// No description provided for @fieldRequired.
  ///
  /// In en, this message translates to:
  /// **'{field} is required'**
  String fieldRequired(Object field);

  /// No description provided for @recoveryRequested.
  ///
  /// In en, this message translates to:
  /// **'Recovery code requested.'**
  String get recoveryRequested;

  /// No description provided for @recoveryVerified.
  ///
  /// In en, this message translates to:
  /// **'Recovery verified.'**
  String get recoveryVerified;

  /// No description provided for @loadFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t load this screen right now.'**
  String get loadFailed;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @comingSoon.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get comingSoon;

  /// No description provided for @manageStore.
  ///
  /// In en, this message translates to:
  /// **'Manage store'**
  String get manageStore;

  /// No description provided for @browseCatalog.
  ///
  /// In en, this message translates to:
  /// **'Browse catalog'**
  String get browseCatalog;

  /// No description provided for @customerDashboard.
  ///
  /// In en, this message translates to:
  /// **'Customer dashboard'**
  String get customerDashboard;

  /// No description provided for @platformControl.
  ///
  /// In en, this message translates to:
  /// **'Platform control'**
  String get platformControl;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fa'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fa':
      return AppLocalizationsFa();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}

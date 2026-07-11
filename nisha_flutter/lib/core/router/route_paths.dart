class RoutePaths {
  RoutePaths._();

  static const String home = '/';
  static const String trackOrder = '/track-order';
  static const String store = '/store/:slug';
  static const String product = '/store/:slug/products/:productId';
  static const String checkout = '/store/:slug/checkout';
  static const String invoice = '/invoice/:invoiceCode';

  static const String sellerLogin = '/auth/login';
  static const String sellerRegister = '/auth/register';
  static const String customerLogin = '/auth/customer/login';
  static const String customerRegister = '/auth/customer/register';
  static const String customerRecover = '/auth/customer/recover';
  static const String sellerRecover = '/auth/seller/recover';
  static const String verifyEmail = '/auth/verify-email';

  static const String sellerDashboard = '/seller/dashboard';
  static const String sellerProducts = '/seller/products';
  static const String sellerOrders = '/seller/orders';
  static const String sellerStore = '/seller/store';
  static const String sellerConversations = '/seller/conversations';
  static const String sellerAppearance = '/seller/appearance';

  static const String customerDashboard = '/customer/dashboard';
  static const String customerOrders = '/customer/orders';
  static const String customerProfile = '/customer/profile';
  static const String customerReviews = '/customer/reviews';
  static const String customerComplaints = '/customer/complaints';
  static const String customerConversations = '/customer/conversations';
  static const String customerDownloads = '/customer/downloads';
  static const String customerAppearance = '/customer/appearance';

  static const String adminDashboard = '/admin/dashboard';
  static const String adminStores = '/admin/stores';
  static const String adminOrders = '/admin/orders';
  static const String adminReviews = '/admin/reviews';
  static const String adminChats = '/admin/chats';
  static const String adminAppearance = '/admin/appearance';
}

import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exception.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<T> get<T>(
    String path,
    T Function(Object? data) parser, {
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'GET',
      path,
      parser,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<T> post<T>(
    String path,
    T Function(Object? data) parser, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'POST',
      path,
      parser,
      data: data,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<T> patch<T>(
    String path,
    T Function(Object? data) parser, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'PATCH',
      path,
      parser,
      data: data,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<T> put<T>(
    String path,
    T Function(Object? data) parser, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'PUT',
      path,
      parser,
      data: data,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<T> delete<T>(
    String path,
    T Function(Object? data) parser, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _request<T>(
      'DELETE',
      path,
      parser,
      data: data,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<T> _request<T>(
    String method,
    String path,
    T Function(Object? data) parser, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final request = http.Request(
      method,
      _buildUri(path, queryParameters),
    );
    request.headers.addAll(<String, String>{
      'Accept': 'application/json',
      ...?headers,
    });
    if (data != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(data);
    }

    try {
      final response = await http.Response.fromStream(
        await _client.send(request),
      );
      final body = response.body.trim();
      final decoded = body.isEmpty ? null : jsonDecode(body);
      if (response.statusCode >= 400) {
        throw ApiException(
          message: _extractErrorMessage(decoded),
          statusCode: response.statusCode,
          payload: decoded,
        );
      }
      return parser(decoded);
    } on FormatException catch (error) {
      throw ApiException(
        message: 'Invalid response from server: ${error.message}',
      );
    }
  }

  Uri _buildUri(
    String path,
    Map<String, dynamic>? queryParameters,
  ) {
    final uri = Uri.parse('${AppConfig.apiUrl}$path');
    if (queryParameters == null || queryParameters.isEmpty) {
      return uri;
    }
    return uri.replace(
      queryParameters: queryParameters.map(
        (key, value) => MapEntry(key, value.toString()),
      ),
    );
  }

  String _extractErrorMessage(Object? data) {
    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      final message = _extractValue(detail) ?? _extractValue(data['message']);
      if (message != null) {
        return message;
      }
    }
    if (data is String && data.isNotEmpty) {
      return data;
    }
    return 'Request failed.';
  }

  String? _extractValue(Object? value) {
    if (value == null) {
      return null;
    }
    if (value is String) {
      return value;
    }
    if (value is List) {
      return value.map((item) => item.toString()).join('\n');
    }
    if (value is Map) {
      return value.values.map((item) => item.toString()).join('\n');
    }
    return value.toString();
  }
}

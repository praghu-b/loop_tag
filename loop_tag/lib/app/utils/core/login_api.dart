import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../routes/app_pages.dart';
import '../../utils/core/constants.dart';

class AuthApiService {
  final _storage = const FlutterSecureStorage();
  final String _usersBaseUrl = '$baseURI/Users';

  String _resolveRole(Map<String, dynamic> data) {
    final role = (data['role'] as String?)?.trim();
    if (role != null && role.isNotEmpty) {
      return role;
    }

    return (data['isAdmin'] == true) ? 'admin' : 'seller_pickup';
  }

  String _routeForRole(String role) {
    return (role == 'admin' || role == 'manufacturer')
        ? Routes.HOME
        : Routes.SCANNER;
  }

  /// Handles user login.
  /// On success, it stores tokens and navigates to the appropriate home screen.
  Future<void> login(String email, String password) async {
    if (!await isConnected()) {
      Get.snackbar(
        "Connection Error",
        "No internet connection.",
        backgroundColor: Colors.orange,
        colorText: Colors.white,
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$_usersBaseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _storeTokens(data);
        final role = _resolveRole(data);
        Get.offAllNamed(_routeForRole(role));
      } else {
        final error = json.decode(response.body)['message'];
        Get.snackbar(
          "Login Failed",
          error ?? "Invalid credentials.",
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      Get.snackbar(
        "Error",
        "An unexpected error occurred: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  /// Handles user registration.
  /// On success, it logs the user in automatically.
  Future<void> register(
    String email,
    String password,
    String role,
  ) async {
    if (!await isConnected()) {
      Get.snackbar(
        "Connection Error",
        "No internet connection.",
        backgroundColor: Colors.orange,
        colorText: Colors.white,
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$_usersBaseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          'role': role,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        await _storeTokens(data);
        Get.offAllNamed(_routeForRole(_resolveRole(data)));
      } else {
        final error = json.decode(response.body)['message'];
        Get.snackbar(
          "Registration Failed",
          error ?? "Could not register user.",
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      Get.snackbar(
        "Error",
        "An unexpected error occurred: $e",
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  /// Checks if the user is already logged in when the app starts.
  /// Validates the stored token with the backend.
  Future<void> checkAuthStatus() async {
    if (!await isConnected()) {
      // Silently fail if no connection, or maybe route to an offline page
      return;
    }

    final accessToken = await _storage.read(key: 'accessToken');
    final storedRole = await _storage.read(key: 'role');

    if (accessToken == null) {
      Get.offAllNamed(Routes.LOGIN);
      return;
    }

    final validationUrl = '$_usersBaseUrl/current';

    try {
      final response = await http.get(
        Uri.parse(validationUrl),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        final body = json.decode(response.body) as Map<String, dynamic>;
        final user = body['user'] as Map<String, dynamic>?;
        final role = (user?['role'] as String?) ?? storedRole ?? 'seller_pickup';

        await _storage.write(key: 'role', value: role);
        await _storage.write(
          key: 'isAdmin',
          value: ((role == 'admin') ? true : false).toString(),
        );

        Get.offAllNamed(_routeForRole(role));
      } else {
        // Token is invalid or expired
        await logout();
      }
    } catch (e) {
      // Server is likely down, or other network error
      await logout();
    }
  }

  /// Helper to store tokens and admin status securely.
  Future<void> _storeTokens(Map<String, dynamic> data) async {
    final role = _resolveRole(data);
    await _storage.write(key: 'accessToken', value: data['accessToken']);
    await _storage.write(key: 'refreshToken', value: data['refreshToken']);
    await _storage.write(
      key: 'isAdmin',
      value: ((role == 'admin') ? true : false).toString(),
    );
    await _storage.write(key: 'role', value: role);
  }

  /// Logs the user out by clearing all stored credentials.
  Future<void> logout() async {
    await _storage.deleteAll();
    Get.offAllNamed(Routes.LOGIN);
  }
}

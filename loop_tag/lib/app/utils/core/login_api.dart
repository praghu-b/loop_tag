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

    print('$_usersBaseUrl/login');

    try {
      final response = await http.post(
        Uri.parse('$_usersBaseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _storeTokens(data);

        final bool isAdmin = data['isAdmin'] ?? false;
        Get.offAllNamed(isAdmin ? Routes.HOME : Routes.SCANNER);
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
      print(e);
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
  Future<void> register(String email, String password) async {
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
        body: json.encode({'email': email, 'password': password}),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        await _storeTokens(data);
        Get.offAllNamed(Routes.HOME); // New users are never admins
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
    final isAdmin = (await _storage.read(key: 'isAdmin')) == 'true';

    if (accessToken == null) {
      Get.offAllNamed(Routes.LOGIN);
      return;
    }

    // Determine the correct endpoint based on admin status
    final validationUrl =
        isAdmin ? '$_usersBaseUrl/current/admin' : '$_usersBaseUrl/current';

    try {
      final response = await http.get(
        Uri.parse(validationUrl),
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      if (response.statusCode == 200) {
        // Token is valid, go to the correct home screen
        Get.offAllNamed(isAdmin ? Routes.HOME : Routes.SCANNER);
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
    await _storage.write(key: 'accessToken', value: data['accessToken']);
    await _storage.write(key: 'refreshToken', value: data['refreshToken']);
    await _storage.write(
      key: 'isAdmin',
      value: (data['isAdmin'] ?? false).toString(),
    );
  }

  /// Logs the user out by clearing all stored credentials.
  Future<void> logout() async {
    await _storage.deleteAll();
    Get.offAllNamed(Routes.LOGIN);
  }
}

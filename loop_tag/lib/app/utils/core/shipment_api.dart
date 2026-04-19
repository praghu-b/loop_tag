import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:loop_tag/app/routes/app_pages.dart';
import 'package:loop_tag/app/utils/core/constants.dart';

class ShipmentApiService {
  final _storage = const FlutterSecureStorage();

  Future<Map<String, String>?> _headers() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null || token.isEmpty) {
      Get.offAllNamed(Routes.LOGIN);
      return null;
    }

    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  Future<String?> createShipment({
    required String productId,
    String? destination,
  }) async {
    final headers = await _headers();
    if (headers == null) return null;

    try {
      final response = await http.post(
        Uri.parse('$baseURI/shipments'),
        headers: headers,
        body: jsonEncode({
          'productId': productId,
          if (destination != null && destination.isNotEmpty)
            'destination': destination,
        }),
      );

      if (response.statusCode == 201) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        return body['_id'] as String?;
      }

      Get.snackbar(
        'Shipment Error',
        'Could not create shipment (${response.statusCode}).',
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar(
        'Shipment Error',
        'Failed to create shipment: $e',
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }

    return null;
  }

  Future<bool> transitionShipment({
    required String shipmentId,
    required String nextState,
    String? note,
  }) async {
    final headers = await _headers();
    if (headers == null) return false;

    try {
      final response = await http.patch(
        Uri.parse('$baseURI/shipments/$shipmentId/transition'),
        headers: headers,
        body: jsonEncode({
          'nextState': nextState,
          if (note != null && note.isNotEmpty) 'note': note,
        }),
      );

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

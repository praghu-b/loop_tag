import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:loop_tag/app/routes/app_pages.dart';
import 'package:loop_tag/app/utils/core/constants.dart';

class SignedPayloadIssueResult {
  final String serializedPayload;
  final String signature;

  SignedPayloadIssueResult({
    required this.serializedPayload,
    required this.signature,
  });
}

class SignedPayloadVerifyResult {
  final bool valid;
  final String? productId;
  final String? shipmentId;
  final String? shipmentState;

  SignedPayloadVerifyResult({
    required this.valid,
    this.productId,
    this.shipmentId,
    this.shipmentState,
  });
}

class NfcPayloadApiService {
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

  Future<SignedPayloadIssueResult?> issuePayload({
    required String shipmentId,
    required String productId,
  }) async {
    final headers = await _headers();
    if (headers == null) return null;

    try {
      final response = await http.post(
        Uri.parse('$baseURI/nfc-payloads/issue'),
        headers: headers,
        body: jsonEncode({
          'shipmentId': shipmentId,
          'productId': productId,
        }),
      );

      if (response.statusCode != 200) {
        return null;
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final serializedPayload = body['serializedPayload'] as String?;
      final signature = body['signature'] as String?;

      if (serializedPayload == null || signature == null) {
        return null;
      }

      return SignedPayloadIssueResult(
        serializedPayload: serializedPayload,
        signature: signature,
      );
    } catch (_) {
      return null;
    }
  }

  Future<SignedPayloadVerifyResult> verifyPayload({
    required String serializedPayload,
    required String signature,
  }) async {
    final headers = await _headers();
    if (headers == null) {
      return SignedPayloadVerifyResult(valid: false);
    }

    try {
      final response = await http.post(
        Uri.parse('$baseURI/nfc-payloads/verify'),
        headers: headers,
        body: jsonEncode({
          'serializedPayload': serializedPayload,
          'signature': signature,
        }),
      );

      if (response.statusCode != 200) {
        return SignedPayloadVerifyResult(valid: false);
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final payload = body['payload'] as Map<String, dynamic>?;

      return SignedPayloadVerifyResult(
        valid: body['valid'] == true,
        productId: payload?['productId'] as String?,
        shipmentId: payload?['shipmentId'] as String?,
        shipmentState: body['shipmentState'] as String?,
      );
    } catch (_) {
      return SignedPayloadVerifyResult(valid: false);
    }
  }
}

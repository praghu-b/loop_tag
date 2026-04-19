
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loop_tag/app/routes/app_pages.dart';
import 'package:loop_tag/app/services/nfc_service.dart';
import 'package:loop_tag/app/utils/core/nfc_payload_api.dart';
import 'package:loop_tag/app/utils/core/product_api.dart';
import 'package:loop_tag/app/utils/core/shipment_api.dart';

class ScannerController extends GetxController {
  final _nfcService = NfcService();
  final _productApiService = ProductApiService();

  RxBool cannotScan = false.obs;
  RxBool isProcessing = false.obs;

  @override
  void onInit() {
    super.onInit();
    initializeNfcScanning();
  }

  @override
  void onClose() {
    _nfcService.stopSession();
    super.onClose();
  }

  /// Initializes the NFC scanning session.
  Future<void> initializeNfcScanning() async {
    final isAvailable = await _nfcService.isAvailable();
    if (!isAvailable) {
      Get.snackbar(
        'NFC Unavailable',
        "NFC is not supported or is turned off on this device.",
        backgroundColor: Colors.red.withOpacity(0.8),
        colorText: Colors.white,
      );
      cannotScan.value = true;
      return;
    }

    Get.snackbar('Ready to Scan', "Hold your phone near a Loop Tag.");
    
    // Start listening for NFC tags
    _nfcService.startSession(onTag: (tag) async {
      // Prevent multiple simultaneous processing
      if (isProcessing.value) return;

      isProcessing.value = true;

      try {
        await _handleScannedTag(tag);
      } finally {
        // Reset processing state after a short delay to prevent immediate re-scans
        Future.delayed(const Duration(seconds: 2), () {
          isProcessing.value = false;
        });
      }
    });
  }

  /// Processes the data from a scanned NFC tag.
  Future<void> _handleScannedTag(NfcTagResult tag) async {
    if (tag.ndefRecords.isEmpty) {
      Get.snackbar('Scan Error', 'The NFC tag is empty or not supported.');
      return;
    }

    // Attempt to parse the first text record from the tag
    final firstRecord = tag.ndefRecords.first;
    final rawText = NfcService.parseTextRecordPayload(firstRecord);

    if (rawText == null || rawText.isEmpty) {
      Get.snackbar('Scan Error', 'Could not read a valid product ID from the tag.');
      return;
    }

    String productId = rawText;

    // New signed NFC payload flow with a legacy fallback for old tags.
    try {
      final envelope = jsonDecode(rawText) as Map<String, dynamic>;
      final serializedPayload = envelope['serializedPayload'] as String?;
      final signature = envelope['signature'] as String?;

      if (serializedPayload != null && signature != null) {
        final verification = await NfcPayloadApiService().verifyPayload(
          serializedPayload: serializedPayload,
          signature: signature,
        );

        if (!verification.valid ||
            verification.productId == null ||
            verification.productId!.isEmpty) {
          Get.snackbar('Scan Error', 'Secure payload verification failed.');
          return;
        }

        productId = verification.productId!;

        if (verification.shipmentId != null &&
            verification.shipmentId!.isNotEmpty &&
            verification.shipmentState == 'TAG_WRITTEN') {
          await ShipmentApiService().transitionShipment(
            shipmentId: verification.shipmentId!,
            nextState: 'PICKED_UP',
            note: 'Seller/pickup team verified NFC tag.',
          );
        }
      }
    } catch (_) {
      // Keep compatibility with old tags where plain productId text is stored.
    }

    // Validate if the scanned data looks like a MongoDB ObjectId
    if (_isValidObjectId(productId)) {
      Get.dialog(
        const Center(child: CircularProgressIndicator()),
        barrierDismissible: false,
      );

      final product = await _productApiService.getProduct(productId);
      
      Get.back(); // Close the loading dialog

      if (product != null) {
        // Navigate to the product display page
        Get.toNamed(Routes.PRODUCT_DISPLAY, arguments: product);
      } else {
        Get.snackbar(
          'Product Not Found',
          'The product associated with this tag could not be found.',
        );
      }
    } else {
      Get.snackbar(
        'Invalid ID',
        'The scanned tag does not contain a valid Product ID.',
      );
    }
  }

  /// Checks if a string is a valid 24-character hex string (MongoDB ObjectId format).
  bool _isValidObjectId(String id) {
    return RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(id);
  }
}

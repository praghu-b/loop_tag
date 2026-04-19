import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loop_tag/app/services/nfc_service.dart';
import 'package:loop_tag/app/utils/core/nfc_payload_api.dart';
import 'package:loop_tag/app/utils/core/shipment_api.dart';
import 'package:nfc_manager/nfc_manager.dart';

class NfcWriterController extends GetxController {
  final NfcService _nfcService = NfcService();
  final Map<String, dynamic> _args =
      (Get.arguments as Map<String, dynamic>?) ?? <String, dynamic>{};

  String get productIdToWrite => (_args['productId'] as String?) ?? '';
  String get shipmentId => (_args['shipmentId'] as String?) ?? '';

  final RxBool isNfcAvailable = true.obs;
  final RxString statusMessage = 'Hold your phone near an NFC tag to write.'.obs;

  @override
  void onInit() {
    super.onInit();
    _startNfcWritingSession();
  }

  @override
  void onClose() {
    _nfcService.stopSession();
    super.onClose();
  }

  Future<void> _startNfcWritingSession() async {
    if (productIdToWrite.isEmpty || shipmentId.isEmpty) {
      statusMessage.value = 'Missing product or shipment details.';
      return;
    }

    isNfcAvailable.value = await _nfcService.isAvailable();
    if (!isNfcAvailable.value) {
      statusMessage.value = 'NFC is not available on this device.';
      return;
    }

    try {
      final signedPayload = await NfcPayloadApiService().issuePayload(
        shipmentId: shipmentId,
        productId: productIdToWrite,
      );

      if (signedPayload == null) {
        statusMessage.value = 'Failed to issue secure NFC payload.';
        return;
      }

      final envelope = jsonEncode({
        'serializedPayload': signedPayload.serializedPayload,
        'signature': signedPayload.signature,
      });

      final record = NdefRecord.createText(envelope);
      final success = await _nfcService.writeNdef([record]);

      if (success) {
        await ShipmentApiService().transitionShipment(
          shipmentId: shipmentId,
          nextState: 'TAG_WRITTEN',
          note: 'Manufacturer wrote signed payload to NFC tag.',
        );

        statusMessage.value = 'Signed shipment payload written successfully!';
        Get.snackbar(
          'Success',
          'Secure NFC tag updated.',
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
        // Navigate back after a short delay
        Future.delayed(const Duration(seconds: 2), () => Get.back());
      }
    } catch (e) {
      statusMessage.value = 'Error: ${e.toString()}';
       Get.snackbar(
          'Error Writing Tag',
          e.toString(),
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
      _nfcService.stopSession(errorMessage: e.toString());
    }
  }
}

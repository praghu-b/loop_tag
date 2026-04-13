import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:nfc_manager/nfc_manager.dart';

typedef NfcTagCallback = void Function(NfcTagResult result);
final Set<NfcPollingOption> pollingOption = {
  NfcPollingOption.iso14443,
  NfcPollingOption.iso15693,
  NfcPollingOption.iso18092,
};

class NfcTagResult {
  final String? id;
  final List<NdefRecord> ndefRecords;
  final Map<String, dynamic>? raw; // raw tag map
  NfcTagResult({this.id, this.ndefRecords = const [], this.raw});
}

/// A modular NFC service wrapper around nfc_manager
class NfcService {
  static final NfcService _instance = NfcService._internal();
  factory NfcService() => _instance;
  NfcService._internal();

  bool _initialized = false;
  StreamSubscription? _subscription;

  /// Initialize - call once in app startup (optional)
  Future<void> init() async {
    if (_initialized) return;
    // nfc_manager requires no explicit init; but we can check availability
    _initialized = true;
  }

  /// Check if NFC is available on this device
  Future<bool> isAvailable() => NfcManager.instance.isAvailable();

  /// Start a continuous session that triggers [onTag] when a tag is discovered.
  /// NOTE: The session will keep listening until stopSession() is called or user cancels.
  Future<void> startSession({
    required NfcTagCallback onTag,
    Duration? timeout,
    bool alertMessageOnIOS = true,
  }) async {
    // Make sure NFC is available
    final available = await isAvailable();
    if (!available) throw Exception('NFC not available');

    // Stop any previous session
    await stopSession();

    NfcManager.instance.startSession(
      pollingOptions: pollingOption,
      alertMessage: alertMessageOnIOS ? 'Hold your device near NFC tag' : "",
      onDiscovered: (NfcTag tag) async {
        try {
          final res = await _parseTag(tag);
          onTag(res);
        } catch (e, st) {
          if (kDebugMode) {
            print('Error parsing NFC tag: $e\n$st');
          }
        }
      },
    );

    // optional timeout to auto-stop
    if (timeout != null) {
      Future.delayed(timeout, () => stopSession());
    }
  }

  /// Stop an active session
  Future<void> stopSession({String? errorMessage}) async {
    try {
      await NfcManager.instance.stopSession(errorMessage: errorMessage);
    } catch (e) {
      // ignore if already stopped
    }
  }

  /// Read one tag once (start session, wait for first tag, then stop)
  Future<NfcTagResult?> readOnce({
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final available = await isAvailable();
    if (!available) return null;

    final completer = Completer<NfcTagResult?>();
    Timer? t;

    await NfcManager.instance.startSession(
      pollingOptions: pollingOption,
      onDiscovered: (NfcTag tag) async {
        try {
          final res = await _parseTag(tag);
          if (!completer.isCompleted) completer.complete(res);
        } catch (e) {
          if (!completer.isCompleted) completer.completeError(e);
        } finally {
          await NfcManager.instance.stopSession();
          t?.cancel();
        }
      },
    );

    t = Timer(timeout, () async {
      if (!completer.isCompleted) {
        completer.complete(null);
        await NfcManager.instance.stopSession(errorMessage: 'Timeout');
      }
    });

    return completer.future;
  }

  /// Write an NDEF message to a tag (returns true if success)
  /// `records` is a list of NdefRecord. Example: NdefRecord.createText('hello')
  Future<bool> writeNdef(List<NdefRecord> records) async {
    final available = await isAvailable();
    if (!available) throw Exception('NFC not available');

    final completer = Completer<bool>();

    await NfcManager.instance.startSession(
      pollingOptions: pollingOption,
      alertMessage: 'Tap a tag to write.',
      onDiscovered: (NfcTag tag) async {
        try {
          final ndef = Ndef.from(tag);
          if (ndef == null) {
            throw Exception('Tag does not support NDEF.');
          }

          await ndef.write(NdefMessage(records));
          if (!completer.isCompleted) completer.complete(true);
        } catch (e) {
          if (!completer.isCompleted) completer.completeError(e);
        } finally {
          await NfcManager.instance.stopSession();
        }
      },
    );

    return completer.future;
  }

  /// Low-level parser: convert NfcTag to NfcTagResult
  Future<NfcTagResult> _parseTag(NfcTag tag) async {
    // id if present
    String? id;
    try {
      final tagMap = tag.data;
      if (tagMap.containsKey('id')) {
        final idBytes = tagMap['id'];
        if (idBytes is Uint8List) {
          id = _bytesToHex(idBytes);
        } else if (idBytes is List<int>) {
          id = _bytesToHex(Uint8List.fromList(idBytes));
        }
      }
    } catch (_) {}

    // try NDEF
    List<NdefRecord> records = [];
    try {
      final ndef = Ndef.from(tag);
      if (ndef != null) {
        final message = await ndef.read();
        if (message.records.isNotEmpty) {
          records = message.records;
        }
      }
    } catch (e) {
      // non-fatal: some tags cannot be read as NDEF
    }

    return NfcTagResult(
      id: id,
      ndefRecords: records,
      raw: tag.data.cast<String, dynamic>(),
    );
  }

  String _bytesToHex(Uint8List bytes) {
    final buffer = StringBuffer();
    for (final b in bytes) {
      buffer.write(b.toRadixString(16).padLeft(2, '0'));
    }
    return buffer.toString();
  }

  /// Utility to convert NdefRecord payloads to readable text if applicable.
  static String? parseTextRecordPayload(NdefRecord rec) {
    try {
      if (rec.typeNameFormat == NdefTypeNameFormat.nfcWellknown &&
          rec.type.length == 1 &&
          rec.type[0] == 0x54) {
        // Text record
        final payload = rec.payload;
        if (payload.isNotEmpty) {
          final status = payload[0];
          final isUtf16 = (status & 0x80) != 0;
          final langLen = status & 0x3F;
          final textBytes = payload.sublist(1 + langLen);
          return isUtf16
              ? String.fromCharCodes(textBytes)
              : String.fromCharCodes(textBytes);
        }
      }
      // handle other types (URI, mime) below if needed
    } catch (_) {}
    return null;
  }
}

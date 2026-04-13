import 'package:connectivity_plus/connectivity_plus.dart';

const String baseURI = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://loop-tag.onrender.com/api',
);

Future<bool> isConnected() async {
  return (await Connectivity().checkConnectivity()).first !=
      ConnectivityResult.none;
}
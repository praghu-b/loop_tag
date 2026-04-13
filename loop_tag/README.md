# loop_tag

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Running the app locally

Use a backend URL at build time instead of hardcoding it in the app:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_LAPTOP_IP:8055/api
```

For production builds, you can omit the flag and the app will use the hosted API by default.

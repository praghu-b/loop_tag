import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:loop_tag/app/utils/core/login_api.dart';

class LoginController extends GetxController {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final isPasswordHidden = true.obs;
  final isLoading = false.obs;
  final selectedRole = 'seller_pickup'.obs;

  void togglePasswordVisibility() {
    isPasswordHidden.value = !isPasswordHidden.value;
  }

  void setRole(String role) {
    selectedRole.value = role;
  }

  void login() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      Get.snackbar("Error", "Please enter both email and password");
      return;
    }

    isLoading.value = true;

    await AuthApiService().login(email, password);

    isLoading.value = false;
  }

  void register() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      Get.snackbar("Error", "Please enter both email and password");
      return;
    }

    isLoading.value = true;
    await AuthApiService().register(email, password, selectedRole.value);
    isLoading.value = false;
  }

  void forgotPassword() {
    Get.snackbar("Forgot Password", "Redirecting to reset page...");
  }
}

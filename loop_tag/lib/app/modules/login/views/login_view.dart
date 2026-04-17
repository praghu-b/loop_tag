import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';

import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:loop_tag/app/utils/UI/colors.dart';
import 'package:loop_tag/app/utils/ui/custom_text_field.dart';

import '../controllers/login_controller.dart';

class LoginView extends GetView<LoginController> {
  const LoginView({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: baseBG,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Transform.translate(
                    offset: Offset(-17, 0),
                    child: Row(
                      children: [
                        SvgPicture.asset("assets/icons/logo.svg", height: 78),
                        Text(
                          "Loop Tag",
                          style: GoogleFonts.playwriteDeSas(fontSize: 18),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  const Text("Welcome Back!", style: TextStyle(fontSize: 28)),
                  const Text(
                    "Sign in to continue",
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 32),

                  CustomTextField(
                    controller: controller.emailController,
                    label: "Email",
                    hint: "Phone/Email",
                  ),
                  const SizedBox(height: 16),

                  Obx(
                    () => CustomTextField(
                      controller: controller.passwordController,
                      hint: "Password",
                      label: "Password",
                      obscureText: controller.isPasswordHidden.value,
                      onToggleVisibility: controller.togglePasswordVisibility,
                    ),
                  ),
                  const SizedBox(height: 12),

                  Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: controller.forgotPassword,
                      child: const Text(
                        "Forgotten Password?",
                        style: TextStyle(
                          color: Colors.blueAccent,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  Obx(
                    () => SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          shadowColor: Colors.transparent,
                          backgroundColor: Colors.blueAccent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(1222),
                          ),
                        ),
                        onPressed:
                            controller.isLoading.value
                                ? null
                                : controller.login,
                        child:
                            controller.isLoading.value
                                ? const CircularProgressIndicator(
                                  color: Colors.white,
                                )
                                : const Text(
                                  "Sign In",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:loop_tag/app/routes/app_pages.dart';
import 'package:loop_tag/app/utils/core/login_api.dart';
import 'package:loop_tag/app/utils/ui/product_card.dart';

import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});
  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.sizeOf(context);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.toNamed(Routes.ADD_PRODUCT),
        child: const Icon(Icons.add),
      ),
      appBar: AppBar(
        title: const Text(
          "All Products",
          style: TextStyle(color: Colors.black),
        ),
        backgroundColor: Colors.white,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 10),
            child: InkResponse(
              onTap: () => AuthApiService().logout(),
              child: const Icon(Icons.logout_outlined),
            ),
          ),
        ],
        elevation: 0,
      ),
      body: Obx(
        () {
          // Show a loading spinner during the initial fetch
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }
          
          // Show the empty state or the product grid
          return AnimatedCrossFade(
            duration: Durations.medium3,
            crossFadeState: controller.allProducts.isEmpty
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            secondChild: SizedBox(
              height: screenSize.height,
              width: screenSize.width,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error, color: Colors.redAccent, size: 42),
                    SizedBox(height: 12),
                    Text(
                      "There are no products listed\ncurrently. Pull down to refresh.",
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            firstChild: SizedBox(
              height: screenSize.height,
              width: screenSize.width,
              // --- UPDATED ---
              // The GridView is now wrapped in a RefreshIndicator.
              child: RefreshIndicator(
                onRefresh: controller.fetchProducts,
                child: GridView.builder(
                  // This ensures the refresh indicator works even with few items.
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, // 2 cards per row
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.65, // Adjust for card height
                  ),
                  itemCount: controller.allProducts.length,
                  itemBuilder: (context, index) {
                    final product = controller.allProducts[index];
                    return ProductCard(
                      product: product,
                      onTap: () {
                        // Navigate to the product display screen
                        Get.toNamed(Routes.PRODUCT_DISPLAY, arguments: product);
                      },
                    );
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

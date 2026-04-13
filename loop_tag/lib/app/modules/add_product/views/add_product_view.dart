import 'dart:io';

import 'package:dotted_border/dotted_border.dart';
import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:loop_tag/app/utils/ui/custom_text_field.dart';

import '../controllers/add_product_controller.dart';

class AddProductView extends GetView<AddProductController> {
  const AddProductView({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const Icon(Icons.arrow_back),
        title: const Text('Add Product'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () {
              // Handle delete action
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageUploadSection(),
            const SizedBox(height: 24),
            CustomTextField(
              controller: controller.productNameController,
              label: 'Product Name',
              hint: 'Enter the product name',
            ),
            const SizedBox(height: 24),
            _buildPriceFields(),
            const SizedBox(height: 24),
            CustomTextField(
              controller: controller.descriptionController,
              label: 'Description',
              hint: 'Write about your product...',
              maxLines: 4,
            ),
            const SizedBox(height: 24),
            _buildCategoryDropdown(),
            const SizedBox(height: 32),
            Obx(() {
              if (controller.createdProduct.value == null) {
                // State 1: Show "Add Product" button
                return SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: controller.addProduct,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blueAccent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Add Product',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                );
              } else {
                // State 2: Show "Write to NFC" button
                return Column(
                  children: [
                    const Center(
                      child: Text(
                        'Product created successfully!',
                        style: TextStyle(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: controller.goToNfcWriter,
                        icon: const Icon(Icons.nfc, color: Colors.white),
                        label: const Text(
                          'Write Product ID to NFC Tag',
                          style: TextStyle(color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }
            }),
          ],
        ),
      ),
    );
  }

  // Modular widget for image uploading UI
  Widget _buildImageUploadSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: controller.pickImages,
          child: DottedBorder(
            borderType: BorderType.RRect,
            radius: const Radius.circular(12),
            dashPattern: const [6, 6],
            color: Colors.grey,
            strokeWidth: 1,
            child: Container(
              width: double.infinity,
              height: 180,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.cloud_upload_outlined,
                    size: 48,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Upload up to 5 images',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '(345x255 or larger recommended, up to 1MB each)',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Obx widget rebuilds when the selectedImages list changes
        Obx(
          () => Wrap(
            spacing: 10,
            runSpacing: 10,
            children: List.generate(
              controller.selectedImages.length,
              (index) => Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      File(controller.selectedImages[index].path),
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: -10,
                    right: -10,
                    child: IconButton(
                      icon: const Icon(Icons.remove_circle, color: Colors.red),
                      onPressed: () => controller.removeImage(index),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Modular widget for price fields
  Widget _buildPriceFields() {
    return Row(
      children: [
        Expanded(
          child: CustomTextField(
            controller: controller.priceController,
            label: 'Price',
            hint: 'Eg: ₹223.00',
            keyBoardType: TextInputType.number,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: CustomTextField(
            controller: controller.discountedPriceController,
            label: 'GST',
            hint: 'Eg: ₹12.00',
            keyBoardType: TextInputType.number,
          ),
        ),
      ],
    );
  }

  // Modular widget for category dropdown
  Widget _buildCategoryDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text.rich(
          TextSpan(
            text: 'Choose Category',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            children: [
              TextSpan(text: ' *', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Obx rebuilds the dropdown when selectedCategory changes
        Obx(
          () => DropdownButtonFormField<String>(
            dropdownColor: Colors.white,
            initialValue: controller.selectedCategory.value,
            onChanged: controller.onCategoryChanged,
            items:
                controller.categories.map<DropdownMenuItem<String>>((
                  String value,
                ) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
            decoration: const InputDecoration(border: OutlineInputBorder()),
          ),
        ),
      ],
    );
  }
}

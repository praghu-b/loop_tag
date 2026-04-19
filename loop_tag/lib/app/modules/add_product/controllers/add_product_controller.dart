import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:loop_tag/app/data/product_model.dart';
import 'package:loop_tag/app/data/product_upload_model.dart';
import 'package:loop_tag/app/routes/app_pages.dart';
import 'package:loop_tag/app/utils/core/shipment_api.dart';
import 'package:loop_tag/app/utils/core/product_api.dart';

class AddProductController extends GetxController {
  // Text Editing Controllers for form fields
  final productNameController = TextEditingController();
  final priceController = TextEditingController();
  final discountedPriceController = TextEditingController();
  final descriptionController = TextEditingController();

  // Observable list to store picked image files
  final RxList<XFile> selectedImages = <XFile>[].obs;
  final ImagePicker _picker = ImagePicker();

  // Observable for the selected category
  final RxString selectedCategory = 'Groceries'.obs;
  final List<String> categories = [
    'Groceries',
    'Electronics',
    'Clothing',
    'Home Goods',
  ];

  // --- NEW ---
  // State to hold the product after it's successfully created.
  // The UI will react to changes in this variable.
  final Rx<Product?> createdProduct = Rx<Product?>(null);
  final RxString createdShipmentId = ''.obs;

  // Method to handle image selection from the gallery
  Future<void> pickImages() async {
    if (selectedImages.length >= 5) {
      Get.snackbar('Limit Reached', 'You can only upload up to 5 images.');
      return;
    }
    final List<XFile> images = await _picker.pickMultiImage();
    if (images.isNotEmpty) {
      int availableSlots = 5 - selectedImages.length;
      if (images.length > availableSlots) {
        selectedImages.addAll(images.take(availableSlots));
        Get.snackbar(
          'Limit Exceeded',
          'Only $availableSlots more images were added.',
        );
      } else {
        selectedImages.addAll(images);
      }
    }
  }

  // Method to remove a selected image
  void removeImage(int index) {
    if (index >= 0 && index < selectedImages.length) {
      selectedImages.removeAt(index);
    }
  }

  // Method to change category
  void onCategoryChanged(String? newValue) {
    if (newValue != null) {
      selectedCategory.value = newValue;
    }
  }

  // Method to handle product submission
  Future<void> addProduct() async {
    // Basic validation
    if (productNameController.text.isEmpty ||
        priceController.text.isEmpty ||
        descriptionController.text.isEmpty ||
        selectedImages.isEmpty) {
      Get.snackbar(
        'Error',
        'Please fill all required fields and upload at least one image.',
        backgroundColor: Colors.red.withOpacity(0.8),
        colorText: Colors.white,
      );
      return;
    }

    final productToUpload = ProductUploadData(
      productName: productNameController.text,
      price: double.tryParse(priceController.text) ?? 0,
      discountedPrice: discountedPriceController.text.isNotEmpty
          ? double.tryParse(discountedPriceController.text)
          : null,
      description: descriptionController.text,
      category: selectedCategory.value,
      images: selectedImages,
    );

    final result = await ProductApiService().postProduct(productToUpload);

    // --- UPDATED ---
    // If successful, store the created product, which will trigger the UI update.
    if (result != null) {
      createdProduct.value = result;

      if (result.id != null && result.id!.isNotEmpty) {
        final shipmentId = await ShipmentApiService().createShipment(
          productId: result.id!,
          destination: descriptionController.text.trim(),
        );

        if (shipmentId != null && shipmentId.isNotEmpty) {
          createdShipmentId.value = shipmentId;
        } else {
          Get.snackbar(
            'Shipment Error',
            'Product was created, but shipment setup failed.',
            backgroundColor: Colors.orange,
            colorText: Colors.white,
          );
        }
      }
    }
  }

  // --- NEW ---
  // Method to navigate to the NFC writer screen, passing the product ID as an argument.
  void goToNfcWriter() {
    if (createdProduct.value != null &&
        createdProduct.value!.id != null &&
        createdProduct.value!.id!.isNotEmpty &&
        createdShipmentId.value.isNotEmpty) {
      Get.toNamed(
        Routes.NFC_WRITER,
        arguments: {
          'productId': createdProduct.value!.id,
          'shipmentId': createdShipmentId.value,
        },
      );
    } else {
      Get.snackbar(
        'Error',
        'Could not prepare shipment and product data for NFC write.',
        backgroundColor: Colors.red,
        colorText: Colors.white,
      );
    }
  }

  // Dispose controllers when the screen is closed
  @override
  void onClose() {
    productNameController.dispose();
    priceController.dispose();
    discountedPriceController.dispose();
    descriptionController.dispose();
    super.onClose();
  }
}


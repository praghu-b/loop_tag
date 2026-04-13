import 'package:flutter/material.dart';
import 'package:loop_tag/app/data/product_model.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 2,
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- Product Image ---
            _buildProductImage(),
            // --- Product Details ---
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.productName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildPriceSection(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget for the product image section
  Widget _buildProductImage() {
    return AspectRatio(
      aspectRatio: 1, // Creates a square container for the image
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
          // Show the first image if available, otherwise a placeholder
          child: product.imageUrls.isNotEmpty
              ? Image.network(
                  product.imageUrls.first,
                  fit: BoxFit.cover,
                )
              : const Icon(Icons.image_not_supported,
                  color: Colors.grey, size: 40),
        ),
      ),
    );
  }

  // Widget for the price and navigation arrow
  Widget _buildPriceSection() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Display discounted price or regular price
        Text(
          '₹${(product.price).toStringAsFixed(2)}',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: Colors.black87,
          ),
        ),
        // Navigation arrow icon
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.arrow_forward_ios,
            size: 14,
            color: Colors.black54,
          ),
        ),
      ],
    );
  }
}

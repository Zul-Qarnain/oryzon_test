"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProductContext } from '@/app/lib/context/ProductContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Save, AlertCircle, Edit3 } from 'lucide-react';
import { UpdateProductData, Product } from '@/backend/services/products/products.types';
import Link from 'next/link';
import ImageUpload from '@/app/components/ImageUpload';

const ProductUpdatePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const productId = params.productId as string;

  const { user, user_loading } = useUserContext();
  const { 
    product, 
    fetchProduct, 
    updateProduct, 
    product_loading, 
    error_product,
    uploadImageCallback,
    image_uploading
  } = useProductContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>(''); // Changed type to string
  const [currency, setCurrency] = useState('USD');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageId, setImageId] = useState<string | null>(null);
  // Add other product fields as needed, e.g., SKU, stock, images

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (productId && user) {
      fetchProduct(productId);
    }
  }, [productId, user, fetchProduct]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price || ''); // Changed to handle string | null from product.price
      setCurrency(product.currency || 'USD');
      setIsAvailable(product.isAvailable === null ? true : product.isAvailable);
      setImageUrl(product.imageUrl || '');
      setImageId(product.imageId || null);
    }
  }, [product]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const payload: UpdateProductData = { 
      name, 
      description,
      price: price === '' ? undefined : price, // Send undefined if price is empty, to match string | undefined
      currency,
      isAvailable,
      imageUrl: imageUrl || undefined,
      imageId: imageId || undefined,
    };
    
    const response = await updateProduct(productId, payload);
    setIsSaving(false);
    if (response.error) {
      setSaveErrorMessage(response.error || "Failed to update product details.");
    } else {
      setSaveSuccessMessage("Product details updated successfully!");
      fetchProduct(productId); // Refetch to get the latest data
    }
  };
  
  if (user_loading || (product_loading && !product)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading product details...</p>
      </div>
    );
  }

  if (error_product || (!product && !product_loading)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Product</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{error_product || "Product not found or an error occurred."}</p>
        <Link href={`/business/${businessId}/products`} className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Go to Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-page-heading)]">
          Update Product: <span className="text-[var(--color-accent-primary)]">{product?.name}</span>
        </h2>
        <Link href={`/business/${businessId}/products/${productId}`} className="text-[var(--color-accent-primary)] hover:underline flex items-center">
            View Product Info
            <Edit3 className="ml-2 h-5 w-5"/>
        </Link>
      </div>


      {saveSuccessMessage && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-300 border border-green-500 rounded-md">
          {saveSuccessMessage}
        </div>
      )}
      {saveErrorMessage && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-300 border border-red-500 rounded-md">
          {saveErrorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-12 p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-[var(--text-on-dark-secondary)]">Product Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-6">
              <label htmlFor="productName" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
                Product Name
              </label>
              <input
                type="text"
                id="productName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-color-muted"
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="productPrice" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
                Price
              </label>
              <input
                type="number"
                id="productPrice"
                value={price}
                onChange={(e) => setPrice(e.target.value)} // Input value is string
                step="0.01"
                className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-color-muted"
                placeholder="Enter price (e.g., 19.99)"
              />
            </div>
        </div>

        <div className="mb-6">
          <label htmlFor="productDescription" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
            Description
          </label>
          <textarea
            id="productDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-color-muted"
            placeholder="Enter product description"
          />
        </div>

        <ImageUpload
          currentImageUrl={imageUrl}
          onImageUpload={uploadImageCallback}
          onImageUrlChange={(url, id) => {
            setImageUrl(url || '');
            setImageId(id);
          }}
          isUploading={image_uploading}
          disabled={isSaving || product_loading}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-6">
              <label htmlFor="productCurrency" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
                Currency
              </label>
              <select
                id="productCurrency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                {/* Add more currencies as needed */}
              </select>
            </div>

            <div className="mb-6 flex items-center pt-7">
              <input
                type="checkbox"
                id="isAvailable"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-5 w-5 text-[var(--color-accent-primary)] border-[var(--border-medium)] rounded focus:ring-[var(--color-accent-primary)]"
              />
              <label htmlFor="isAvailable" className="ml-2 text-sm font-medium text-[var(--text-on-dark-primary)]">
                Product is Available
              </label>
            </div>
        </div>

        {/* Add more fields for SKU, stock, images, variants etc. as needed */}

        <button
          type="submit"
          disabled={isSaving || product_loading || image_uploading}
          className="w-full md:w-auto px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {(isSaving || image_uploading) ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          {isSaving ? 'Saving Changes...' : image_uploading ? 'Uploading...' : 'Save Changes'}
        </button>
      </form>
    </>
  );
};

export default ProductUpdatePage;

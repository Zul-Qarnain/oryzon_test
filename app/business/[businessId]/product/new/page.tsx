"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/app/lib/context/UserContext';
import { useProductContext } from '@/app/lib/context/ProductContext'; 
import { Loader2, AlertCircle, ChevronLeft, PackagePlus, Save } from 'lucide-react';
import { CreateProductData } from '@/backend/services/products/products.types'; 

const NewProductPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user_loading, FUser } = useUserContext(); // Correctly get FUser
  const { createProduct, product_loading, error_product, cleanError_Product } = useProductContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState(''); 
  // stockQuantity is not in the schema, removing it.
  // const [stockQuantity, setStockQuantity] = useState<number | undefined>(undefined); 
  const [currency, setCurrency] = useState('USD');
  const [isAvailable, setIsAvailable] = useState(true); 
  const [imageUrl, setImageUrl] = useState(''); // Added for imageUrl from schema

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    cleanError_Product();
  }, [cleanError_Product, businessId]);

  useEffect(() => {
    if (error_product) {
      setFormError(error_product);
    } else {
      setFormError(null); 
    }
  }, [error_product]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    cleanError_Product(); 
    setFormError(null);
    setFormSuccess(null);

    if (!FUser) { 
      setFormError('User not authenticated. Please sign in again.');
      return;
    }
    if (!businessId) {
      setFormError('Business ID is missing.');
      return;
    }
    if (!name.trim()) {
      setFormError('Product name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { 
      setFormError('Valid product price is required (must be > 0).');
      return;
    }
    // stockQuantity validation removed
    if (!currency.trim() || currency.trim().length !== 3) {
        setFormError('A valid 3-letter currency code is required (e.g., USD).');
        return;
    }

    const productPayload: Omit<CreateProductData, 'providerUserId'> & { businessId: string } = {
      businessId,
      name: name.trim(),
      description: description.trim() || undefined,
      price: parsedPrice.toString(), 
      sku: sku.trim() || undefined,
      // stockQuantity removed
      currency: currency.trim().toUpperCase(),
      isAvailable: isAvailable, 
      imageUrl: imageUrl.trim() || undefined,
      // Defaulting complex fields from CreateProductData that are not in the form yet
       // Assuming 'images' is the correct field name if it exists in CreateProductData, otherwise remove
      // ame assumption
      // imageId and shortId are part of NewProduct but likely optional or backend-generated.
    };
    
    const response = await createProduct(productPayload);

    if (response.error) {
      setFormError(response.error);
    } else if (response.result) {
      setFormSuccess(`Product "${response.result.name}" created successfully!`);
      setName('');
      setDescription('');
      setPrice('');
      setSku('');
      // setStockQuantity(undefined); // Removed
      setCurrency('USD');
      setIsAvailable(true);
      setImageUrl('');
      setTimeout(() => {
        // TODO: Change to a dedicated products list page if created, e.g., /business/[businessId]/products
        router.push(`/business/${businessId}#products`); 
      }, 2000);
    } else {
        setFormError("An unexpected error occurred. The product might not have been created.");
    }
  };
  
  if (user_loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg text-[var(--text-on-dark-secondary)]">Loading user data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-[var(--text-page-heading)]">
            Add New Product
            </h2>
            <p className="text-[var(--text-on-dark-muted)]">
                Fill in the details to add a new product to your business.
            </p>
        </div>
        <Link 
            href={`/business/${businessId}#products`}
            className="flex items-center text-sm text-[var(--text-on-dark-muted)] hover:text-[var(--text-on-dark-primary)] transition-colors bg-[var(--bg-secondary)] hover:bg-[var(--bg-accent)] px-3 py-2 rounded-md"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Products Overview
        </Link>
      </div>

      {formSuccess && (
        <div className="mb-6 p-4 bg-green-600/20 text-green-300 border border-green-500 rounded-md flex items-center">
          <PackagePlus className="h-5 w-5 mr-2" />
          {formSuccess}
        </div>
      )}
      {formError && (
        <div className="mb-6 p-4 bg-red-600/20 text-red-300 border border-red-500 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg space-y-6">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Product Name <span className="text-red-500">*</span></label>
          <input
            id="productName" type="text" placeholder="e.g., Premium Coffee Beans"
            value={name} onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
            required
          />
        </div>

        <div>
          <label htmlFor="productDescription" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Description</label>
          <textarea
            id="productDescription" placeholder="Detailed description of the product"
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label htmlFor="productPrice" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Price <span className="text-red-500">*</span></label>
                <input
                    id="productPrice" type="number" placeholder="e.g., 19.99"
                    value={price} onChange={(e) => setPrice(e.target.value)}
                    min="0.01" step="0.01"
                    className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
                    required
                />
            </div>
            <div>
                <label htmlFor="productCurrency" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Currency <span className="text-red-500">*</span></label>
                <input
                    id="productCurrency" type="text" placeholder="e.g., USD"
                    value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    maxLength={3} minLength={3}
                    className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
                    required
                />
            </div>
            <div>
                <label htmlFor="productSku" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">SKU</label>
                <input
                    id="productSku" type="text" placeholder="e.g., COF-PREM-001"
                    value={sku} onChange={(e) => setSku(e.target.value)}
                    className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
                />
            </div>
        </div>
        
        <div>
            <label htmlFor="productImageUrl" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Image URL</label>
            <input
                id="productImageUrl" type="url" placeholder="e.g., https://example.com/image.jpg"
                value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
            />
        </div>

        <div className="flex items-center mt-4">
            <input
                id="productIsAvailable"
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-4 w-4 text-[var(--color-accent-primary)] border-[var(--border-medium)] rounded focus:ring-[var(--color-accent-primary)] bg-[var(--bg-input)]"
            />
            <label htmlFor="productIsAvailable" className="ml-2 block text-sm font-medium text-[var(--text-on-dark-muted)]">
                Product is Available
            </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={product_loading || user_loading}
            className="px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[150px]"
          >
            {product_loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {product_loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </>
  );
};

export default NewProductPage;

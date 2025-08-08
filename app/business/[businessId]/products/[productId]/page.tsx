"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useProductContext } from '@/app/lib/context/ProductContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, AlertCircle, Edit3, Package, DollarSign, CheckCircle, XCircle, Info } from 'lucide-react';

const ProductInfoPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const productId = params.productId as string;

  const { user, user_loading } = useUserContext();
  const { 
    product, 
    fetchProduct, 
    product_loading, 
    error_product 
  } = useProductContext();

  useEffect(() => {
    if (productId && user) {
      // Include business details if needed for display, e.g., product.business.name
      fetchProduct(productId, { include: 'business' }); 
    }
  }, [productId, user, fetchProduct]);

  if (user_loading || (product_loading && !product)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading product information...</p>
      </div>
    );
  }

  if (error_product || (!product && !product_loading)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Product Information</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{error_product || "Product not found or an error occurred."}</p>
        <Link href={`/business/${businessId}/products`} className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Back to Products
        </Link>
      </div>
    );
  }
  
  if (!product) { // Should be caught by above, but as a fallback
    return (
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
            <Info className="h-12 w-12 text-[var(--icon-accent-primary)] mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-center text-[var(--text-on-dark-muted)]">The requested product could not be found.</p>
            <Link href={`/business/${businessId}/products`} className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
            Back to Products
            </Link>
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-page-heading)] flex items-center">
          <Package className="h-8 w-8 mr-3 text-[var(--icon-accent-primary)]" />
          Product: <span className="text-[var(--color-accent-primary)] ml-2">{product.name}</span>
        </h2>
        <Link 
          href={`/business/${businessId}/products/${productId}/update`} 
          className="px-4 py-2 bg-[var(--color-accent-secondary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors flex items-center"
        >
          <Edit3 className="h-5 w-5 mr-2" />
          Edit Product
        </Link>
      </div>

      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg">
        {/* Product Image Section */}
        {product.imageUrl && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] mb-3">Product Image</h3>
            <div className="w-full max-w-md h-64 rounded-lg overflow-hidden bg-[var(--bg-badge)]">
              <Image
                src={product.imageUrl}
                alt={product.name || 'Product image'}
                width={400}
                height={300}
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Product Name</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">{product.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Business</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">
              {product.business ? (
                <Link href={`/business/${product.businessId}`} className="text-[var(--color-accent-primary)] hover:underline">
                  {product.business.name}
                </Link>
              ) : (
                product.businessId
              )}
            </p>
          </div>
        </div>

        {product.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Description</h3>
            <p className="text-base text-[var(--text-on-dark-primary)] whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />Price
            </h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">
              {product.price ? `${parseFloat(product.price).toFixed(2)} ${product.currency || 'USD'}` : 'Not set'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Currency</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">{product.currency || 'Not set'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Availability</h3>
            <p className={`text-lg flex items-center ${product.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
              {product.isAvailable ? 
                <><CheckCircle className="h-5 w-5 mr-2" /> Available</> : 
                <><XCircle className="h-5 w-5 mr-2" /> Not Available</>
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Product ID</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)] font-mono bg-[var(--bg-badge)] p-1 rounded-sm inline-block">{product.productId}</p>
            </div>
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Short ID</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)] font-mono bg-[var(--bg-badge)] p-1 rounded-sm inline-block">{product.shortId || 'N/A'}</p>
            </div>
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Created At</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)]">{new Date(product.createdAt).toLocaleString()}</p>
            </div>
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Last Updated</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)]">{new Date(product.updatedAt).toLocaleString()}</p>
            </div>
        </div>

        {/* Add more sections for images, variants, stock, etc. as needed */}
      </div>
    </>
  );
};

export default ProductInfoPage;

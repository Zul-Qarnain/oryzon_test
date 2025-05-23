"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProductContext } from '@/app/lib/context/ProductContext';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Package, PlusCircle, AlertCircle, Settings, Eye, Edit3 } from 'lucide-react'; // Added Package, Edit3
import { ProductWithIncludes } from '@/backend/services/products/products.types';

const BusinessProductsListPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const { 
    products, 
    fetchProducts, 
    product_loading, 
    error_product 
  } = useProductContext();
  const { 
    business, 
    fetchBusiness, 
    businessLoading, 
    businessError 
  } = useBusinessContext();

  useEffect(() => {
    if (businessId && user) {
      fetchBusiness(businessId); // Fetch business details for context (e.g., name)
      fetchProducts({ filter: { businessId } }); // Fetch products for this business
    }
  }, [businessId, user, fetchBusiness, fetchProducts]);

  const ProductCard: React.FC<{ product: ProductWithIncludes }> = ({ product }) => {
    const priceValue = product.price ? parseFloat(product.price) : null;
    return (
      <div className="bg-[var(--bg-card)] p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-3">
            <Package className="h-7 w-7 text-[var(--icon-accent-primary)] mr-3" />
            <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] truncate" title={product.name || `Product ID: ${product.productId}`}>
              {product.name || `Product ${product.productId.substring(0,8)}...`}
            </h3>
          </div>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Price: <span className="font-medium text-[var(--text-on-dark-secondary)]">${priceValue !== null && !isNaN(priceValue) ? priceValue.toFixed(2) : 'N/A'}</span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            SKU: <span className="font-medium text-[var(--text-on-dark-secondary)]">{product.sku || 'N/A'}</span>
          </p>
          {product.description && (
            <p className="text-sm text-[var(--text-on-dark-muted)] mt-2 mb-3 line-clamp-2" title={product.description}>
              {product.description}
            </p>
          )}
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-4">
            Stock: <span className="font-medium text-[var(--text-on-dark-secondary)]">{product.sku ?? 'N/A'}</span>
          </p>
        </div>
      <div className="flex justify-end space-x-2 mt-auto pt-3 border-t border-[var(--border-light)]">
        {/* Placeholder for future actions like view details or edit */}
        {/* <button
            onClick={() => router.push(`/business/${businessId}/product/${product.productId}`)} // Example: view product details
            className="p-2 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-dark-secondary)] rounded-md transition-colors flex items-center"
            title="View Product Details"
        >
            <Eye size={14} className="mr-1" /> View
        </button> */}
        <button
            onClick={() => router.push(`/business/${businessId}/product/edit/${product.productId}`)} // Example: edit product
            className="p-2 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-dark-secondary)] rounded-md transition-colors flex items-center"
            title="Edit Product"
        >
            <Edit3 size={14} className="mr-1" /> Edit
        </button>
      </div>
    </div>
  )};

  if (user_loading || (businessLoading && !business) || (product_loading && products.length === 0 && !error_product && !businessError)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading products...</p>
      </div>
    );
  }

  if (!user && !user_loading) {
    router.push('/user/signIn');
    return null;
  }
  
  if (businessError) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Business</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{businessError}</p>
        <Link href="/home" className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-page-heading)]">
            Products for {business?.name || 'Business'}
          </h2>
          <p className="text-[var(--text-on-dark-muted)] mt-1">Manage all your products.</p>
        </div>
        <Link
          href={`/business/${businessId}/product/new`}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-lg hover:bg-opacity-80 transition-colors flex items-center justify-center whitespace-nowrap"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Product
        </Link>
      </div>

      {product_loading && !error_product && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--icon-accent-primary)]" />
          <p className="ml-3 text-[var(--text-on-dark-secondary)]">Fetching products...</p>
        </div>
      )}

      {error_product && (
        <div className="my-6 p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md flex items-center">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Failed to load products</h4>
            <p className="text-sm">{error_product}</p>
          </div>
        </div>
      )}

      {!product_loading && !error_product && products.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg shadow">
          <Package className="h-16 w-16 text-[var(--icon-accent-primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] mb-2">No Products Found</h3>
          <p className="text-[var(--text-on-dark-muted)] mb-6">
            Get started by adding your first product.
          </p>
          <Link
            href={`/business/${businessId}/product/new`}
            className="px-6 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors inline-flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Product
          </Link>
        </div>
      )}

      {!product_loading && !error_product && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessProductsListPage;

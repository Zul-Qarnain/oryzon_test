"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrderContext } from '@/app/lib/context/OrderContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, AlertCircle, Edit3, ShoppingCart, DollarSign, CheckCircle, XCircle, Info, User, Tag, Hash, CalendarDays, Truck } from 'lucide-react';
import { Order } from '@/backend/services/orders/orders.types';
import { Product } from '@/backend/services/products/products.types';

const OrderInfoContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const orderId = params.orderId as string;

  const { user, user_loading } = useUserContext();
  const {
    order,
    fetchOrder,
    order_loading,
    error_order
  } = useOrderContext();

  useEffect(() => {
    if (orderId && user) {
      fetchOrder(orderId, { include: 'business,customer,orderItems.product,connectedChannel' });
    }
  }, [orderId, user, fetchOrder]);

  if (user_loading || (order_loading && !order)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading order information...</p>
      </div>
    );
  }

  if (error_order || (!order && !order_loading)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Order Information</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{error_order || "Order not found or an error occurred."}</p>
        <Link href={`/business/${businessId}/orders`} className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <Info className="h-12 w-12 text-[var(--icon-accent-primary)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">The requested order could not be found.</p>
        <Link href={`/business/${businessId}/orders`} className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Back to Orders
        </Link>
      </div>
    );
  }
  
  const totalAmountValue = order.totalAmount ? parseFloat(order.totalAmount) : null;

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-page-heading)] flex items-center">
          <ShoppingCart className="h-8 w-8 mr-3 text-[var(--icon-accent-primary)]" />
          Order: <span className="text-[var(--color-accent-primary)] ml-2">{order.orderId.substring(0,15)}...</span>
        </h2>
        <Link
          href={`/business/${businessId}/orders/${orderId}/update`}
          className="px-4 py-2 bg-[var(--color-accent-secondary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors flex items-center"
        >
          <Edit3 className="h-5 w-5 mr-2" />
          Update Order
        </Link>
      </div>

      <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><User className="h-4 w-4 mr-1" />Customer</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">{order.customer?.fullName || order.customerId}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><DollarSign className="h-4 w-4 mr-1" />Total Amount</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">
              {totalAmountValue !== null && !isNaN(totalAmountValue) ? `${totalAmountValue.toFixed(2)} ${order.currency}` : 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><Tag className="h-4 w-4 mr-1" />Status</h3>
            <p className={`text-lg font-semibold ${
              order.orderStatus === ('DELIVERED' as Order['orderStatus']) ? 'text-green-400'
              : order.orderStatus === ('CANCELLED' as Order['orderStatus']) || order.orderStatus === ('REFUNDED' as Order['orderStatus']) ? 'text-red-400'
              : 'text-[var(--text-on-dark-primary)]'
            }`}>
              {order.orderStatus || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><Hash className="h-4 w-4 mr-1" />Channel</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">{order.connectedChannel?.platformType || order.channelId}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><CalendarDays className="h-4 w-4 mr-1" />Order Date</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
           <div>
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><Info className="h-4 w-4 mr-1" />Business</h3>
            <p className="text-lg text-[var(--text-on-dark-primary)]">
              {order.business ? (
                <Link href={`/business/${order.businessId}`} className="text-[var(--color-accent-primary)] hover:underline">
                  {order.business.name}
                </Link>
              ) : (
                order.businessId
              )}
            </p>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)] flex items-center"><Truck className="h-4 w-4 mr-1" />Shipping Address</h3>
            <p className="text-base text-[var(--text-on-dark-primary)] whitespace-pre-wrap">{order.shippingAddress}</p>
          </div>
        )}

        
        
        {order.orderItems && order.orderItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-on-dark-primary)] mb-3">Order Items ({order.orderItems.length})</h3>
            <div className="space-y-3">
              {order.orderItems.map(item => {
                const product = item.product as Product | undefined | null;
                return (
                  <div key={item.orderItemId} className="p-3 bg-[var(--bg-badge)] rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[var(--text-on-dark-primary)]">
                        {product?.name || `Product ID: ${item.productId}`}
                      </p>
                      <p className="text-sm text-[var(--text-on-dark-muted)]">
                        SKU: {product?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                    <p className="text-sm text-[var(--text-on-dark-primary)]">Qty: {item.quantity}</p>
                    <p className="text-sm text-[var(--text-on-dark-primary)]">
                      @ {item.priceAtPurchase ? `${parseFloat(item.priceAtPurchase).toFixed(2)} ${order.currency}` : 'N/A'}
                    </p>
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-light)]">
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Order ID</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)] font-mono bg-[var(--bg-badge)] p-1 rounded-sm inline-block">{order.orderId}</p>
            </div>
            <div>
                <h3 className="text-sm font-medium text-[var(--text-on-dark-muted)]">Last Updated</h3>
                <p className="text-sm text-[var(--text-on-dark-primary)]">{new Date(order.updatedAt).toLocaleString()}</p>
            </div>
        </div>
      </div>
    </>
  );
};

export default OrderInfoContent;

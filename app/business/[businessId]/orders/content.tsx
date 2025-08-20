"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrderContext } from '@/app/lib/context/OrderContext';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, ShoppingCart, PlusCircle, AlertCircle, Eye, Edit3 } from 'lucide-react';
import { OrderWithIncludes } from '@/backend/services/orders/orders.types';

const BusinessOrdersListContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const {
    orders,
    fetchOrders,
    order_loading,
    error_order
  } = useOrderContext();
  const {
    business,
    fetchBusiness,
    businessLoading,
    businessError
  } = useBusinessContext();

  useEffect(() => {
    if (businessId && user) {
      fetchBusiness(businessId);
      fetchOrders({ filter: { businessId }, include: 'customer,orderItems' });
    }
  }, [businessId, user, fetchBusiness, fetchOrders]);

  const OrderCard: React.FC<{ order: OrderWithIncludes }> = ({ order }) => {
    const totalAmountValue = order.totalAmount ? parseFloat(order.totalAmount) : null;
    return (
      <div className="bg-[var(--bg-card)] p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-3">
            <ShoppingCart className="h-7 w-7 text-[var(--icon-accent-primary)] mr-3" />
            <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] truncate" title={`Order ID: ${order.orderId}`}>
              Order {order.orderId.substring(0, 8)}...
            </h3>
          </div>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Customer: <span className="font-medium text-[var(--text-on-dark-secondary)]">{order.customer?.fullName || order.customerId}</span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Total: <span className="font-medium text-[var(--text-on-dark-secondary)]">
              {totalAmountValue !== null && !isNaN(totalAmountValue) ? `${totalAmountValue.toFixed(2)} ${order.currency}` : 'N/A'}
            </span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Status: <span className="font-medium text-[var(--text-on-dark-secondary)]">{order.orderStatus || 'N/A'}</span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Items: <span className="font-medium text-[var(--text-on-dark-secondary)]">{order.orderItems?.length || 0}</span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mt-2 mb-3">
            Created: <span className="font-medium text-[var(--text-on-dark-secondary)]">{new Date(order.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
        <div className="flex justify-end space-x-2 mt-auto pt-3 border-t border-[var(--border-light)]">
          <button
            onClick={() => router.push(`/business/${businessId}/orders/${order.orderId}`)}
            className="p-2 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-dark-secondary)] rounded-md transition-colors flex items-center"
            title="View Order Details"
          >
            <Eye size={14} className="mr-1" /> View
          </button>
          <button
            onClick={() => router.push(`/business/${businessId}/orders/${order.orderId}/update`)}
            className="p-2 text-xs bg-[var(--color-accent-secondary)] hover:bg-opacity-80 text-white rounded-md transition-colors flex items-center"
            title="Update Order"
          >
            <Edit3 size={14} className="mr-1" /> Edit
          </button>
        </div>
      </div>
    );
  };

  if (user_loading || (businessLoading && !business) || (order_loading && orders.length === 0 && !error_order && !businessError)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading orders...</p>
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
            Orders for {business?.name || 'Business'}
          </h2>
          <p className="text-[var(--text-on-dark-muted)] mt-1">Manage all your customer orders.</p>
        </div>
        <Link
          href={`/business/${businessId}/orders/new`}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-lg hover:bg-opacity-80 transition-colors flex items-center justify-center whitespace-nowrap"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Order
        </Link>
      </div>

      {order_loading && !error_order && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--icon-accent-primary)]" />
          <p className="ml-3 text-[var(--text-on-dark-secondary)]">Fetching orders...</p>
        </div>
      )}

      {error_order && (
        <div className="my-6 p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md flex items-center">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Failed to load orders</h4>
            <p className="text-sm">{error_order}</p>
          </div>
        </div>
      )}

      {!order_loading && !error_order && orders.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg shadow">
          <ShoppingCart className="h-16 w-16 text-[var(--icon-accent-primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] mb-2">No Orders Found</h3>
          <p className="text-[var(--text-on-dark-muted)] mb-6">
            Get started by adding your first order.
          </p>
          <Link
            href={`/business/${businessId}/orders/new`}
            className="px-6 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors inline-flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Order
          </Link>
        </div>
      )}

      {!order_loading && !error_order && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessOrdersListContent;

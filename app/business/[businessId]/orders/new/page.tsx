"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/app/lib/context/UserContext';
import { useOrderContext } from '@/app/lib/context/OrderContext';
import { Loader2, AlertCircle, ChevronLeft, ShoppingCart, Save } from 'lucide-react';
import { CreateOrderData, CreateOrderItemData, Order } from '@/backend/services/orders/orders.types';

const NewOrderPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user_loading, FUser } = useUserContext();
  const { createOrder, order_loading, error_order, cleanError_Order } = useOrderContext();

  const [customerId, setCustomerId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [orderStatus, setOrderStatus] = useState('PENDING'); // Default status
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [orderItemsInput, setOrderItemsInput] = useState(''); // JSON string for order items

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    cleanError_Order();
  }, [cleanError_Order, businessId]);

  useEffect(() => {
    if (error_order) {
      setFormError(error_order);
    } else {
      setFormError(null);
    }
  }, [error_order]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    cleanError_Order();
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
    if (!customerId.trim()) {
      setFormError('Customer ID is required.');
      return;
    }
    if (!channelId.trim()) {
      setFormError('Channel ID is required.');
      return;
    }
    const parsedTotalAmount = parseFloat(totalAmount);
    if (isNaN(parsedTotalAmount) || parsedTotalAmount <= 0) {
      setFormError('Valid total amount is required (must be > 0).');
      return;
    }
    if (!currency.trim() || currency.trim().length !== 3) {
      setFormError('A valid 3-letter currency code is required (e.g., USD).');
      return;
    }

    let parsedOrderItems: CreateOrderItemData[];
    try {
      parsedOrderItems = JSON.parse(orderItemsInput);
      if (!Array.isArray(parsedOrderItems) || parsedOrderItems.length === 0) {
        setFormError('At least one order item is required. Please provide a valid JSON array.');
        return;
      }
      // Basic validation for order items
      for (const item of parsedOrderItems) {
        if (!item.productId || typeof item.quantity !== 'number' || typeof item.priceAtPurchase !== 'string') {
          setFormError('Each order item must have productId, quantity (number), and priceAtPurchase (string).');
          return;
        }
      }
    } catch (err) {
      setFormError('Invalid JSON format for Order Items. Please check the structure.');
      return;
    }

    const orderPayload: Omit<CreateOrderData, 'providerUserId'> & { businessId: string } = {
      businessId,
      customerId: customerId.trim(),
      channelId: channelId.trim(),
      totalAmount: parsedTotalAmount.toString(),
      currency: currency.trim().toUpperCase(),
      orderStatus: orderStatus as Order['orderStatus'],
      shippingAddress: shippingAddress.trim(),
      orderItems: parsedOrderItems,
    };

    const response = await createOrder(orderPayload);

    if (response.error) {
      setFormError(response.error);
    } else if (response.result) {
      setFormSuccess(`Order for customer ${response.result.customerId} created successfully! Order ID: ${response.result.orderId}`);
      setCustomerId('');
      setChannelId('');
      setTotalAmount('');
      setCurrency('USD');
      setOrderStatus('PENDING');
      setShippingAddress('');
      setBillingAddress('');
      setOrderItemsInput('');
      setTimeout(() => {
        router.push(`/business/${businessId}/orders`);
      }, 2000);
    } else {
      setFormError("An unexpected error occurred. The order might not have been created.");
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
            Add New Order
          </h2>
          <p className="text-[var(--text-on-dark-muted)]">
            Fill in the details to add a new order to your business.
          </p>
        </div>
        <Link
          href={`/business/${businessId}/orders`}
          className="flex items-center text-sm text-[var(--text-on-dark-muted)] hover:text-[var(--text-on-dark-primary)] transition-colors bg-[var(--bg-secondary)] hover:bg-[var(--bg-accent)] px-3 py-2 rounded-md"
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Orders
        </Link>
      </div>

      {formSuccess && (
        <div className="mb-6 p-4 bg-green-600/20 text-green-300 border border-green-500 rounded-md flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Customer ID <span className="text-red-500">*</span></label>
            <input
              id="customerId" type="text" placeholder="Enter Customer ID"
              value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
              required
            />
          </div>
          <div>
            <label htmlFor="channelId" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Channel ID <span className="text-red-500">*</span></label>
            <input
              id="channelId" type="text" placeholder="Enter Channel ID"
              value={channelId} onChange={(e) => setChannelId(e.target.value)}
              className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="totalAmount" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Total Amount <span className="text-red-500">*</span></label>
            <input
              id="totalAmount" type="number" placeholder="e.g., 49.99"
              value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
              min="0.01" step="0.01"
              className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
              required
            />
          </div>
          <div>
            <label htmlFor="orderCurrency" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Currency <span className="text-red-500">*</span></label>
            <input
              id="orderCurrency" type="text" placeholder="e.g., USD"
              value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3} minLength={3}
              className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
              required
            />
          </div>
          <div>
            <label htmlFor="orderStatus" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Order Status</label>
            <select
              id="orderStatus"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
            >
              {/* Values should match your backend enum/type for orderStatus */}
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="shippingAddress" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Shipping Address</label>
          <textarea
            id="shippingAddress" placeholder="Enter shipping address"
            value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
            rows={3}
            className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          />
        </div>

        <div>
          <label htmlFor="billingAddress" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Billing Address</label>
          <textarea
            id="billingAddress" placeholder="Enter billing address (if different from shipping)"
            value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}
            rows={3}
            className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          />
        </div>
        
        <div>
          <label htmlFor="orderItems" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
            Order Items (JSON format) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="orderItems"
            placeholder='[{"productId": "prod_xyz", "quantity": 1, "priceAtPurchase": "19.99"}, {"productId": "prod_abc", "quantity": 2, "priceAtPurchase": "9.99"}]'
            value={orderItemsInput}
            onChange={(e) => setOrderItemsInput(e.target.value)}
            rows={5}
            className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)] font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-[var(--text-on-dark-muted)]">
            Provide a JSON array of items. Each item needs: <code>productId</code> (string), <code>quantity</code> (number), <code>priceAtPurchase</code> (string).
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={order_loading || user_loading}
            className="px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[150px]"
          >
            {order_loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {order_loading ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </>
  );
};

export default NewOrderPage;

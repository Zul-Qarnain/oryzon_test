#!/bin/bash

# Function to refactor a route
refactor_route() {
    local route_path="$1"
    local component_name="$2"
    local contexts="$3"
    
    echo "Refactoring $route_path..."
    
    # Check if page.tsx exists
    if [ ! -f "$route_path/page.tsx" ]; then
        echo "  Skipping $route_path - no page.tsx found"
        return
    fi
    
    # Move page.tsx to content.tsx
    mv "$route_path/page.tsx" "$route_path/content.tsx"
    
    # Update component name in content.tsx
    sed -i "s/const [^:]*Page[^:]*:/const ${component_name}Content:/g" "$route_path/content.tsx"
    sed -i "s/export default [^;]*Page[^;]*;/export default ${component_name}Content;/g" "$route_path/content.tsx"
    
    # Create new page.tsx
    cat > "$route_path/page.tsx" << EOF
import { FetchProvider } from '@/app/lib/context/FetchContext';
$contexts
import ${component_name}Content from './content';

export default function ${component_name}Page() {
  return (
    <FetchProvider>
$3
      <${component_name}Content />
$3
    </FetchProvider>
  );
}
EOF
    
    echo "  ✓ Completed $route_path"
}

# Refactor remaining business routes
refactor_route "app/business/[businessId]/customers" "BusinessCustomersList" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { CustomerProvider } from '@/app/lib/context/CustomerContext';" "      <UserProvider>
        <BusinessProvider>
          <CustomerProvider>"

refactor_route "app/business/[businessId]/orders" "BusinessOrdersList" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';" "      <UserProvider>
        <BusinessProvider>
          <OrderProvider>"

refactor_route "app/business/[businessId]/chats" "BusinessChatsList" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChatProvider } from '@/app/lib/context/ChatContext';" "      <UserProvider>
        <BusinessProvider>
          <ChatProvider>"

refactor_route "app/business/[businessId]/settings" "BusinessSettings" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';" "      <UserProvider>
        <BusinessProvider>"

refactor_route "app/business/[businessId]/trychat" "BusinessTryChat" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { TryChatProvider } from '@/app/lib/context/TryChatContext';" "      <UserProvider>
        <BusinessProvider>
          <TryChatProvider>"

# Refactor new routes
refactor_route "app/business/[businessId]/channel/new" "NewChannel" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChannelProvider } from '@/app/lib/context/ChannelContext';" "      <UserProvider>
        <BusinessProvider>
          <ChannelProvider>"

refactor_route "app/business/[businessId]/products/new" "NewProduct" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';" "      <UserProvider>
        <BusinessProvider>
          <ProductProvider>"

refactor_route "app/business/[businessId]/orders/new" "NewOrder" "import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import { CustomerProvider } from '@/app/lib/context/CustomerProvider';" "      <UserProvider>
        <BusinessProvider>
          <OrderProvider>
            <ProductProvider>
              <CustomerProvider>"

echo "All routes refactored successfully!"

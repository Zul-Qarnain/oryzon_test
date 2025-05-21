import { db } from '@/db';
import { businesses, users, connectedChannels, products, customers, orders } from '@/db/schema';
import { Business, NewBusiness, CreateBusinessPayload, UpdateBusinessPayload, BusinessWithRelations } from './businesses.types';
import { eq, and, desc, InferSelectModel } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export class BusinessesService {
  // Get a single business by its ID, optionally with relations
  async getBusinessById(businessId: string, includeRelations: boolean = false): Promise<BusinessWithRelations | undefined> {
    if (!includeRelations) {
      return db.query.businesses.findFirst({
        where: eq(businesses.businessId, businessId),
      });
    }

    return db.query.businesses.findFirst({
      where: eq(businesses.businessId, businessId),
      with: {
        user: true, // Fetches all columns for the 'user' relation
        userViaProviderId: true, // Fetches all columns for the 'userViaProviderId' relation
        connectedChannels: true,
        products: true,
        customers: true,
        orders: true,
      },
    });
  }

  // Get all businesses for a specific user (by userId)
  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    return db.query.businesses.findMany({
      where: eq(businesses.userId, userId),
      orderBy: [desc(businesses.createdAt)],
    });
  }

    // Get all businesses for a specific user (by providerUserId)
  async getBusinessesByProviderUserId(providerUserId: string): Promise<Business[]> {
    return db.query.businesses.findMany({
      where: eq(businesses.providerUserId, providerUserId),
      orderBy: [desc(businesses.createdAt)],
    });
  }

  // Create a new business
  async createBusiness(payload: CreateBusinessPayload): Promise<Business> {
    const newBusinessData: NewBusiness = {
      userId: payload.userId,
      providerUserId: payload.providerUserId,
      name: payload.name,
      description: payload.description ?? null,
      // createdAt and updatedAt are handled by the database default
    };
    const result = await db.insert(businesses).values(newBusinessData).returning();
    return result[0];
  }

  // Update an existing business
  async updateBusiness(businessId: string, payload: UpdateBusinessPayload): Promise<Business | undefined> {
    if (Object.keys(payload).length === 0) {
      return this.getBusinessById(businessId); // No changes, return current
    }
    const updatedBusinessData: Partial<NewBusiness> = {
      ...payload,
      updatedAt: new Date(), // Manually set updatedAt
    };
    const result = await db.update(businesses)
      .set(updatedBusinessData)
      .where(eq(businesses.businessId, businessId))
      .returning();
    return result[0];
  }

  // Delete a business
  // Consider cascading deletes or soft deletes based on application requirements
  async deleteBusiness(businessId: string): Promise<{ success: boolean }> {
    // TODO: Implement deletion logic.
    // This might involve checking for related entities (channels, products, etc.)
    // and deciding on a strategy (e.g., disallow deletion if related entities exist,
    // or cascade delete them, or set businessId to null on them if allowed).
    // For now, a simple delete:
    try {
      await db.delete(businesses).where(eq(businesses.businessId, businessId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting business:", error);
      return { success: false };
    }
  }

  // Example: Get businesses with a specific channel platform type
  async getBusinessesByChannelPlatform(platform: InferSelectModel<typeof connectedChannels>['platformType']): Promise<Business[]> {
    const result = await db
      .selectDistinctOn([businesses.businessId], { // Select distinct businesses based on businessId
        businessId: businesses.businessId,
        userId: businesses.userId,
        providerUserId: businesses.providerUserId,
        name: businesses.name,
        description: businesses.description,
        createdAt: businesses.createdAt,
        updatedAt: businesses.updatedAt,
      })
      .from(businesses)
      .innerJoin(connectedChannels, eq(businesses.businessId, connectedChannels.businessId)) // Use innerJoin if we only want businesses WITH such channels
      .where(eq(connectedChannels.platformType, platform))
      .orderBy(businesses.businessId, businesses.createdAt); // DISTINCT ON requires an ORDER BY clause, added createdAt for stable sort
    return result;
  }
}

export const businessesService = new BusinessesService();

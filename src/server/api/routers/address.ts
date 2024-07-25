import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { addresses } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

export const addressRouter = createTRPCRouter({
    createAddress: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                street: z.string(),
                city: z.string().optional(),
                country: z.string(),
            })
        )
        .mutation(async({ ctx, input }) => {
            try {
                const newAddress = await ctx.db.insert(addresses).values({
                    id: input.id,
                    street: input.street,
                    city: input.city,
                    country: input.country
                })

                return {
                    data: newAddress
                }
            } catch(error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create address"
                })
            }
        }),
    
    getAddresses: publicProcedure
        .query(async({ ctx }) => {
            try {
                const addressList = await ctx.db.query.addresses.findMany();
                
                return {
                    data: addressList.map(({ id, street, city, country}) => ({
                        id,
                        street,
                        city,
                        country
                    }))
                }
            } catch(error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch addresses"
                })
            }
        }),

    getAddressById: publicProcedure
        .input(
            z.object({
                id: z.string()
            })
        )
        .query(async({ ctx, input }) => {
            const address = await ctx.db
                .select({
                    id: addresses.id,
                    street: addresses.street,
                    city: addresses.city,
                    country: addresses.country,
                })
                .from(addresses)
                .where(eq(addresses.id, input.id))

            if(!address) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Address not found"
                })
            }

            return {
                data: address
            }
        }),
    
    updateAddress: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                street: z.string(),
                city: z.string().optional(),
                country: z.string()
            })
        )
        .mutation(async({ ctx, input}) => {
            const result = await ctx.db
                .update(addresses)
                .set({
                street: input.street,
                city: input.city,
                country: input.country,
                })
                .where(eq(addresses.id, input.id))
                .returning();
            if (result.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Address not found"
                });
            }
        
            return {
                message: "Address successfully updated",
                data: result[0]
            };
        }),

    deleteAddress: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async({ ctx, input }) => {
            const result = await ctx.db
            .delete(addresses)
            .where(eq(addresses.id, input.id ))
            .returning();

            if (result.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Address not found"
                });
            }

            return {
                message: "Address successfully deleted"
            };
    }),
})
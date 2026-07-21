import { z } from "zod";
import { VEHICLE_TYPES } from "../../config/vehicle-types";
import {
  PROVINCE_STATUSES,
  DISTRICT_STATUSES,
  TAXI_STAND_SOURCE_TYPES,
  TAXI_STAND_STATUSES,
  TARIFF_STATUSES,
  POPULAR_ROUTE_SOURCE_TYPES,
  POPULAR_ROUTE_STATUSES,
  POI_STATUSES,
  POI_CATEGORIES,
} from "./enums";

/**
 * All dates in the data layer are plain calendar dates (YYYY-MM-DD), not timestamps —
 * every date field here is a business/editorial date (tariff effective date, last
 * verification date), not a system clock reading, so there is no timezone to reconcile.
 */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD olmalı");
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Geçersiz slug biçimi");

// Turkey's rough bounding box. Province/district-level containment is enforced by
// scripts/validate-geography.ts, which checks against real admin boundaries — this is
// just a cheap first line of defense at the schema level.
const latitude = z.number().min(35.8).max(42.2);
const longitude = z.number().min(25.5).max(44.9);

export const ProvinceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  plateCode: z.number().int().min(1).max(81),
  officialCode: z.string().min(1),
  region: z.string().min(1),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  landlineAreaCodes: z.array(z.string().regex(/^0\d{3}$/)),
  status: z.enum(PROVINCE_STATUSES),
  createdAt: dateString,
  updatedAt: dateString,
});
export type Province = z.infer<typeof ProvinceSchema>;

export const DistrictSchema = z.object({
  id: z.string().min(1),
  provinceId: z.string().min(1),
  name: z.string().min(1),
  slug,
  officialCode: z.string().min(1),
  formerNames: z.array(z.string()).default([]),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  status: z.enum(DISTRICT_STATUSES),
  createdAt: dateString,
  updatedAt: dateString,
});
export type District = z.infer<typeof DistrictSchema>;

export const TaxiStandSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  provinceId: z.string().min(1),
  districtId: z.string().min(1),
  neighborhood: z.string().optional(),
  address: z.string().optional(),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
  openingHours: z.string().optional(),
  is24Hours: z.boolean().optional(),
  website: z.url().optional(),
  mapQuery: z.string().optional(),
  sourceType: z.enum(TAXI_STAND_SOURCE_TYPES),
  sourceName: z.string().min(1),
  sourceUrl: z.url().optional(),
  sourceRecordId: z.string().optional(),
  sourceDate: dateString.optional(),
  lastVerifiedAt: dateString.optional(),
  confidenceScore: z.number().min(0).max(100),
  status: z.enum(TAXI_STAND_STATUSES),
  createdAt: dateString,
  updatedAt: dateString,
  internalNotes: z.string().optional(),
});
export type TaxiStand = z.infer<typeof TaxiStandSchema>;

export const TariffSchema = z.object({
  id: z.string().min(1),
  provinceId: z.string().min(1),
  districtId: z.string().optional(),
  vehicleType: z.enum(VEHICLE_TYPES),
  openingFee: z.number().nonnegative(),
  pricePerKm: z.number().positive(),
  minimumFare: z.number().nonnegative(),
  waitingFeePerMinute: z.number().nonnegative().optional(),
  nightMultiplier: z.number().positive().optional(),
  validFrom: dateString,
  validUntil: dateString.optional(),
  sourceName: z.string().min(1),
  sourceUrl: z.url().optional(),
  sourceDocument: z.string().optional(),
  sourceDate: dateString.optional(),
  lastVerifiedAt: dateString,
  confidenceScore: z.number().min(0).max(100),
  status: z.enum(TARIFF_STATUSES),
  createdAt: dateString,
  updatedAt: dateString,
});
export type Tariff = z.infer<typeof TariffSchema>;

export const PopularRouteSchema = z.object({
  id: z.string().min(1),
  slug,
  originName: z.string().min(1),
  destinationName: z.string().min(1),
  provinceId: z.string().min(1),
  originDistrictId: z.string().optional(),
  destinationDistrictId: z.string().optional(),
  distanceKm: z.number().positive(),
  estimatedDurationMinutes: z.number().positive().optional(),
  tollFee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  sourceType: z.enum(POPULAR_ROUTE_SOURCE_TYPES),
  sourceUrl: z.url().optional(),
  lastVerifiedAt: dateString,
  searchPriority: z.number().int().min(0),
  status: z.enum(POPULAR_ROUTE_STATUSES),
});
export type PopularRoute = z.infer<typeof PopularRouteSchema>;

export const AirportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  iataCode: z.string().length(3).optional(),
  provinceId: z.string().min(1),
  districtId: z.string().min(1),
  locationNote: z.string().optional(),
  website: z.url().optional(),
  sourceUrl: z.url().optional(),
  lastVerifiedAt: dateString,
  status: z.enum(POI_STATUSES),
});
export type Airport = z.infer<typeof AirportSchema>;

export const BusTerminalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  provinceId: z.string().min(1),
  districtId: z.string().min(1),
  address: z.string().optional(),
  sourceUrl: z.url().optional(),
  lastVerifiedAt: dateString,
  status: z.enum(POI_STATUSES),
});
export type BusTerminal = z.infer<typeof BusTerminalSchema>;

export const PointOfInterestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  category: z.enum(POI_CATEGORIES),
  provinceId: z.string().min(1),
  districtId: z.string().min(1),
  address: z.string().optional(),
  nearestStandIds: z.array(z.string()).default([]),
  sourceUrl: z.url().optional(),
  lastVerifiedAt: dateString,
  status: z.enum(POI_STATUSES),
});
export type PointOfInterest = z.infer<typeof PointOfInterestSchema>;

export const OverrideSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  phonePrimary: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
  delete: z.boolean().default(false),
  reason: z.string().min(1),
  verifiedAt: dateString,
});
export type OverrideRecord = z.infer<typeof OverrideSchema>;

export const RedirectSchema = z.object({
  fromPath: z.string().startsWith("/"),
  toPath: z.string().startsWith("/"),
  statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]),
  reason: z.string().min(1),
  createdAt: dateString,
});
export type RedirectRecord = z.infer<typeof RedirectSchema>;

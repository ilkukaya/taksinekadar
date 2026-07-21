export const PROVINCE_STATUSES = ["active", "archived"] as const;
export type ProvinceStatus = (typeof PROVINCE_STATUSES)[number];

export const DISTRICT_STATUSES = ["active", "archived"] as const;
export type DistrictStatus = (typeof DISTRICT_STATUSES)[number];

export const TAXI_STAND_SOURCE_TYPES = [
  "municipality",
  "chamber",
  "open-data",
  "osm",
  "official-website",
  "manual",
] as const;
export type TaxiStandSourceType = (typeof TAXI_STAND_SOURCE_TYPES)[number];

export const TAXI_STAND_STATUSES = [
  "active",
  "unverified",
  "needs-review",
  "temporarily-closed",
  "permanently-closed",
  "duplicate",
  "archived",
] as const;
export type TaxiStandStatus = (typeof TAXI_STAND_STATUSES)[number];

/** Statuses that may still be indexed/rendered publicly (see spec §19). */
export const PUBLIC_TAXI_STAND_STATUSES: readonly TaxiStandStatus[] = [
  "active",
  "temporarily-closed",
];

export const TARIFF_STATUSES = ["active", "expired", "unverified", "archived"] as const;
export type TariffStatus = (typeof TARIFF_STATUSES)[number];

export const POPULAR_ROUTE_SOURCE_TYPES = ["official", "manual", "open-data"] as const;
export type PopularRouteSourceType = (typeof POPULAR_ROUTE_SOURCE_TYPES)[number];

export const POPULAR_ROUTE_STATUSES = ["active", "unverified", "archived"] as const;
export type PopularRouteStatus = (typeof POPULAR_ROUTE_STATUSES)[number];

export const POI_STATUSES = ["active", "unverified", "archived"] as const;
export type PoiStatus = (typeof POI_STATUSES)[number];

export const POI_CATEGORIES = ["hospital", "shopping-center"] as const;
export type PoiCategory = (typeof POI_CATEGORIES)[number];

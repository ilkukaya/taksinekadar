export const VEHICLE_TYPES = [
  "standard",
  "yellow",
  "turquoise",
  "black",
  "vip",
  "eight-plus-one",
  "local-special",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  standard: "Standart Taksi",
  yellow: "Sarı Taksi",
  turquoise: "Turkuaz Taksi",
  black: "Siyah Taksi",
  vip: "VIP Taksi",
  "eight-plus-one": "8+1 Taksi",
  "local-special": "Yerel Özel Tarife",
};

export const VEHICLE_TYPE_DESCRIPTIONS: Record<VehicleType, string> = {
  standard: "Şehir içinde yaygın standart taksi hizmeti.",
  yellow: "İstanbul başta olmak üzere büyükşehirlerde yaygın sarı taksi.",
  turquoise: "İstanbul'da özel izinle çalışan turkuaz taksi.",
  black: "Konforlu araçlarla sunulan premium siyah taksi.",
  vip: "Üst segment araçlarla sunulan VIP taksi hizmeti.",
  "eight-plus-one": "Daha fazla yolcu kapasiteli 8+1 taksi.",
  "local-special": "Yerel otorite tarafından tanımlanmış özel tarife.",
};

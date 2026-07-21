import { describe, expect, it } from "vitest";
import { getAllProvinces } from "../src/lib/repositories/provinces";
import { getAllDistricts } from "../src/lib/repositories/districts";
import { getCurrentTariffs, getTariffHistory } from "../src/lib/repositories/tariffs";
import { getAllAirports } from "../src/lib/repositories/airports";
import { getAllBusTerminals } from "../src/lib/repositories/bus-terminals";

describe("provinces.csv", () => {
  const provinces = getAllProvinces();
  const active = provinces.filter((p) => p.status === "active");

  it("has exactly 81 active provinces", () => {
    expect(active).toHaveLength(81);
  });

  it("has unique plate codes from 1 to 81", () => {
    const plateCodes = provinces.map((p) => p.plateCode).sort((a, b) => a - b);
    expect(new Set(plateCodes).size).toBe(81);
    expect(Math.min(...plateCodes)).toBe(1);
    expect(Math.max(...plateCodes)).toBe(81);
  });

  it("has unique slugs", () => {
    const slugs = provinces.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("maps well-known plate codes to the correct province", () => {
    const byPlateCode = new Map(provinces.map((p) => [p.plateCode, p.name]));
    expect(byPlateCode.get(34)).toBe("İstanbul");
    expect(byPlateCode.get(6)).toBe("Ankara");
    expect(byPlateCode.get(35)).toBe("İzmir");
    expect(byPlateCode.get(1)).toBe("Adana");
  });
});

describe("districts.csv", () => {
  const provinces = getAllProvinces();
  const provinceIds = new Set(provinces.map((p) => p.id));
  const districts = getAllDistricts();

  it("has a total around the well-known 973 districts figure", () => {
    expect(districts.length).toBe(973);
  });

  it("every district references a real province", () => {
    const orphaned = districts.filter((d) => !provinceIds.has(d.provinceId));
    expect(orphaned).toEqual([]);
  });

  it("has no duplicate (provinceId, slug) pairs", () => {
    const keys = districts.map((d) => `${d.provinceId}::${d.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not keep a renamed district's old name as a separate active record", () => {
    // Eyüpsultan (formerly Eyüp) must exist once, with the old name tracked, not duplicated.
    const istanbulDistricts = districts.filter((d) => d.provinceId === "34");
    const eyup = istanbulDistricts.filter((d) => d.name === "Eyüp");
    const eyupsultan = istanbulDistricts.find((d) => d.name === "Eyüpsultan");
    expect(eyup).toEqual([]);
    expect(eyupsultan?.formerNames).toContain("Eyüp");
  });
});

describe("tariffs.csv", () => {
  const tariffs = getCurrentTariffs();
  const active = tariffs.filter((t) => t.status === "active");

  it("every active tariff has a source name and a validFrom date", () => {
    for (const tariff of active) {
      expect(tariff.sourceName.length).toBeGreaterThan(0);
      expect(tariff.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has no negative or zero per-km price", () => {
    for (const tariff of tariffs) {
      expect(tariff.pricePerKm).toBeGreaterThan(0);
    }
  });

  it("has no two active tariffs for the same province+district+vehicleType", () => {
    const keys = active.map((t) => `${t.provinceId}::${t.districtId ?? ""}::${t.vehicleType}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("tariff-history entries have validUntil on or after validFrom when both are set", () => {
    for (const tariff of getTariffHistory()) {
      if (tariff.validUntil) {
        expect(tariff.validUntil >= tariff.validFrom).toBe(true);
      }
    }
  });
});

describe("airports.csv and bus-terminals.csv", () => {
  const provinceIds = new Set(getAllProvinces().map((p) => p.id));
  const districtIds = new Set(getAllDistricts().map((d) => d.id));

  it("every airport references a real province and district", () => {
    for (const airport of getAllAirports()) {
      expect(provinceIds.has(airport.provinceId)).toBe(true);
      expect(districtIds.has(airport.districtId)).toBe(true);
    }
  });

  it("every bus terminal references a real province and district", () => {
    for (const terminal of getAllBusTerminals()) {
      expect(provinceIds.has(terminal.provinceId)).toBe(true);
      expect(districtIds.has(terminal.districtId)).toBe(true);
    }
  });
});

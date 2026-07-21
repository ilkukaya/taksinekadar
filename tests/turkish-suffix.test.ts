import { describe, expect, it } from "vitest";
import {
  getLocativeSuffix,
  getDativeSuffix,
  getAblativeSuffix,
  getGenitiveSuffix,
  formatProperNounSuffix,
  locativeOf,
  dativeOf,
  ablativeOf,
  genitiveOf,
} from "../src/lib/language/turkish-suffix";

describe("formatProperNounSuffix", () => {
  it("joins word and suffix with an apostrophe", () => {
    expect(formatProperNounSuffix("İstanbul", "da")).toBe("İstanbul'da");
  });
});

describe("locativeOf — exact examples from the project spec", () => {
  const cases: [string, string][] = [
    ["İstanbul", "İstanbul'da"],
    ["Ankara", "Ankara'da"],
    ["İzmir", "İzmir'de"],
    ["Kadıköy", "Kadıköy'de"],
    ["Beşiktaş", "Beşiktaş'ta"],
    ["Edremit", "Edremit'te"],
  ];

  it.each(cases)("%s -> %s", (word, expected) => {
    expect(locativeOf(word)).toBe(expected);
  });
});

describe("locativeOf — broader province coverage across harmony/devoicing classes", () => {
  const cases: [string, string][] = [
    ["Bursa", "Bursa'da"],
    ["Konya", "Konya'da"],
    ["Adana", "Adana'da"],
    ["Antalya", "Antalya'da"],
    ["Muğla", "Muğla'da"],
    ["Sinop", "Sinop'ta"],
    ["Kayseri", "Kayseri'de"],
    ["Sakarya", "Sakarya'da"],
    ["Rize", "Rize'de"],
    ["Sivas", "Sivas'ta"],
    ["Zonguldak", "Zonguldak'ta"],
    ["Bayburt", "Bayburt'ta"],
    ["Erzincan", "Erzincan'da"],
    ["Diyarbakır", "Diyarbakır'da"],
    ["Gümüşhane", "Gümüşhane'de"],
    ["Çanakkale", "Çanakkale'de"],
    ["Elazığ", "Elazığ'da"],
    ["Kırşehir", "Kırşehir'de"],
    ["Uşak", "Uşak'ta"],
    ["Yozgat", "Yozgat'ta"],
    ["Tunceli", "Tunceli'de"],
    ["Şırnak", "Şırnak'ta"],
    ["Iğdır", "Iğdır'da"],
    ["Batman", "Batman'da"],
    ["Yalvaç", "Yalvaç'ta"],
  ];

  it.each(cases)("%s -> %s", (word, expected) => {
    expect(locativeOf(word)).toBe(expected);
  });
});

describe("getDativeSuffix", () => {
  it("adds a 'y' buffer when the stem ends in a vowel", () => {
    expect(getDativeSuffix("Ankara")).toBe("ya");
  });

  it("adds no buffer when the stem ends in a consonant", () => {
    expect(getDativeSuffix("İstanbul")).toBe("a");
  });
});

describe("dativeOf", () => {
  const cases: [string, string][] = [
    ["İstanbul", "İstanbul'a"],
    ["Ankara", "Ankara'ya"],
    ["İzmir", "İzmir'e"],
    ["Kayseri", "Kayseri'ye"],
    ["Kadıköy", "Kadıköy'e"],
    ["Bursa", "Bursa'ya"],
  ];

  it.each(cases)("%s -> %s", (word, expected) => {
    expect(dativeOf(word)).toBe(expected);
  });
});

describe("getAblativeSuffix", () => {
  it("uses back-vowel harmony with a voiced ending", () => {
    expect(getAblativeSuffix("İstanbul")).toBe("dan");
  });

  it("devoices after a voiceless-ending stem", () => {
    expect(getAblativeSuffix("Beşiktaş")).toBe("tan");
  });
});

describe("ablativeOf", () => {
  const cases: [string, string][] = [
    ["İstanbul", "İstanbul'dan"],
    ["Kayseri", "Kayseri'den"],
    ["Antalya", "Antalya'dan"],
    ["Beşiktaş", "Beşiktaş'tan"],
  ];

  it.each(cases)("%s -> %s", (word, expected) => {
    expect(ablativeOf(word)).toBe(expected);
  });
});

describe("genitiveOf", () => {
  const cases: [string, string][] = [
    ["Ankara", "Ankara'nın"],
    ["İstanbul", "İstanbul'un"],
    ["İzmir", "İzmir'in"],
    ["Konya", "Konya'nın"],
    ["Bayburt", "Bayburt'un"],
    ["Görele", "Görele'nin"],
    ["Söğüt", "Söğüt'ün"],
  ];

  it.each(cases)("%s -> %s", (word, expected) => {
    expect(genitiveOf(word)).toBe(expected);
  });
});

describe("suffix logic on synthetic words (exercises ç/h/f devoicing not present in province names)", () => {
  it("devoices locative after ç", () => {
    expect(getLocativeSuffix("Kaç")).toBe("ta");
  });

  it("devoices locative after h", () => {
    expect(getLocativeSuffix("Sabah")).toBe("ta");
  });

  it("devoices locative after f", () => {
    expect(getLocativeSuffix("Tuhaf")).toBe("ta");
  });

  it("does not devoice after a voiced consonant", () => {
    expect(getLocativeSuffix("Erzurum")).toBe("da");
  });
});

describe("getGenitiveSuffix four-way harmony groups", () => {
  it("groups a/ı stems as -ın", () => {
    expect(getGenitiveSuffix("Ankara")).toBe("nın");
  });
  it("groups e/i stems as -in", () => {
    expect(getGenitiveSuffix("İzmir")).toBe("in");
  });
  it("groups o/u stems as -un", () => {
    expect(getGenitiveSuffix("İstanbul")).toBe("un");
  });
  it("groups ö/ü stems as -ün", () => {
    expect(getGenitiveSuffix("Söğüt")).toBe("ün");
  });
});

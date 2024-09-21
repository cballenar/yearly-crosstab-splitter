import { assertEquals } from "jsr:@std/assert@1";
import splitCrosstabData, { type SplitCrosstabDataResults } from "./main.ts";

Deno.test("splitCrosstabData", () => {
  const data = [
    [
      "Name",
      "1990 Red",
      "1990 Blue",
      "1991 Red",
      "1991 Blue",
      "1993 Red",
      "1993 Blue",
    ],
    ["Alex", "12", "34", "56", "78", "90", "23"],
    ["Beth", "45", "67", "89", "12", "34", "56"],
    ["Cara", "78", "90", "23", "45", "67", "89"],
    ["Dave", "12", "34", "56", "78", "90", "23"],
  ];
  const result: SplitCrosstabDataResults = splitCrosstabData(data);
  const expectedResult = new Map([
    [
      "Alex",
      {
        1990: { Red: "12", Blue: "34" },
        1991: { Red: "56", Blue: "78" },
        1993: { Red: "90", Blue: "23" },
      },
    ],
    [
      "Beth",
      {
        1990: { Red: "45", Blue: "67" },
        1991: { Red: "89", Blue: "12" },
        1993: { Red: "34", Blue: "56" },
      },
    ],
    [
      "Cara",
      {
        1990: { Red: "78", Blue: "90" },
        1991: { Red: "23", Blue: "45" },
        1993: { Red: "67", Blue: "89" },
      },
    ],
    [
      "Dave",
      {
        1990: { Red: "12", Blue: "34" },
        1991: { Red: "56", Blue: "78" },
        1993: { Red: "90", Blue: "23" },
      },
    ],
  ]);

  assertEquals(result, expectedResult);
});

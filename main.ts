import { parse, stringify } from "jsr:@std/csv";

/**
 * Splits a CSV file containing 1:2 dimensional data into multiple flattened CSV files.
 *
 * @param inputFilePath - The path to the input CSV file.
 *
 * The input CSV file is expected to have the following axis:
 * - Main Dimension column, e.g., States.
 * - Yearly columns for multiple dimensions, e.g., 1990 Red, 1990 Blue, 1991 Red, 1991 Blue, 1992...
 *
 * The output CSV files are saved in the "output" directory, with each file named after the main dimension.
 */
const splitData = (inputFilePath: string): void => {
  // Import file.
  const inputFile = Deno.readFileSync(inputFilePath);

  // Parse csv file as table.
  const table = parse(new TextDecoder().decode(inputFile), {
    skipFirstRow: false,
  });

  // Get headers from first row.
  const headers = table[0];

  // Detect the repeating parts of the headers
  const repeatingParts = headers.slice(1).reduce((acc, header) => {
    const parts = header.split(" ");
    const metric = parts.slice(1).join(" ");
    if (!acc.includes(metric)) acc.push(metric);
    return acc;
  }, [] as string[]);

  // Detect the years
  const years = headers.slice(1).reduce((acc, header) => {
    const parts = header.split(" ");
    const year = parseInt(parts[0]);
    if (!isNaN(year) && !acc.includes(year)) acc.push(year);
    return acc;
  }, [] as number[]);

  // Define dimension data.
  const dimensionData = new Map<string, string[][]>();

  // Parse remaining rows as dimensions.
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const dimension = row[0];

    // If dimension data does not exist, create it.
    if (!dimensionData.has(dimension)) dimensionData.set(dimension, []);

    // Parse each year data into dimension data.
    for (const year of years) {
      const yearData = repeatingParts.map(
        (part) => row[headers.indexOf(`${year} ${part}`)]
      );
      dimensionData.get(dimension)?.push(yearData);
    }
  }

  // Create output directory if it does not exist.
  Deno.mkdirSync("output", { recursive: true });

  // Parse each dimension data object into its own file.
  for (const [dimension, data] of dimensionData.entries()) {
    const outputTable = [["Year", ...repeatingParts]];
    for (const year of years) {
      const row = data[years.indexOf(year)];
      outputTable.push([year.toString(), ...row]);
    }
    // Write output file.
    Deno.writeFileSync(
      `output/${dimension}.csv`,
      new TextEncoder().encode(stringify(outputTable))
    );
    console.log(`Exported ${dimension}.csv`);
  }

  console.log("Finished!");
};

// read input path from command first argument
splitData(Deno.args[0]);

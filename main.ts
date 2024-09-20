import { parse, stringify } from "jsr:@std/csv";

/**
 * Splits a CSV file containing crosstab data into multiple CSV files.
 *
 * @param inputFilePath - The path to the input CSV file.
 *
 * The input CSV file is expected to have the following axis:
 * - Main Dimension column, e.g., States.
 * - Yearly columns for multiple dimensions, e.g., 1990 Red, 1990 Blue, 1991 Red, 1991 Blue, 1992...
 *
 * The output CSV files are saved in the "output" directory, with each file named after the main dimension.
 */
export default function splitCrosstabData(
  data: string[][]
): Map<string, { [year: number]: { [metric: string]: string } }> {
  // Get headers from first row.
  const headers = data[0];

  // Detect the repeating parts of the headers
  const subDimensions = headers.slice(1).reduce((acc, header) => {
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
  const dimensionData = new Map<
    string,
    { [year: number]: { [metric: string]: string } }
  >();

  // Parse remaining rows as dimensions.
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const mainDimension = row[0];

    // If dimension data does not exist, create it.
    if (!dimensionData.has(mainDimension)) dimensionData.set(mainDimension, {});

    // Parse each year data into dimension data.
    for (const year of years) {
      const yearData: { [metric: string]: string } = {};
      for (const part of subDimensions) {
        yearData[part] = row[headers.indexOf(`${year} ${part}`)];
      }
      dimensionData.get(mainDimension)![year] = yearData;
    }
  }

  return dimensionData;
}

/**
 *  Splits a CSV file containing crosstab data into multiple CSV files.
 * @param inputPath   The path to the input CSV file.
 * @param outputPath  The path to the output directory.
 */
export function splitCrosstabFile(inputPath: string, outputPath: string) {
  const inputFile = Deno.readFileSync(inputPath);
  const data = parse(new TextDecoder().decode(inputFile), {
    skipFirstRow: false,
  });

  // Split data into multiple CSV files.
  const splitData = splitCrosstabData(data);

  // Create output directory if it does not exist.
  Deno.mkdirSync(outputPath, { recursive: true });

  // Parse each dimension data object into its own file.
  for (const [mainDimension, data] of splitData.entries()) {
    // Parse years.
    const years = Object.keys(data).map((year) => parseInt(year));

    // Determine the keys dynamically from the first year's data.
    const firstYearData = data[years[0]];
    const subDimensions = Object.keys(firstYearData);

    // Initialize the output table with headers.
    const outputTable = [["Year", ...subDimensions]];
    for (const year of years) {
      const yearData = data[year];
      const row = [
        year.toString(),
        ...Object.keys(yearData).map((key) => yearData[key]),
      ];
      outputTable.push(row);
    }

    // Write output file.
    Deno.writeFileSync(
      `${outputPath}/${mainDimension}.csv`,
      new TextEncoder().encode(stringify(outputTable))
    );
  }
}

// If running from command line, assume import and export of files.
if (import.meta.main) {
  // If the script is run directly from the command line, read input path from user input
  const inputPath =
    Deno.args[0] ||
    prompt("Enter the path to the input CSV file (./data.csv):") ||
    "data.csv";
  const outputPath =
    Deno.args[1] ||
    prompt("Enter the path to the output directory (./output):") ||
    "output";

  try {
    splitCrosstabFile(inputPath, outputPath);
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

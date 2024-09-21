import { parse, stringify } from "jsr:@std/csv@1";

/**
 * A map of each main dimension (first item of arrays) with their respective data tabulated by year and metric.
 */
export type SplitCrosstabDataResults = Map<
  string,
  {
    [year: number]: {
      [metric: string]: string;
    };
  }
>;

/**
 * Splits an array of crosstab data into a SplitCrosstabDataResults map.
 *
 * @param data An array of arrays containing crosstab data.
 * @returns A map of each main dimension with their respective data tabulated.
 */
export default function splitCrosstabData(
  data: string[][]
): SplitCrosstabDataResults {
  // Get headers from first row.
  const headers = data[0];

  // Detect the repeating parts of the headers
  const subDimensions = headers.slice(1).reduce((acc, header) => {
    // This assumes that the header is in the format "[Year] [Metric Name]".
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
  const splitData: SplitCrosstabDataResults = new Map();

  // Parse remaining rows as dimensions.
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const mainDimension = row[0];

    // If dimension data does not exist, create it.
    if (!splitData.has(mainDimension)) splitData.set(mainDimension, {});

    // Parse each year data into dimension data.
    for (const year of years) {
      const yearData: { [metric: string]: string } = {};
      for (const part of subDimensions) {
        yearData[part] = row[headers.indexOf(`${year} ${part}`)];
      }
      splitData.get(mainDimension)![year] = yearData;
    }
  }

  return splitData;
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

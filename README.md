# Yearly Crosstab Splitter

Splits a CSV file containing crosstab data into multiple CSV files named after the main dimension (first columnn).

| Name | 1990 Red | 1990 Blue | 1991 Red | 1991 Blue | 1993 Red | 1993 Blue |
| ---- | -------- | --------- | -------- | --------- | -------- | --------- |
| Alex | 12       | 34        | 56       | 78        | 90       | 23        |
| Beth | 45       | 67        | 89       | 12        | 34       | 56        |
| Cara | 78       | 90        | 23       | 45        | 67       | 89        |
| Dave | 12       | 34        | 56       | 78        | 90       | 23        |

The above table will be split into multiple files for each name. For example:

```
# Alex.csv
Year,Red,Blue
1990,12,34
1991,56,78
1992,90,23
```

And so on for the other names.

## Usage in CLI

```bash
# defaults to "data.csv" as input file and "./output" as output directory
deno run split
```

```bash
# specify input file and output directory
deno run split my-file.csv ./my-output
```

## Usage as Module

```typescript
import splitCrosstabData from "https://raw.githubusercontent.com/cballenar/yearly-crosstab-splitter/master/main.ts";

// Import file.
const inputFile = Deno.readFileSync("my-file.csv");
const data = parse(new TextDecoder().decode(inputFile), {
  skipFirstRow: false,
});

// Split data into multiple CSV files.
const splitData = splitCrosstabData(data);

// Work with data...
```

## About

Started as a simple script for splitting a repeating case. It then turned into a way to learn more about Deno and its module system.

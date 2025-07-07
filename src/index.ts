import * as fs from "fs";
import * as path from "path";
import { additionalData } from "./additional-data";
import { token } from "./token";
import axios from "axios";

let objectNameStartIndex = 80;
const disableDeclaration = false; // Set to true to disable declaration processing
const disableInvoice = true; // Set to true to disable invoice processing

/**
 * Parse args from command line arguments
 */
function parseArgs(): string[] {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("No arguments provided. Using default directories.");
    return ["test-beyanname"];
  }
  return args;
}

/**
 * Increment the object name for each declaration
 *
 * @returns {string} The incremented object name with filled zeros four
 */
function incrementObjectName(): string {
  const incrementedName = objectNameStartIndex.toString().padStart(4, "0");
  objectNameStartIndex += 1;
  return incrementedName;
}

async function requestToRelayhub(args: {
  declarationBase64String: string | null;
  declarationFilename: string | null;
  invoiceBase64String: string | null;
  invoiceFilename: string | null;
  referansNo: string;
}): Promise<void> {
  const {
    declarationBase64String,
    invoiceBase64String,
    referansNo,
    declarationFilename,
    invoiceFilename,
  } = args;

  try {
    const documents: any[] = [];
    const invoiceDocument = {
      type: "base64",
      base64String: invoiceBase64String,
      fileType: "invoice",
      filename: invoiceFilename,
    };
    const declarationDocument = {
      type: "base64",
      base64String: declarationBase64String,
      fileType: "tr_export_declaration",
      filename: declarationFilename,
    };
    if (invoiceBase64String && !disableInvoice) {
      documents.push(invoiceDocument);
    }
    if (declarationBase64String && !disableDeclaration) {
      documents.push(declarationDocument);
    }

    const additionalAutoIncrement = incrementObjectName();
    const additionalDataTmp = structuredClone(additionalData);
    additionalDataTmp.declaration.forEach((declaration) => {
      declaration.objectIdentification.objectName = `${declaration.objectIdentification.objectName}${additionalAutoIncrement}`;
    });

    const requestObject = {
      referenceNo: referansNo + "_" + additionalAutoIncrement,
      dispatchCountry: "TR",
      destinationCountry: "DE",
      regimeType: "EXPORT",
      outputApplication: "dakosy/sftp/vera",
      documents: documents,
      additionalData: additionalDataTmp,
    };

    try {
      console.log(`Start reference number: ${referansNo}`);

      const response = await axios.post(
        "https://dev-relayhub.singlewindow.io/api/v1-0/job-orders/init",
        requestObject,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`Request sent successfully for ${referansNo}.`);
    } catch (error: any) {
      console.error("Error sending request to Relayhub:");
      console.dir(error?.response?.data || error, {
        depth: null,
        colors: true,
      });
      throw error;
    }
  } catch (error) {
    console.error(`Error processing request for ${referansNo}:`, error);
    throw error;
  }
}

async function prepareRequestToRelayhub(
  files: fs.Dirent[],
  directoryName: string
): Promise<void> {
  if (!files?.length) {
    console.log(`No files found in directory: ${directoryName}`);
    return;
  }

  console.log(`Directory: ${directoryName}`);

  // Filter only files (not directories)
  const actualFiles = files.filter((file) => file.isFile());

  if (actualFiles.length === 0) {
    console.log(`No files found in directory: ${directoryName}`);
    return;
  }

  const referansNo = directoryName;
  const declaration = actualFiles.find(
    (file) =>
      file.name.toLowerCase().includes("beyanname") ||
      file.name.toLowerCase().includes("declaration")
  );
  const invoice = actualFiles.find(
    (file) =>
      file.name.toLowerCase().includes("fatura") ||
      file.name.toLowerCase().includes("invoice")
  );

  try {
    const declarationBase64String = declaration
      ? await fs.promises.readFile(
          path.join(directoryName, declaration.name),
          "base64"
        )
      : null;

    const invoiceBase64String = invoice
      ? await fs.promises.readFile(
          path.join(directoryName, invoice.name),
          "base64"
        )
      : null;

    if (!declarationBase64String && !invoiceBase64String) {
      console.log(`No valid files found in directory: ${directoryName}`);
      console.dir(declaration, { depth: null, colors: true });
      console.dir(invoice, { depth: null, colors: true });
      return;
    }

    await requestToRelayhub({
      referansNo,
      declarationBase64String,
      declarationFilename: declaration?.name ?? null,
      invoiceBase64String,
      invoiceFilename: invoice?.name ?? null,
    });
  } catch (error) {
    console.error(`Error reading files in ${directoryName}:`, error);
  }

  //   console.dir(
  //     {
  //       referansNo,
  //       declaration: declaration ? declaration.name : "Not found",
  //       invoice: invoice ? invoice.name : "Not found",
  //     },
  //     {
  //       depth: null,
  //       colors: true,
  //     }
  //   );
}

async function testRelayhub(directories: string[]): Promise<void> {
  for (const directory of directories) {
    try {
      // Check if the directory exists
      if (!fs.existsSync(directory)) {
        console.error(`Directory does not exist: ${directory}`);
        continue;
      }

      const files = await fs.promises.readdir(directory, {
        withFileTypes: true,
      });
      // filter dot files and directories
      const filteredFiles = files.filter((file) => !file.name.startsWith("."));

      await prepareRequestToRelayhub(filteredFiles, directory);
      //   console.dir(filteredFiles, { depth: null, colors: true });
    } catch (error) {
      console.error(`Error checking directory ${directory}:`, error);
      continue;
    }
  }
}

/**
 * Reads a directory and logs all subdirectory names
 * @param directoryPath - The path to the directory to read
 */
async function readFoldersAndLog(directoryPath: string): Promise<void> {
  try {
    // Check if the directory exists
    if (!fs.existsSync(directoryPath)) {
      console.error(`Directory does not exist: ${directoryPath}`);
      return;
    }

    // Read the directory contents
    const items = await fs.promises.readdir(directoryPath, {
      withFileTypes: true,
    });

    // Filter only directories (folders)
    const folders = items.filter((item) => item.isDirectory());

    if (folders.length === 0) {
      console.log(`No folders found in: ${directoryPath}`);
      return;
    }

    console.log(`\nFolders found in "${directoryPath}":`);
    console.log("=".repeat(50));

    await testRelayhub(
      folders.map((folder) => path.join(directoryPath, folder.name))
    );

    // folders.forEach((folder, index) => {
    //   console.log(`${index + 1}. ${folder.name}`);
    //   console.dir(folder, { depth: null, colors: true });
    // });

    console.log("=".repeat(50));
    console.log(`Total folders: ${folders.length}`);
  } catch (error) {
    console.error("Error reading directory:", error);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Get the directory path from command line arguments or use current directory
  const targetDirectory =
    process.argv[2] || "beyanname-07-07-2025-v2" || process.cwd();

  console.log(`Reading folders from: ${targetDirectory}`);
  await readFoldersAndLog(targetDirectory);
}

// Run the main function
main().catch(console.error);

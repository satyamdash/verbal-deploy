import fs from "fs";
import path from "path";

// Function to recursively get all files in a directory and its subdirectories
export const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    // Read all files and folders in the current directory
    const allFilesAndFolders = fs.readdirSync(folderPath);

    // Iterate through each item in the directory
    allFilesAndFolders.forEach(file => {
        // Get the full path of the current item
        const fullFilePath = path.join(folderPath, file);

        // Check if the current item is a directory
        if (fs.statSync(fullFilePath).isDirectory()) {
            // If it's a directory, recursively call getAllFiles and concat the results
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            // If it's a file, add its full path to the response array
            response.push(fullFilePath);
        }
    });

    // Return the array of all file paths
    return response;
}
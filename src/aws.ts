import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import { getAllFiles } from "./file";

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Downloads all files from a specified S3 folder to the local file system
// prefix: The S3 folder path to download
export async function downloadS3Folder(prefix: string) {
    const bucketName = process.env.AWS_BUCKET_NAME!;
    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix
    });
    
    const allFiles = await s3Client.send(listCommand);
    
    // Create a promise for each file to download
    const allPromises = allFiles.Contents?.map(async ({ Key }) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key
            });
            
            const { Body } = await s3Client.send(getObjectCommand);
            if (Body instanceof Readable) {
                Body.pipe(fs.createWriteStream(finalOutputPath)).on("finish", () => {
                    resolve("");
                });
            } else {
                console.error("Unexpected body type");
                resolve("");
            }
        });
    }) || [];
    console.log("awaiting");

    // Wait for all downloads to complete
    await Promise.all(allPromises?.filter(x => x !== undefined));
}

// Function to upload a file to S3
export const uploadFile = async (fileName: string, localFilePath: string) => {
    // Get the bucket name from environment variables
    const bucketName = process.env.AWS_BUCKET_NAME;
    if (!bucketName) {
        throw new Error("AWS_BUCKET_NAME is not set in the environment variables");
    }

    // Read the contents of the local file
    const fileContent = fs.readFileSync(localFilePath);

    // Create a PutObjectCommand to upload the file to S3
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,  // The name of the file in S3
        Body: fileContent,  // The actual file content
    });

    try {
        // Send the upload command to S3
        const response = await s3Client.send(command);
        console.log(response);
    } catch (err) {
        console.error("Error", err);
        throw err; // Re-throw the error for the caller to handle
    }
}

export const copyFinalDest = (id: string) => {
    const folderPath =path.join(__dirname, `output/${id}/build`)
    const files = getAllFiles(folderPath);

        //Uploading files to S3
        files.forEach(async file => {
            await uploadFile(`build/${id}/`+file.slice(folderPath.length + 1), file);
        })
}


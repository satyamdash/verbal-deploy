import { createClient, commandOptions } from "redis";
import { downloadS3Folder } from "./aws";
import { buildProject } from "./utils";
import { getAllFiles } from "./file";
import { uploadFile } from "./aws";
import { copyFinalDest } from "./aws";
import path from "path";

const subscriber = createClient();
subscriber.connect();

async function main() {
    while(1) {
        const res = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'deploy-queue',
            0
          );
        console.log(res?.element);

        const id=res?.element;     
        await downloadS3Folder(`output/${id}`)
        console.log("downloaded")
        if (id) {
        await buildProject(id)
        }

        if (id) {
            copyFinalDest(id)
        }
    }
}
main();

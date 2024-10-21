import { createClient, commandOptions } from "redis";

const subscriber = createClient();
subscriber.connect();

async function main() {
    while(1) {
        const res = await subscriber.brPop(
            commandOptions({ isolated: true }),
            'deploy-queue',
            0
          );
		console.log(res)
    }
}
main();
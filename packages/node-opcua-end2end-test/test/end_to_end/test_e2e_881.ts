import { get_mini_nodeset_filename, nodesets, OPCUAClient, OPCUAServer, UserTokenType } from "node-opcua";
import { networkInterfaces } from "os";

function getIpAddresses() {
    const nets = networkInterfaces();
    const results: any = {};
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === "IPv4" && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    console.log(results);
    return [].concat.apply([], Object.values(results));
}
const port = 2000;
const ip = getIpAddresses();

async function startServer(): Promise<OPCUAServer> {
    // get IP of the machine
    const mini = get_mini_nodeset_filename();
    console.log(ip);
    const server = new OPCUAServer({
        port,
        alternateHostname: ip,
        nodeset_filename: [mini],
        userManager: {
            isValidUser(userName: string, password: string): boolean {
                if (userName === "test" && password === "test") {
                    return true;
                }
                return false;
            }
        }
    });
    await server.initialize();
    await server.start();
    console.log(`server started ${port}`);
    return server;
}
describe(" Alternate name should not confuse endpoints", () => {
    let server: OPCUAServer;
    before(async () => {
        server = await startServer();
    });
    after(async () => {
        await server.shutdown();
    });
    it("", async () => {
        const client = OPCUAClient.create({ endpoint_must_exist: false });
        client.on("backoff", () => console.log("keep trying", endpointUri));

        const endpointUri = `opc.tcp://${ip[0]}:${port}`;
        console.log("endpoint = ", endpointUri);
        await client.connect(endpointUri);

        try {
            const session = await client.createSession({
                type: UserTokenType.UserName,
                password: "test",
                userName: "test"
            });
            await session.close();
        } catch (err) {
            throw err;
        } finally {
            await client.disconnect();
        }
    });
});

import DogmaSocket from "../modules/socket";
import User from "./user";
import Node from "./node";
declare namespace Connection {
    type Id = string;
    type IPv4 = string;
    type IPv6 = string;
    const enum Status {
        notConnected = 0,
        connected = 1,
        error = 2,
        notAuthorized = 3,
        authorized = 4
    }
    const enum Group {
        unknown = 0,
        all = 1,
        friends = 2,
        selfUser = 3,
        selfNode = 4,
        nobody = 5
    }
    const enum Direction {
        outcoming = 0,
        incoming = 1
    }
    interface Description {
        connection_id: Id;
        address: string;
        user_id: User.Id;
        node_id: Node.Id;
        status: number;
    }
    type SocketArray = {
        [index: string]: DogmaSocket;
    };
    type Peer = {
        host: string;
        port: number;
        address: string;
        public?: boolean;
        version?: 4 | 6;
    };
}
export default Connection;
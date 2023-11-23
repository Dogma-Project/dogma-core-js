import { User } from "./user";
import { Node } from "./node";
import { Connection } from "./connection";
export declare namespace Discovery {
    type Card = {
        type: "dogma-router";
        user_id: User.Id;
        node_id: Node.Id;
        port: number;
    };
    type Candidate = {
        type: "dogma-router";
        user_id: User.Id;
        node_id: Node.Id;
        local_ipv4: Connection.IPv6;
        local_ipv6?: Connection.IPv6;
    };
}

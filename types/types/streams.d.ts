/// <reference types="node" />
export declare namespace Streams {
    enum MX {
        dummy = 0,
        handshake = 1,
        test = 2,
        control = 3,
        messages = 4,
        mail = 5,
        dht = 6,
        web = 7,
        file = 8
    }
    type DemuxedResult = {
        mx: MX;
        data: Buffer;
        descriptor?: string;
    };
    enum SIZES {
        MX = 1,
        LEN = 2
    }
}

declare namespace Streams {
  export const enum MX {
    dummy, // edit
    handshake,
    test,
    control,
    messages,
    mail,
    dht,
  }
  export type DemuxedResult = {
    mx: MX;
    data: Buffer;
    descriptor?: string; // edit
  };
}

export default Streams;
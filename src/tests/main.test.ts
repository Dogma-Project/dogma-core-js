// import assert from "node:assert";
import { describe, it } from "node:test";

process.argv.push("--prefix=test");
process.argv.push("--loglevel=0");

import { Keys, State, Model, Types } from "../index";
import { DEFAULTS } from "../constants";

describe("Functional test", () => {
  it("Start", (t) => {
    State.stateManager.subscribe([Types.Event.Type.services], ([services]) => {
      // console.log("Services", services);
    });
  });

  it("Create keypair", async () => {
    State.storage.user.name = "Test user";
    State.storage.node.name = "Test node";
    await Keys.createKeyPair(Types.Keys.Type.masterKey, 2048);
    State.stateManager.emit(
      Types.Event.Type.masterKey,
      Types.System.States.ready
    );
    await Keys.createKeyPair(Types.Keys.Type.nodeKey, 1024);
    State.stateManager.emit(
      Types.Event.Type.nodeKey,
      Types.System.States.ready
    );
    await Model.configModel.persistConfig([
      {
        param: Types.Event.Type.configRouter,
        value: 34601,
      },
      {
        param: Types.Event.Type.configAutoDefine,
        value: DEFAULTS.AUTO_DEFINE_IP,
      },
      {
        param: Types.Event.Type.configDhtAnnounce,
        value: Types.Connection.Group.friends,
      },
      {
        param: Types.Event.Type.configDhtLookup,
        value: Types.Connection.Group.friends,
      },
      {
        param: Types.Event.Type.configDhtBootstrap,
        value: Types.Connection.Group.friends,
      },
      {
        param: Types.Event.Type.configExternal,
        value: DEFAULTS.EXTERNAL,
      },
    ]);
    process.exit();
  });
});
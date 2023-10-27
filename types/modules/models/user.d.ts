import { User } from "../../types";
import Datastore from "@seald-io/nedb";
import Model from "./_model";
import StateManager from "../state";
declare class UserModel implements Model {
    stateBridge: StateManager;
    db: Datastore;
    constructor({ state }: {
        state: StateManager;
    });
    init(): Promise<void>;
    getAll(): Promise<Record<string, any>[]>;
    loadUsersTable(): Promise<void>;
    persistUser(user: User.Model): Promise<{
        numAffected: number;
        affectedDocuments: import("@seald-io/nedb").Document<Record<string, any>> | import("@seald-io/nedb").Document<Record<string, any>>[] | null;
        upsert: boolean;
    } | import("@seald-io/nedb").Document<{
        sync_id: string;
        user_id: string;
        name: string;
        avatar?: string | undefined;
    }>>;
    /**
     * @todo set to deleted state instead of remove
     */
    removeUser(user_id: User.Id): Promise<boolean>;
    /**
     * @todo delete _id
     */
    sync(data: User.Model[], from: User.Id): Promise<boolean>;
}
export default UserModel;

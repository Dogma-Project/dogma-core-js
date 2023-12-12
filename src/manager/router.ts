import { RequestListener } from "node:http";
import Request from "./helpers/request";
import ResponseError from "./responses/error";
import PrefixController from "./controllers/prefix";
import logger from "../modules/logger";
import PrefixesController from "./controllers/prefixes";
import ResponseOptions from "./responses/options";

const Router: RequestListener = (req, res) => {
  try {
    const request = Request(req);
    if (request.method === "OPTIONS") return ResponseOptions(res);
    switch (request.path[0]) {
      case "prefix":
        PrefixController(request, res);
        break;
      case "prefixes":
        PrefixesController(request, res);
        break;
      default:
        ResponseError(res, 404, { message: "Invalid path" });
        break;
    }
  } catch (err) {
    logger.warn("API", err);
    ResponseError(res, 400, { message: "Bad request" });
  }
};

export default Router;
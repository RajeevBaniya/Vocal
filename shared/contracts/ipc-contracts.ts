import type { AppConfigContract, ConfigUpdateContract } from "./config-contracts";
import type { AppStatusSnapshot } from "../types/shared-types";

type IpcRequestMap = {
  "app:get-status": void;
  "config:get": void;
  "config:update": ConfigUpdateContract;
  "app:open-settings": void;
};

type IpcResponseMap = {
  "app:get-status": AppStatusSnapshot;
  "config:get": AppConfigContract;
  "config:update": AppConfigContract;
  "app:open-settings": { success: true };
};

export type { IpcRequestMap, IpcResponseMap };

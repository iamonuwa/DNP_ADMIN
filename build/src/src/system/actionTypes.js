import { NAME } from "./constants";

const type = tag => NAME + "/" + tag;

export const CALL = type("CALL");
export const LOG_PACKAGE = type("LOG_PACKAGE");
export const LIST_PACKAGES = type("LIST_PACKAGES");
export const UPDATE_FETCHING = type("UPDATE_FETCHING");
export const UPDATE_LOG = type("UPDATE_LOG");
export const UPDATE_PACKAGES = type("UPDATE_PACKAGES");
// Core stuff
export const CORE_DEPS = type("CORE_DEPS");
export const UPDATE_CORE = type("UPDATE_CORE");
export const SYSTEM_UPDATE_AVAILABLE = type("SYSTEM_UPDATE_AVAILABLE");
// Static IP
export const SET_STATIC_IP = type("SET_STATIC_IP");
export const UPDATE_STATIC_IP = type("UPDATE_STATIC_IP");
export const UPDATE_STATIC_IP_INPUT = type("UPDATE_STATIC_IP_INPUT");

// prefixing each type with the module name helps preventing name collisions

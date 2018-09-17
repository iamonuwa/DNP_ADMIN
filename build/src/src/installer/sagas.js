import { call, put, takeEvery, all, select, take } from "redux-saga/effects";
import * as APIcall from "API/rpcMethods";
import * as t from "./actionTypes";
import * as a from "./actions";
import * as s from "./selectors";
import uuidv4 from "uuid/v4";
import Toast from "components/Toast";
import { shortName } from "utils/format";
import { idToUrl, isIpfsHash } from "./utils";

/***************************** Subroutines ************************************/

export function* shouldOpenPorts() {
  const res = yield call(APIcall.getStatusUPnP);
  if (res.success) {
    yield put({
      type: t.SHOULD_OPEN_PORTS,
      shouldOpenPorts: res.result.openPorts && res.result.UPnP
    });
  } else {
    console.error("Error fetching UPnP status: " + res.message);
  }
}

export function* install({ id, options }) {
  try {
    // Load necessary info
    const isInstalling = yield select(s.isInstalling);
    // Prevent double installations, 1. check if the package is in the blacklist
    if (isInstalling[id]) {
      return console.error(id + " IS ALREADY INSTALLING");
    }
    const logId = uuidv4();
    const pendingToast = new Toast({
      message: "Adding " + shortName(id) + "...",
      pending: true
    });
    // blacklist the current package
    yield put({
      type: "installer/PROGRESS_LOG",
      logId,
      msg: "Fetching dependencies...",
      pkgName: id.split("@")[0]
    });
    const res = yield call(APIcall.addPackage, { id, logId, options });
    // Remove package from blacklist
    yield put({ type: t.CLEAR_PROGRESS_LOG, logId });
    pendingToast.resolve(res);
    // Fetch directory
    yield call(fetchDirectory);
  } catch (error) {
    console.error("Error installing package: ", error);
  }
}

// After successful installation notify the chain
// chains.actions.installedChain(selectedPackageName)(dispatch, getState);

export function* updateEnvs({ id, envs, restart }) {
  try {
    if (Object.getOwnPropertyNames(envs).length > 0) {
      const pendingToast = new Toast({
        message: "Updating " + id + " envs: " + JSON.stringify(envs),
        pending: true
      });
      const res = yield call(APIcall.updatePackageEnv, {
        id,
        envs,
        restart
      });
      pendingToast.resolve(res);
    }
  } catch (error) {
    console.error("Error updating " + id + "envs: ", error);
  }
}

export function* openPorts({ ports }) {
  try {
    const shouldOpenPorts = yield select(s.shouldOpenPorts);
    if (shouldOpenPorts && ports.length > 0) {
      // #### Only if necessary!!!
      const pendingToast = new Toast({
        message: "Opening ports " + ports.join(", ") + "...",
        pending: true
      });
      const res = yield call(APIcall.managePorts, {
        action: "open",
        ports
      });
      pendingToast.resolve(res);
    }
  } catch (error) {
    console.error("Error opening ports: ", error);
  }
}

// For installer: throttle(ms, pattern, saga, ...args)

export function* fetchDirectory() {
  try {
    yield put({ type: t.UPDATE_FETCHING, fetching: true });
    const res = yield call(APIcall.fetchDirectory);
    yield put({ type: t.UPDATE_FETCHING, fetching: false });
    if (!res.success) {
      console.log("fetch directory res", res);
      return new Toast(res);
    }
    /**
     * The data is received through progressive websocket events
     * in API/socketSubscription.js
     */
  } catch (error) {
    console.error("Error fetching directory: ", error);
  }
}

export function* fetchPackageRequest({ id }) {
  try {
    // If connection is not open yet, wait for it to open.
    const connectionOpen = yield select(s.connectionOpen);
    if (!connectionOpen) {
      yield take("CONNECTION_OPEN");
    }

    // If package is already loaded, skip
    const directory = yield select(s.getDirectory);
    const pkg = directory[id];
    let manifest;
    if (!pkg) {
      yield put(a.updateFetching(true));
      manifest = yield call(fetchPackageData, { id });
      yield put(a.updateFetching(false));
      // If the package was not resolved, cancel
      if (!manifest) {
        return;
      }
    } else {
      manifest = pkg.manifest;
    }

    // Resolve the request to install
    const { name, version } = manifest;
    yield put(a.updateFetchingRequest(id, true));
    const res = yield call(APIcall.resolveRequest, {
      req: { name, ver: isIpfsHash(id) ? id : version }
    });
    yield put(a.updateFetchingRequest(id, false));

    if (res.success) {
      yield put({
        type: "UPDATE_DIRECTORY",
        pkgs: { [id]: { requestResult: res.result } }
      });
    } else {
      console.error("Error resolving dependencies of " + id, res.message);
      return;
    }
  } catch (error) {
    console.error("Error getting package data: ", error);
  }
}

export function* fetchPackageData({ id }) {
  try {
    // If connection is not open yet, wait for it to open.
    const connectionOpen = yield select(s.connectionOpen);
    if (!connectionOpen) {
      yield take("CONNECTION_OPEN");
    }
    const res = yield call(APIcall.fetchPackageData, { id });
    // Abort on error
    if (!res.success) {
      if (res.message.includes("Resolver could not found a match")) {
        console.log("No match found for " + id);
      } else {
        console.error("Error fetching package data: ", res.message);
      }
      return;
    }
    const { manifest, avatar } = res.result || {};
    // Add ipfs hash inside the manifest too, so it is searchable
    if (manifest) manifest.origin = isIpfsHash(id) ? id : null;
    // Update directory
    yield put({
      type: "UPDATE_DIRECTORY",
      pkgs: {
        [id]: {
          name: manifest.name,
          manifest,
          avatar,
          origin: isIpfsHash(id) ? id : null,
          url: idToUrl(id)
        }
      }
    });
    return manifest;
  } catch (error) {
    console.error("Error fetching directory: ", error);
  }
}

/******************************************************************************/
/******************************* WATCHERS *************************************/
/******************************************************************************/

function* watchConnectionOpen() {
  yield takeEvery("CONNECTION_OPEN", fetchDirectory);
  yield takeEvery("CONNECTION_OPEN", shouldOpenPorts);
}

function* watchFetchPackageData() {
  yield takeEvery(t.FETCH_PACKAGE_DATA, fetchPackageData);
}

function* watchFetchPackageRequest() {
  yield takeEvery(t.FETCH_PACKAGE_REQUEST, fetchPackageRequest);
}

function* watchInstall() {
  yield takeEvery(t.INSTALL, install);
}

function* watchUpdateEnvs() {
  yield takeEvery(t.UPDATE_ENV, updateEnvs);
}

function* watchOpenPorts() {
  yield takeEvery(t.OPEN_PORTS, openPorts);
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* root() {
  yield all([
    watchConnectionOpen(),
    watchInstall(),
    watchUpdateEnvs(),
    watchOpenPorts(),
    watchFetchPackageRequest(),
    watchFetchPackageData()
  ]);
}

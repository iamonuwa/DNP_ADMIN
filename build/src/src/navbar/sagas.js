import { put, takeEvery, all, call } from "redux-saga/effects";
import * as APIcall from "API/rpcMethods";
import * as a from "./actions";

function* fetchVpnParams() {
  try {
    const res = yield call(APIcall.getVpnParams);
    if (res.success) {
      const result = res.result || {};
      yield put(
        a.updateDappnodeIdentity({
          ip: result.ip,
          name: result.name,
          staticIp: result.staticIp,
          domain: result.domain
        })
      );
    }
  } catch (e) {
    console.error("Error getting vpn parameters");
  }
}

/******************************************************************************/
/******************************* WATCHERS *************************************/
/******************************************************************************/

function* watchConnectionOpen() {
  yield takeEvery("CONNECTION_OPEN", fetchVpnParams);
  yield takeEvery("FETCH_DAPPNODE_PARAMS", fetchVpnParams);
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* root() {
  yield all([watchConnectionOpen()]);
}

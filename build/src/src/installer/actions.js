// INSTALLER
import * as t from "./actionTypes";
import * as selector from "./selectors";
// modules

// export const add = text => ({
//   type: t.ADD,
//   payload: { text }
// });
export const updateFetching = fetching => ({
  type: t.UPDATE_FETCHING,
  fetching
});

export const updateFetchingRequest = (id, fetching) => ({
  type: "UPDATE_DIRECTORY",
  pkgs: { [id]: { fetchingRequest: fetching } }
});

export const updateInput = id => ({
  type: t.UPDATE_INPUT,
  payload: id
});

export const updateSelectedTypes = types => ({
  type: t.UPDATE_SELECTED_TYPES,
  payload: types
});

export const fetchDirectory = () => ({
  type: t.FETCH_DIRECTORY
});

export const fetchPackageData = id => ({
  type: t.FETCH_PACKAGE_DATA,
  id
});

export const fetchPackageRequest = id => ({
  type: t.FETCH_PACKAGE_REQUEST,
  id
});

export const install = (id, options) => ({
  type: t.INSTALL,
  options,
  id
});

// Need to notify the chain that a package has been added

export const updateEnv = (envs, id) => ({
  type: t.UPDATE_ENV,
  envs,
  id
});

export const openPorts = ports => ({
  type: t.OPEN_PORTS,
  ports
});

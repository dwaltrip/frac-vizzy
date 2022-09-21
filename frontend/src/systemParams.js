
// TODO: further research to verify how accurate / reliable this is.
const numProcs = window.navigator.hardwareConcurrency;

const DEFAULT_SYTSTEM_PARAMS = {
  numWorkers: Math.max(1, Math.floor(numProcs / 2)),
};

const LOCAL_STORAGE_KEY = 'frac-vizzy_system-params';

function getInitialSystemParams() {
  const localStorageData = JSON.parse(
    window.localStorage.getItem(LOCAL_STORAGE_KEY) || '{}'
  );

  return {
    numWorkers: (
      localStorageData.numWorkers ||
      DEFAULT_SYTSTEM_PARAMS.numWorkers
    ),
    maxNumWorkers: numProcs,
  };
}

function saveSystemParams(newParams) {
  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(newParams || {})
  );
}

export { getInitialSystemParams, saveSystemParams };

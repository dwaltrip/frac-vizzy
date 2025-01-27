interface UserSettings {
  numCPUs: number;
  hideSettingsPanel: boolean;
}

// TODO: further research to verify how accurate / reliable this is.
const userProcs = window.navigator.hardwareConcurrency;
const DEFAULT_USER_SETTINGS: UserSettings = {
  numCPUs: Math.max(1, userProcs - 2),
  hideSettingsPanel: false,
};
const MAX_NUM_CPUS = userProcs;

function getInitialUserSettings(): UserSettings {
  return loadUserSettings();
}

type UserSettingsUpdate =
  | { type: 'numCPUs'; value: number }
  | { type: 'hideSettingsPanel'; value: boolean };

function saveUserSettings(settings: UserSettings) {
  localStorage.setItem('userSettings', JSON.stringify(settings));
}

function loadUserSettings(): UserSettings {
  const settings = localStorage.getItem('userSettings');
  if (settings) {
    return JSON.parse(settings);
  }
  return DEFAULT_USER_SETTINGS;
}

export {
  type UserSettings,
  type UserSettingsUpdate,
  MAX_NUM_CPUS,
  getInitialUserSettings,
  saveUserSettings,
};

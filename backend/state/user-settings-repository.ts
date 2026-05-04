import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type UserSettings = {
  launchOnStartup: boolean;
};

type UserSettingsRepository = {
  load: () => UserSettings;
  save: (next: UserSettings) => void;
};

const defaultUserSettings: UserSettings = {
  launchOnStartup: false
};

const createUserSettingsRepository = (
  settingsFilePath: string
): UserSettingsRepository => {
  const ensureStorageDirectory = (): void => {
    const directory = dirname(settingsFilePath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  };

  const load = (): UserSettings => {
    if (!existsSync(settingsFilePath)) {
      return defaultUserSettings;
    }
    const rawValue = readFileSync(settingsFilePath, "utf-8");
    if (rawValue.trim().length === 0) {
      return defaultUserSettings;
    }
    const parsedValue = JSON.parse(rawValue) as Partial<UserSettings>;
    return {
      launchOnStartup:
        parsedValue.launchOnStartup ?? defaultUserSettings.launchOnStartup
    };
  };

  const save = (value: UserSettings): void => {
    ensureStorageDirectory();
    writeFileSync(settingsFilePath, JSON.stringify(value, null, 2), "utf-8");
  };

  return { load, save };
};

export type { UserSettings, UserSettingsRepository };
export { createUserSettingsRepository, defaultUserSettings };

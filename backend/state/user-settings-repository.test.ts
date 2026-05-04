import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  createUserSettingsRepository,
  defaultUserSettings
} from "./user-settings-repository";

describe("createUserSettingsRepository", () => {
  it("loads defaults when file is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-settings-"));
    try {
      const repo = createUserSettingsRepository(join(root, "settings.json"));
      expect(repo.load()).toEqual(defaultUserSettings);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("round-trips persisted settings", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-settings-"));
    try {
      const path = join(root, "nested", "settings.json");
      mkdirSync(join(root, "nested"), { recursive: true });
      const repo = createUserSettingsRepository(path);
      repo.save({ launchOnStartup: true });
      expect(existsSync(path)).toBe(true);
      expect(repo.load()).toEqual({ launchOnStartup: true });
      const repo2 = createUserSettingsRepository(path);
      expect(repo2.load()).toEqual({ launchOnStartup: true });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("treats empty file as defaults", () => {
    const root = mkdtempSync(join(tmpdir(), "vf-settings-"));
    try {
      const path = join(root, "settings.json");
      writeFileSync(path, "   \n", "utf-8");
      const repo = createUserSettingsRepository(path);
      expect(repo.load()).toEqual(defaultUserSettings);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

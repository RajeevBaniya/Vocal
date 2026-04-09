import { Menu, Tray, nativeImage } from "electron";
import { existsSync } from "node:fs";
import { join } from "node:path";

type TrayHandlers = {
  onOpenSettings: () => void;
  onExit: () => void;
  getAvailabilityLabel: () => string;
};

const createTrayMenu = (handlers: TrayHandlers): Menu => {
  return Menu.buildFromTemplate([
    {
      label: "Open Settings",
      click: handlers.onOpenSettings
    },
    {
      label: `Availability: ${handlers.getAvailabilityLabel()}`,
      enabled: false
    },
    {
      type: "separator"
    },
    {
      label: "Exit",
      click: handlers.onExit
    }
  ]);
};

const createTray = (handlers: TrayHandlers): Tray => {
  const iconCandidates = [
    join(process.cwd(), "assets", "icons", "tray.png"),
    join(process.cwd(), "assets", "icons", "tray.ico"),
    join(process.cwd(), "..", "assets", "icons", "tray.png"),
    join(process.cwd(), "..", "assets", "icons", "tray.ico"),
    join(__dirname, "..", "..", "assets", "icons", "tray.png"),
    join(__dirname, "..", "..", "assets", "icons", "tray.ico")
  ];
  const iconPath = iconCandidates.find((pathValue) => existsSync(pathValue));
  const fallbackTrayDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn7m2sAAAAASUVORK5CYII=";
  const trayIcon = nativeImage.createFromPath(
    iconPath ?? fallbackTrayDataUrl
  );
  const trayRef = new Tray(trayIcon);
  const trayMenu = createTrayMenu(handlers);
  trayRef.setContextMenu(trayMenu);
  trayRef.setToolTip("Vocalflow");
  trayRef.on("click", handlers.onOpenSettings);
  return trayRef;
};

const refreshTrayMenu = (trayRef: Tray, handlers: TrayHandlers): void => {
  trayRef.setContextMenu(createTrayMenu(handlers));
};

export type { TrayHandlers };
export { createTray, refreshTrayMenu };

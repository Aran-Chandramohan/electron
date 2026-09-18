// Empty for now — contextIsolation is on and nodeIntegration is off, so the
// renderer has no Node/Electron access by default. When a future module
// needs to talk to the OS or filesystem (e.g. exporting data), expose a
// narrow API here via contextBridge.exposeInMainWorld instead of loosening
// those settings.

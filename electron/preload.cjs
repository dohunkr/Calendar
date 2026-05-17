const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showAlarm: (alarmData) => ipcRenderer.send('show-alarm', alarmData),
  closeAlarmWindow: () => ipcRenderer.send('close-alarm-window'),
  snoozeAlarm: (alarmData, minutes) => ipcRenderer.send('snooze-alarm', { alarmData, minutes }),
  onRescheduleSnooze: (callback) => ipcRenderer.on('reschedule-snooze', (event, data) => callback(data)),
  isDesktop: true
});

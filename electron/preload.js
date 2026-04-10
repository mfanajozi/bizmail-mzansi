const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  isEncryptedStorageAvailable: () => ipcRenderer.invoke('is-encrypted-storage-available'),
  encryptString: (text) => ipcRenderer.invoke('encrypt-string', text),
  decryptString: (encrypted) => ipcRenderer.invoke('decrypt-string', encrypted),
  
  onSyncNow: (callback) => ipcRenderer.on('sync-now', callback),
  removeSyncNowListener: () => ipcRenderer.removeAllListeners('sync-now'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

  db: {
    getAllAccounts: () => ipcRenderer.invoke('db:getAllAccounts'),
    getAccountById: (id) => ipcRenderer.invoke('db:getAccountById', id),
    createAccount: (account) => ipcRenderer.invoke('db:createAccount', account),
    updateAccount: (id, updates) => ipcRenderer.invoke('db:updateAccount', id, updates),
    deleteAccount: (id) => ipcRenderer.invoke('db:deleteAccount', id),
    getAllEmails: (limit) => ipcRenderer.invoke('db:getAllEmails', limit),
    getEmailsByAccount: (accountId, folder, limit) => ipcRenderer.invoke('db:getEmailsByAccount', accountId, folder, limit),
    markEmailAsRead: (id) => ipcRenderer.invoke('db:markEmailAsRead', id),
    getAllOutboxItems: () => ipcRenderer.invoke('db:getAllOutboxItems'),
    getPendingOutboxItems: () => ipcRenderer.invoke('db:getPendingOutboxItems'),
    getOooSettings: (accountId) => ipcRenderer.invoke('db:getOooSettings', accountId),
    saveOooSettings: (settings) => ipcRenderer.invoke('db:saveOooSettings', settings),
  },

  vault: {
    setPassword: (accountId, password) => ipcRenderer.invoke('vault:setPassword', accountId, password),
    getPassword: (accountId) => ipcRenderer.invoke('vault:getPassword', accountId),
    deletePassword: (accountId) => ipcRenderer.invoke('vault:deletePassword', accountId),
  },

  sync: {
    syncAccount: (accountId) => ipcRenderer.invoke('sync:syncAccount', accountId),
    syncAll: () => ipcRenderer.invoke('sync:syncAll'),
    onSyncProgress: (accountId, callback) => ipcRenderer.on(`sync:progress:${accountId}`, (_, status) => callback(status)),
    removeSyncProgressListener: (accountId) => ipcRenderer.removeAllListeners(`sync:progress:${accountId}`),
  },

  outbox: {
    sendImmediate: (accountId, to, subject, bodyText, bodyHtml, cc, bcc) => 
      ipcRenderer.invoke('outbox:sendImmediate', accountId, to, subject, bodyText, bodyHtml, cc, bcc),
    queueEmail: (accountId, from, to, subject, bodyText, bodyHtml, cc, bcc) =>
      ipcRenderer.invoke('outbox:queueEmail', accountId, from, to, subject, bodyText, bodyHtml, cc, bcc),
    processQueue: () => ipcRenderer.invoke('outbox:processQueue'),
  }
});
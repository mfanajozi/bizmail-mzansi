# Mzansi BizMail

A lightweight, local-first IMAP/SMTP email client built with React, TypeScript, Ionic, and Vite.

## Features

- **Multi-account support** - Manage multiple email accounts
- **IMAP Sync** - 30-day rolling mirror from email servers
- **SMTP Sending** - Send emails with outbox queue
- **Local Database** - SQLite for offline storage
- **Secure Vault** - Encrypted password storage
- **Responsive UI** - Ionic React components

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **UI**: Ionic React
- **Build**: Vite 8
- **Email**: imapflow (IMAP), nodemailer (SMTP)
- **Database**: better-sqlite3

## License

MIT
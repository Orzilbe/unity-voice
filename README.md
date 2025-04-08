# unity-voice
# Unity Voice

A monorepo project for voice-based interface applications using Next.js, Express, and MongoDB.

## Project Structure

This project uses a monorepo structure with Turborepo to manage both frontend and backend applications:

```
unity-voice/
├── apps/                   # Applications
│   ├── api/                # Backend API (Express)
│   └── web/                # Frontend (Next.js)
├── packages/               # Shared packages
│   └── types/              # Shared TypeScript types
├── turbo.json              # Turborepo configuration
└── package.json            # Root package.json
```

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: MongoDB (via Azure Cosmos DB)
- **AI Integration**: Azure OpenAI
- **Infrastructure**: Azure (using UNITY-VOICE resource group)
- **Build Tools**: Turborepo, npm workspaces

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm (v9 or newer)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/unity-voice.git
   cd unity-voice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in `apps/web`
   - Create a `.env` file in `apps/api`
   - Add the necessary environment variables (see example files)

4. Run the development server:
   ```bash
   # Run both frontend and backend
   npm run dev
   
   # Run only frontend
   npm run dev:web
   
   # Run only backend
   npm run dev:api
   ```

5. Open your browser:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Development

### Project Commands

- `npm run dev` - Run all applications in development mode
- `npm run build` - Build all applications
- `npm run start` - Start all applications in production mode
- `npm run lint` - Lint all applications
- `npm run dev:web` - Run only the frontend
- `npm run dev:api` - Run only the backend

### Adding Shared Code

To add shared code between applications, create a new package in the `packages` directory:

```bash
mkdir -p packages/new-package
cd packages/new-package
npm init -y
```

Then add it to your applications:

```bash
# From the root directory
cd apps/web
npm install @unity-voice/new-package@workspace:*
```

## Deployment

This project is configured to deploy to Azure using the UNITY-VOICE resource group:

- Frontend: Azure Static Web Apps
- Backend: Azure App Service
- Database: Azure Cosmos DB for MongoDB
- AI: Azure OpenAI Service

See the deployment documentation for more details.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

[MIT](LICENSE)

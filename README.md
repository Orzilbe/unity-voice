<!-- /c:/Users/orzil/unity-voice-2/README.md -->
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
   npm install @azure/openai

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

### Additional Dependencies

Install required packages:
```bash
# UI Icons and Components
npm install lucide-react react-icons lucide

# OpenAI Integration
npm install openai
```

These packages provide:
- `lucide-react`: Modern icon components for React
- `react-icons`: Popular icon libraries
- `lucide`: Base icon library
- `openai`: Official OpenAI API client

> **Note**: When using Azure OpenAI Service, the `openai` package should be configured with Azure endpoints.

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

# Unity Voice Platform

A platform for English language learning and advocacy training.

## System Architecture

```
Frontend (Next.js)          Backend (Express)
     |                           |
     |                           |
     |  /api/auth/login          |
     |-------------------------->|  /api/users/login
     |                           |
     |  Token in Cookie          |
     |<--------------------------|  User Data + JWT
     |                           |
     |  Protected Routes         |
     |-------------------------->|  Token Validation
     |                           |
     |  User Data                |
     |<--------------------------|  Authorized Response
```

## Authentication Flow

### Login API

**Endpoint:** `/api/auth/login`

**Request Method:** POST

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    }
  }
}
```

**Error Responses:**
- 400: Invalid credentials
- 500: Server error

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd apps/api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd apps/web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Frontend-Backend Integration

### API Communication

- The frontend uses the `NEXT_PUBLIC_API_URL` environment variable to determine the backend URL
- All API requests are proxied through Next.js API routes
- CORS is handled by the backend using the `cors` middleware

### Authentication

1. User submits login credentials
2. Frontend sends request to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Token is stored in an HTTP-only cookie
5. Subsequent requests include the token in the cookie

## Troubleshooting

### Common Issues

1. **Error: connect ECONNREFUSED ::1:5000**
   - Cause: Backend server is not running
   - Solution: Start the backend server using `npm run dev` in the `apps/api` directory

2. **401 Unauthorized Errors**
   - Cause: Invalid or expired token
   - Solution: Clear browser cookies and log in again

3. **500 Internal Server Error**
   - Cause: Backend server error
   - Solution: Check backend logs for detailed error message

4. **CORS Errors**
   - Cause: Frontend and backend origins don't match
   - Solution: Ensure `NEXT_PUBLIC_API_URL` matches the backend URL

## Environment Variables

### Backend (.env)
- `PORT`: Backend server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5000)

## Security Considerations

- JWT tokens are stored in HTTP-only cookies
- Passwords are hashed using bcrypt
- CORS is configured to only allow requests from the frontend origin
- Environment variables are used for sensitive configuration

//apps/api/src/app.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes';
import taskRoutes from './routes/taskRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unity-voice';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Debug middleware to log all requests before any route handling
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`➡️ [SERVER] ${req.method} ${req.url}`);
  next();
});

// Add a root level health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[SERVER] ${req.method} ${req.url}`);
  next();
});
// Register API routes with debug
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  console.log(`🌐 [API] ${req.method} ${req.url}`);
  next();
}, routes);

app.use('/api/tasks', taskRoutes);

// Debug route to display all registered routes
app.get('/debug/routes', (req: Request, res: Response) => {
  const routePaths: string[] = [];
  
  function print(path: string, layer: any) {
    if (layer.route) {
      layer.route.stack.forEach((stack: any) => {
        const method = stack.method.toUpperCase();
        routePaths.push(`${method} ${path}${layer.route.path}`);
      });
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach((stack: any) => {
        print(path + (layer.regexp.source === '^\\/?$' ? '' : layer.regexp.source.replace(/\\\//g, '/').replace(/\?/g, '').replace(/\\\\/g, '\\').replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ':$1')), stack);
      });
    }
  }
  
  app._router.stack.forEach((layer: any) => {
    print('', layer);
  });
  
  res.json(routePaths);
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;

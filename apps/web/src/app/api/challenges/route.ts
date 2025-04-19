// apps/web/src/app/api/challenges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Challenge, ChallengeType, UserProgress } from '@unity-voice/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// GET /api/tasks - Get available tasks for a user
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current progress
    const progressResponse = await fetch(`${API_URL}/api/users/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!progressResponse.ok) {
      throw new Error('Failed to fetch user progress');
    }

    const userProgress: UserProgress = await progressResponse.json();

    // Get available tasks based on user's progress
    const tasksResponse = await fetch(`${API_URL}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!tasksResponse.ok) {
      throw new Error('Failed to fetch tasks');
    }

    const tasks: Challenge[] = await tasksResponse.json();

    // Filter tasks based on user's progress
    const availableChallenges = tasks.filter(task => {
      const topicProgress = userProgress.topicProgress.find(
        tp => tp.topicId === task.levelId
      );
      
      if (!topicProgress) return false;
      
      // Only show tasks for current level
      return !topicProgress.completedChallenges.includes(task.id.toString());
    });

    return NextResponse.json(availableChallenges);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Submit a task response
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { taskId, response, type } = body;

    if (!taskId || !response || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Submit task response to backend
    const submitResponse = await fetch(`${API_URL}/api/tasks/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId,
        response,
        type
      })
    });

    if (!submitResponse.ok) {
      throw new Error('Failed to submit task');
    }

    const result = await submitResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
} 
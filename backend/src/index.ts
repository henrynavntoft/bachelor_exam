import express from 'express';
import type { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
  res.send('Hello TypeScript Express!');
});

// test api 
app.get('/test', async (req, res) => {
  try {
    res.status(200).json({ message: 'Hello World' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({message: error.message});
    } else {
      res.status(500).json({message: 'An unknown error occurred'});
    }
  }
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error: unknown) {
    res.status(500).json({message: 'Failed to fetch users'});
  }
});

// Get a single user by id
app.get('/users/:id', (async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }
    res.status(200).json(user);
  } catch (error: unknown) {
    res.status(500).json({message: 'Failed to fetch user'});
  }
}) as RequestHandler);

// Create a new user
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email }, 
    });
    res.status(201).json(user);
  } catch (error: unknown) {
    res.status(500).json({message: 'Failed to create user'});
  }
});

// Update a user
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email },
    });
    res.status(200).json(user);
  } catch (error: unknown) {
    res.status(500).json({message: 'Failed to update user'});
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).json({message: 'User deleted successfully'});
  } catch (error: unknown) {
    res.status(500).json({message: 'Failed to delete user'});
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
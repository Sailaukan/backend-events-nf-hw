import { User } from './types/response';
import { Request, Response } from 'express';
import { CreateUserDto } from './dtos/CreateUser.dto';
import AuthService from './auth-service';
import UserModel from "./models/User"
import ChatModel from './models/Chat';
import { logger } from '../logger';

class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const createUserDto: CreateUserDto = req.body;
      const user = await this.authService.registerUser(createUserDto);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: 'Error registering user' });
    }
  }

  loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginUser(email, password);
      if (!result) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: 'Error logging in' });
    }
  }

  getUsers = async (req: Request, res: Response) => {
    const users = await UserModel.find()

    res.status(200).json(users);
  }

  getChats = async (req: Request, res: Response) => {
    const chats = await ChatModel.find()
    res.status(200).json(chats);
  }


  getChatByEmails = async (req: Request, res: Response) => {
    try {
      const chat = await ChatModel.findOne({
        participants: { $all: [req.params.p1, req.params.p2] }
      }, { messages: 1 });
      console.log(req.params.p1)
      console.log(chat)
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }
      console.log(chat.messages)
      res.status(200).json(chat.messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }


  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      const result = await this.authService.refreshToken(token);
      if (!result) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
        return;
      }
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: 'Error refreshing token' });
    }
  }
}

export default AuthController;
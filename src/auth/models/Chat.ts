import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  participants: string[];
  messages: { participant: string, text: string }[];
}

const ChatSchema: Schema = new Schema({
  participants: [{ type: String, required: true }],
  messages: [{
    participant: { type: String, required: true },
    text: { type: String, required: true }
  }]
});

const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);

export default ChatModel;

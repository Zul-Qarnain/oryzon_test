import { NextRequest, NextResponse } from 'next/server';
import { chatsService } from '@/backend/services/chats/chats.service';

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const deleted = await chatsService.deleteChat(chatId);

    if (deleted) {
      return NextResponse.json({ message: 'Chat deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
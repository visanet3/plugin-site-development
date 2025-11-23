import { User } from '@/types';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

export interface LotteryTicket {
  id: number;
  user_id: number;
  username: string;
  ticket_number: number;
  purchased_at: string;
}

export interface LotteryRound {
  id: number;
  status: 'active' | 'drawing' | 'completed';
  total_tickets: number;
  prize_pool: number;
  draw_time: string | null;
  winner_ticket_number: number | null;
  winner_username: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  username: string;
  message: string;
  created_at: string;
}

export interface LotteryNotification {
  id: number;
  round_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface LotteryHistory {
  id: number;
  status: string;
  total_tickets: number;
  prize_pool: number;
  winner_ticket_number: number;
  winner_user_id: number;
  winner_username: string;
  created_at: string;
  completed_at: string;
}

export const loadLottery = async (user: User | null) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { 'X-User-Id': user.id.toString() } : {})
      },
      body: JSON.stringify({
        action: 'get_lottery'
      })
    });

    if (!response.ok) {
      console.error('Failed to load lottery:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return {
        round: data.round,
        tickets: data.tickets || [],
        userTickets: user ? (data.tickets || [])
          .filter((t: LotteryTicket) => t.user_id === user.id)
          .map((t: LotteryTicket) => t.ticket_number) : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading lottery:', error);
    return null;
  }
};

export const loadChat = async () => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_lottery_chat'
      })
    });

    if (!response.ok) {
      console.error('Failed to load chat:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data.messages || [];
    }
    return null;
  } catch (error) {
    console.error('Error loading chat:', error);
    return null;
  }
};

export const checkDraw = async () => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'check_lottery_draw'
      })
    });

    if (!response.ok) {
      console.error('Failed to check lottery draw:', response.status);
      return { processed: false };
    }

    const data = await response.json();
    return {
      processed: data.success && data.processed_rounds > 0
    };
  } catch (error) {
    console.error('Error checking lottery draw:', error);
    return { processed: false };
  }
};

export const loadNotifications = async (user: User) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'get_lottery_notifications'
      })
    });

    if (!response.ok) {
      console.error('Failed to load notifications:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data.notifications.filter((n: LotteryNotification) => !n.is_read);
    }
    return null;
  } catch (error) {
    console.error('Error loading notifications:', error);
    return null;
  }
};

export const markNotificationsRead = async (user: User) => {
  try {
    await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'mark_notifications_read'
      })
    });
  } catch (error) {
    console.error('Error marking notifications read:', error);
  }
};

export const loadHistory = async () => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'get_lottery_history'
      })
    });

    if (!response.ok) {
      console.error('Failed to load history:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data.history || [];
    }
    return null;
  } catch (error) {
    console.error('Error loading history:', error);
    return null;
  }
};

export const sendMessage = async (user: User, message: string) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'send_lottery_chat',
        message: message.trim()
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

export const buyTicket = async (user: User, ticketPrice: number) => {
  try {
    const response = await fetch(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user.id.toString()
      },
      body: JSON.stringify({
        action: 'buy_lottery_ticket',
        amount: ticketPrice
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error buying ticket:', error);
    return { success: false, message: 'Ошибка соединения с сервером' };
  }
};

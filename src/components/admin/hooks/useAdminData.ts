import { useState } from 'react';
import { User, ForumTopic } from '@/types';

const FORUM_URL = 'https://functions.poehali.dev/045d6571-633c-4239-ae69-8d76c933532c';
const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';
const CRYPTO_URL = 'https://functions.poehali.dev/8caa3b76-72e5-42b5-9415-91d1f9b05210';
const FLASH_USDT_URL = 'https://functions.poehali.dev/9d93686d-9a6f-47bc-85a8-7b7c28e4edd7';
const TICKETS_URL = 'https://functions.poehali.dev/f2a5cbce-6afc-4ef1-91a6-f14075db8567';
const DEALS_URL = 'https://functions.poehali.dev/8a665174-b0af-4138-82e0-a9422dbb8fc4';

export const useAdminData = (currentUserId: number) => {
  const [users, setUsers] = useState<User[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [btcWithdrawals, setBtcWithdrawals] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [flashUsdtOrders, setFlashUsdtOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=users`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(FORUM_URL);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Ошибка загрузки тем:', error);
    }
  };

  const fetchDisputes = async () => {
    try {
      setDisputes([]);
    } catch (error) {
      console.error('Ошибка загрузки споров:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${WITHDRAWAL_URL}?action=all_withdrawals&status=all`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Ошибка загрузки заявок на вывод:', error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await fetch(`${CRYPTO_URL}?action=all_deposits&status=all`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      setDeposits(data.deposits || []);
    } catch (error) {
      console.error('Ошибка загрузки пополнлений:', error);
    }
  };

  const fetchFlashUsdtOrders = async () => {
    try {
      const response = await fetch(`${FLASH_USDT_URL}?action=admin_orders`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      setFlashUsdtOrders(data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов Flash USDT:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${TICKETS_URL}?action=list`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
      setTickets([]);
    }
  };

  const fetchBtcWithdrawals = async () => {
    try {
      const response = await fetch(`${ADMIN_URL}?action=btc_withdrawals`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setBtcWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки BTC заявок:', error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${DEALS_URL}?action=admin_all_deals`, {
        headers: { 'X-User-Id': currentUserId.toString() }
      });
      const data = await response.json();
      if (data.success) {
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сделок:', error);
    }
  };

  return {
    users,
    topics,
    disputes,
    withdrawals,
    deposits,
    btcWithdrawals,
    deals,
    flashUsdtOrders,
    tickets,
    fetchUsers,
    fetchTopics,
    fetchDisputes,
    fetchWithdrawals,
    fetchDeposits,
    fetchFlashUsdtOrders,
    fetchTickets,
    fetchBtcWithdrawals,
    fetchDeals
  };
};

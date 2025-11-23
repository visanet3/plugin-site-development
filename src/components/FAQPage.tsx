import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      category: 'Общие вопросы',
      question: 'Что такое Git Crypto?',
      answer: 'Git Crypto — это платформа для покупки и продажи криптовалюты, участия в лотереях, общения на форуме и доступа к различным криптовалютным инструментам. Мы предоставляем безопасную среду для работы с цифровыми активами.'
    },
    {
      id: 2,
      category: 'Общие вопросы',
      question: 'Как зарегистрироваться на платформе?',
      answer: 'Нажмите кнопку "Войти" в правом верхнем углу, затем выберите "Регистрация". Заполните форму с именем пользователя, email и паролем. После регистрации вы получите доступ ко всем функциям платформы.'
    },
    {
      id: 3,
      category: 'Баланс и платежи',
      question: 'Как пополнить баланс?',
      answer: 'Перейдите в личный кабинет и нажмите "Пополнить баланс". Выберите удобный способ оплаты (USDT TRC20, BTC, ETH или другие криптовалюты). Минимальная сумма пополнения — 10 USDT.'
    },
    {
      id: 4,
      category: 'Баланс и платежи',
      question: 'Как вывести средства?',
      answer: 'В личном кабинете нажмите "Вывести средства", укажите адрес кошелька и сумму. Выводы обрабатываются в течение 24 часов. Минимальная сумма вывода — 20 USDT. Комиссия сети оплачивается отдельно.'
    },
    {
      id: 5,
      category: 'Баланс и платежи',
      question: 'Какие комиссии взимаются?',
      answer: 'Пополнение баланса — без комиссии. Вывод средств — комиссия сети (зависит от блокчейна). Все операции на платформе проводятся без скрытых комиссий.'
    },
    {
      id: 6,
      category: 'Безопасность',
      question: 'Безопасна ли платформа?',
      answer: 'Да, мы используем современные методы шифрования данных, двухфакторную аутентификацию (2FA) и регулярно проводим аудит безопасности. Все транзакции проходят через защищенные каналы связи.'
    },
    {
      id: 7,
      category: 'Безопасность',
      question: 'Как защитить свой аккаунт?',
      answer: 'Используйте сложный пароль (минимум 8 символов, буквы, цифры и символы). Включите двухфакторную аутентификацию в настройках профиля. Никогда не делитесь своим паролем с третьими лицами.'
    },
    {
      id: 8,
      category: 'Безопасность',
      question: 'Что делать, если забыл пароль?',
      answer: 'Нажмите "Забыли пароль?" на странице входа. Введите email, указанный при регистрации. Вы получите письмо со ссылкой для сброса пароля. Ссылка действительна 1 час.'
    },
    {
      id: 9,
      category: 'Форум',
      question: 'Как создать тему на форуме?',
      answer: 'Авторизуйтесь на платформе, перейдите в раздел "Форум" и нажмите "Создать тему". Укажите заголовок и содержание темы. Соблюдайте правила форума и будьте вежливы.'
    },
    {
      id: 10,
      category: 'Форум',
      question: 'Могут ли удалить мое сообщение?',
      answer: 'Да, модераторы могут удалить сообщения, нарушающие правила: спам, оскорбления, реклама, незаконный контент. При повторных нарушениях аккаунт может быть заблокирован.'
    },
    {
      id: 11,
      category: 'Гарант-сервис',
      question: 'Что такое гарант-сервис?',
      answer: 'Гарант-сервис — это безопасная сделка между покупателем и продавцом с участием посредника. Деньги блокируются до выполнения условий сделки, защищая обе стороны от мошенничества.'
    },
    {
      id: 12,
      category: 'Гарант-сервис',
      question: 'Сколько стоит гарант-сервис?',
      answer: 'Комиссия гарант-сервиса составляет 5% от суммы сделки. Комиссия делится поровну между покупателем и продавцом (по 2.5% каждый). Минимальная сумма сделки — 50 USDT.'
    },
    {
      id: 13,
      category: 'Техническая поддержка',
      question: 'Как связаться с поддержкой?',
      answer: 'Перейдите в раздел "Поддержка" в сайдбаре и создайте тикет. Опишите проблему максимально подробно, укажите категорию. Среднее время ответа — 2-4 часа.'
    },
    {
      id: 14,
      category: 'Техническая поддержка',
      question: 'В какие часы работает поддержка?',
      answer: 'Техническая поддержка доступна 24/7. Тикеты обрабатываются круглосуточно. В нерабочие часы время ответа может увеличиться до 12 часов.'
    }
  ];

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">❓ Часто задаваемые вопросы</h1>
        <p className="text-muted-foreground">
          Найдите ответы на популярные вопросы о работе платформы
        </p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск по вопросам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {categories.map(category => {
        const categoryItems = filteredFAQ.filter(item => item.category === category);
        
        if (categoryItems.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon name="FolderOpen" size={24} className="text-primary" />
              {category}
            </h2>
            <div className="space-y-3">
              {categoryItems.map(item => (
                <Card
                  key={item.id}
                  className="p-4 cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 flex items-start gap-2">
                        <Icon 
                          name="ChevronRight" 
                          size={20} 
                          className={`mt-0.5 transition-transform ${expandedId === item.id ? 'rotate-90' : ''}`}
                        />
                        {item.question}
                      </h3>
                      {expandedId === item.id && (
                        <p className="text-muted-foreground ml-7 animate-fade-in">
                          {item.answer}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {filteredFAQ.length === 0 && (
        <Card className="p-12 text-center">
          <Icon name="SearchX" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
          <p className="text-muted-foreground">
            Попробуйте изменить поисковый запрос или обратитесь в поддержку
          </p>
        </Card>
      )}

      <Card className="p-6 bg-primary/10 border-primary/30">
        <div className="flex items-start gap-4">
          <Icon name="HelpCircle" size={24} className="text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">Не нашли ответ на свой вопрос?</h3>
            <p className="text-muted-foreground mb-4">
              Обратитесь в службу поддержки, и мы поможем вам решить любую проблему
            </p>
            <button
              onClick={() => {
                const supportLink = document.querySelector('[data-support-link]') as HTMLElement;
                if (supportLink) supportLink.click();
              }}
              className="text-primary hover:underline font-medium"
            >
              Написать в поддержку →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FAQPage;
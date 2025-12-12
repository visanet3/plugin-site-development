import { useState, FormEvent } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, StripeCardElementOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51xxxxxxxxxxxxxxxxxxxxx';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      color: 'hsl(var(--foreground))',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
    },
    invalid: {
      color: 'hsl(var(--destructive))',
      iconColor: 'hsl(var(--destructive))',
    },
  },
  hidePostalCode: false,
};

interface CheckoutFormProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const CheckoutForm = ({ amount, clientSecret, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast({
          title: 'Ошибка оплаты',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обработать платеж',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Данные карты</label>
        <div className="border rounded-lg p-4 bg-background">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-muted-foreground">
          Ваши данные защищены и обрабатываются через Stripe
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
        <span className="text-sm font-medium">К оплате:</span>
        <span className="text-lg font-bold">${amount.toFixed(2)} USD</span>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
        >
          {isProcessing ? (
            <>
              <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <Icon name="CreditCard" size={18} className="mr-2" />
              Оплатить ${amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Icon name="Lock" size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Безопасная оплата через Stripe. Мы не храним данные вашей карты.
        </span>
      </div>
    </form>
  );
};

interface StripeCardFormProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const StripeCardForm = ({ amount, clientSecret, onSuccess, onCancel }: StripeCardFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
};

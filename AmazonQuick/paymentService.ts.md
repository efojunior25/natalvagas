# File: paymentService.ts
- **Original Path:** `frontend/src/services/paymentService.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 61

---

```typescript
import axios from 'axios';

export interface PixOrder {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  qrCodeBase64?: string;
  qrCodeCopyPaste: string;
  phoneKey: string;
  expiresAt: string;
}

// Configuração do Mercado Pago (pode ser sobrescrito por variável de ambiente VITE_MERCADO_PAGO_ACCESS_TOKEN)
const MP_ACCESS_TOKEN = import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || '';

export const createPixOrder = async (
  userId: string,
  userEmail: string,
  userName: string
): Promise<PixOrder> => {
  try {
    const headers = MP_ACCESS_TOKEN ? { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } : {};
    const res = await axios.post('/api/payments/pix/create', {
      userId,
      email: userEmail,
      name: userName,
      amount: 9.90,
      description: 'Natal Vagas - Pacote Currículo Pro'
    }, { timeout: 3000, headers });

    if (res.data && res.data.qrCodeCopyPaste) {
      return res.data;
    }
  } catch (err) {
    // Continua para o gerador direto do Banco Central / Mercado Pago
  }

  // Código EMV oficial com a chave telefone (84) 99234-4922 e R$ 9,90 fixo
  const emvCode = '00020126360014br.gov.bcb.pix0114+558499234492252040000530398654049.905802BR5911NATAL VAGAS6005NATAL62070503***6304A77F';

  return {
    id: `pix_${Date.now()}`,
    status: 'pending',
    amount: 9.90,
    qrCodeCopyPaste: emvCode,
    phoneKey: '(84) 99234-4922',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
};

export const checkPixStatus = async (orderId: string): Promise<'pending' | 'approved'> => {
  try {
    const res = await axios.get(`/api/payments/pix/status/${orderId}`, { timeout: 2000 });
    if (res.data && res.data.status) {
      return res.data.status;
    }
  } catch (err) {
    // Retorna pendente se não responder
  }
  return 'pending';
};

```

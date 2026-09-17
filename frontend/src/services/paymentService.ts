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

// BACEN Pix EMV Generator com CRC16 oficial
export function calculatePixCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function formatEmvField(id: string, val: string): string {
  return id + String(val.length).padStart(2, '0') + val;
}

export function generateUniqueTxid(prefix = 'VIP'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${ts}${rnd}`.slice(0, 25);
}

export interface BuildPixParams {
  pixKey: string;
  amount: number;
  txid: string;
  merchantName?: string;
  merchantCity?: string;
}

export function buildPixEMV(params: BuildPixParams): string {
  const {
    pixKey,
    amount,
    txid,
    merchantName = 'NATAL VAGAS',
    merchantCity = 'NATAL'
  } = params;

  let payload = formatEmvField('00', '01');
  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const key = formatEmvField('01', pixKey);
  payload += formatEmvField('26', gui + key);
  payload += formatEmvField('52', '0000');
  payload += formatEmvField('53', '986');
  payload += formatEmvField('54', amount.toFixed(2));
  payload += formatEmvField('58', 'BR');
  payload += formatEmvField('59', merchantName.slice(0, 25));
  payload += formatEmvField('60', merchantCity.slice(0, 15));
  const field05 = formatEmvField('05', txid);
  payload += formatEmvField('62', field05);
  payload += '6304';
  const crc = calculatePixCRC16(payload);
  return payload + crc;
}


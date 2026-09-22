import { json } from "./_utils";
export const onRequestPost = async () => json({ success: false, message: "Concessão manual pública desativada. Use uma ordem de pagamento vinculada à conta." }, 410);

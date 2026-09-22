import { json } from "../auth/_utils";
export const onRequestPost = async () => json({ success: false, message: "Códigos universais foram desativados por segurança." }, 410);

import { config } from 'dotenv'
config()
const sett = {
    token: process.env.TOKEN,
    whatsappToken: process.env.WHATSAPP_TOKEN,
    whatsappUrl: process.env.WHATSAPP_URL,
    googleApiKey: process.env.GOOGLE_API_KEY,
    documentUrl: process.env.DOCUMENT_URL
}
export default sett;
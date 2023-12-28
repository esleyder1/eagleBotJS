import NodeGeocoder from "node-geocoder"
import sett from "./sett.js"
import fetch from "node-fetch"
const options = {provider: "google",apiKey: sett.googleApiKey};
const geocoder = NodeGeocoder(options)

let isFirstGreeting = true;
let requestName = false;
let confirmName = false;
let confirmAddress = false;
let customerAddress = ""

function getMsg(type, user) {
  const userName = user?.name || "User"
  const userLang = user?.lang || "en"
  const messages = {
    es: {
      addressDetected: 'La dirección detectada es, ',
      confirmAddress: 'Comparte tu ubicación desde WhatsApp nuevamente.',
      confirmName: 'confirma tu nombre.',
      farewell: "¡Hasta luego! Esperamos verte pronto.",
      greeting: `¡Hola! *${userName}*, elige el servicio que deseas.`,
      langList: ["Inglés 🇺🇸", "Español 🇪🇸"],
      msgNotFound: 'Mensaje no reconocido',
      msgUnknown: "¡Hola! Parece que mi entrenamiento me hace un poco despistado a veces 😅. ¿Cómo puedo ayudarte hoy?",
      optionsList: ["✅ Confirmar", "📝 Modificar"],
      service: "Gracias por utilizar nuestro servicio.",
      servicesList: ["Taxi 🚕", "Comida 🍔"],
      shareLocation: `¡Hola! *${userName}*, comparte tu ubicación desde WhatsApp.`,
      undetectedAddress: 'No se pudo obtener la dirección, intenta nuevamente',
      unrecognizedMsg: 'Mensaje no reconocido',
      verifyAddress: "Verifica por favor la dirección ingresada.",
      welcome: "HOla, soy EagleBot, para iniciar, ingresa tu nombre."
    },
    en: {
      addressDetected: 'The detected address is, ',
      confirmAddress: 'Share your location from WhatsApp again.',
      confirmName: 'confirm your name.',
      farewell: "Goodbye! We hope to see you again soon.",
      greeting: `Hello! *${userName}*, choose the service you want.`,
      langList: ["English 🇺🇸", "Spanish 🇪🇸"],
      msgNotFound: 'Message not found',
      msgUnknown: "Hello! It seems like my training makes me a little absent-minded sometimes 😅. How can I help you today?",
      optionsList: ["✅ Confirm", "📝 Modify"],
      service: "Thank you for using our service.",
      servicesList: ["Taxi 🚕", "Food 🍔"],
      shareLocation: `Hello! *${userName}*, share your location from WhatsApp.`,
      undetectedAddress: 'Unable to retrieve the address, try again.',
      unrecognizedMsg: 'Unrecognized message',
      verifyAddress: "Please verify the address entered.",
      welcome: `Hello, I'm EagleBot, to get started, enter your name.`
    }
  }
  const userMessages = messages[userLang] || messages["en"];
  return userMessages[type] || "Message not found"
}
function findUserByPhone(phone) {
  const customerData = {
    571234567890: { name: "Ana", age: 25, city: "City A", lang: "en" },
    579876543210: { name: "Juan", age: 30, city: "City B", lang: "es" },
    5732427962189: { name: "Maria", age: 28, city: "City C", lang: "en" },
  };
  return customerData[phone];
}
function startConversation(number, message, messageId) {
  let list = [];
  let markRead = markReadMessage(messageId)
  list.push(markRead)
  const greetings = {
    english: ["hello","hi","hey","good morning","good afternoon","good evening","greetings","hey there","hi there","welcome","hello there","morning","howdy","hi everyone"],
    spanish: ["hola","buenos días","buenas tardes","buenas noches","saludos","qué tal","bienvenido","hola qué tal","buen día","salutaciones","hola a todos"]
  }
  const services = {
    english: ["trip", "transfer", "transport", "driver", "car", "automobile", "mobility", "order", "restaurant", "deliver", "delivery", "menu", "lunch", "dinner", "fast", "taxi", "food"],
    spanish: ["viaje", "traslado", "transporte", "conductor", "coche", "automóvil", "movilidad","pedido", "restaurante", "entregar", "envío", "menú", "almuerzo", "cena", "rápido","taxi","comida"]
  }
  let user = findUserByPhone(number)
  if (isFirstGreeting) {
    const containsGreeting = Object.values(greetings).some((keywords) => keywords.some((greeting) => message.toLowerCase().includes(greeting.toLowerCase())))
    const containService = Object.values(services).some((keywords) => keywords.some((service) => message.toLowerCase().includes(service.toLowerCase())))
    if (containsGreeting) {
      if (user) {
        let body = getMsg("greeting", user)
        let options = getMsg("servicesList", user)
        let replyButtonData = buttonReplyMessage(number,options,body,"sed5",messageId)
        list.push(replyButtonData)
      } else {
        let textMsg = textMessage(number, getMsg("welcome"))
        sendMsgWhatsapp(textMsg)
        requestName = true
      }
      list.forEach((item) => {sendMsgWhatsapp(item)})
      isFirstGreeting = false;
    } else if (containService) {
      if (user) {
        let textMsg = textMessage(number,getMsg("shareLocation", user))
        sendMsgWhatsapp(textMsg)
      } else {
        let textMsg = textMessage(number, getMsg("welcome"))
        sendMsgWhatsapp(textMsg)
        requestName = true
      }
      isFirstGreeting = false;
    } else {
      let textMsg = textMessage(number, getMsg("msgUnknown"))
      sendMsgWhatsapp(textMsg)
      isFirstGreeting = true;
    }
  }
}
async function adminChatbot(text, number, messageId, name, session) {
  let list = [];
  let markRead = markReadMessage(messageId)
  list.push(markRead)
  setTimeout(() => {
    if (isFirstGreeting) {
      startConversation(number, text, messageId)
    } else {
      if (requestName) {
        let customerName = `*${text.charAt(0).toUpperCase() + text.slice(1)}*`
        let body = customerName + getMsg('confirmName');
        let options = getMsg('optionsList')
        let replyButtonData = buttonReplyMessage(number,options,body,"sed1",messageId)
        list.push(replyButtonData)
        requestName = false;
        confirmName = true;
      } else if (text.includes('dirección')) {
        let textMsg = textMessage(number, text)
        sendMsgWhatsapp(textMsg)
        let bodyConf = getMsg('verifyAddress')
        let optionsConf = getMsg('optionsList')
        let replyButtonDataConf = buttonReplyMessage(number,optionsConf,bodyConf,"sed1",messageId)
        list.push(replyButtonDataConf)
        confirmAddress = true;
      }
      if (confirmAddress) {
        if (text.includes("confirmar")) {
          let response =
            `Dirección de Recogida 📍: *${customerAddress}*\n` +
            "Tiempo Estimado: 15 minutos\n" +
            "Conductor: JUAN MONTOYA\n" +
            "Empresa de transporte: TAXI LAS AGUILAS"
          let textMessageName = textMessage(number, response)
          sendMsgWhatsapp(textMessageName)
          confirmAddress = false;
        } else if (text.includes("modificar")) {
          let textMessageName = textMessage(number, getMsg('confirmAddress'))
          sendMsgWhatsapp(textMessageName)
        }
      }
    }
    list.forEach((item) => {sendMsgWhatsapp(item)})
  }, 2000)
}
async function getWspMessage(message) {
  let text;
  if (!("type" in message)) {text = getMsg('unrecognizedMsg'); return text} const typeMessage = message["type"];
  if (typeMessage === "text") { text = message["text"]["body"]}
  else if (typeMessage === "location") {
    const latitude = message["location"]["latitude"]
    const longitude = message["location"]["longitude"]
    const address = await getAddress(latitude, longitude)
    if (address) {customerAddress = address;
      text = `${getMsg('addressDetected')}*${address}*`
    } else {
      text = getMsg('undetectedAddress')
    }
  } else if (typeMessage === "button") {text = message["button"]["text"]
  } else if (typeMessage === "interactive" && message["interactive"]["type"] === "list_reply") {text = message["interactive"]["list_reply"]["title"]
  } else if (typeMessage === "interactive" && message["interactive"]["type"] === "button_reply") {text = message["interactive"]["button_reply"]["title"]} else {text = "Unprocessed message"}
  return text;
}
function markReadMessage(messageId) {return JSON.stringify({messaging_product: "whatsapp",status: "read",message_id: messageId})}
async function getAddress(lat, lon) {
  try {
    const result = await geocoder.reverse({ lat, lon }); return result[0].formattedAddress;
  } catch (error) {console.error("Error getting address:", error.message); throw error}
}
async function sendMsgWhatsapp(data) {
  try {
    const headers = {"Content-Type": "application/json",Authorization: "Bearer " + sett.whatsappToken};
    const response = await fetch(sett.whatsappUrl, {method: "POST",headers: headers,body: data})
    // if (response.ok) {const responseData = await response.json()} 
    // else {const errorData = await response.json()}
  } catch (error) {return [error, 403]}
}
function textMessage(number, text) {return JSON.stringify({messaging_product: "whatsapp",recipient_type: "individual",to: number,type: "text",text: {body: text}})}
function buttonReplyMessage(number, options, body, sedd, messageId) {
  const buttons = options.map((option, i) => ({type: "reply",reply: {id: sedd + "_btn_" + (i + 1),title: option}}))
  return JSON.stringify({messaging_product: "whatsapp",recipient_type: "individual",to: number,type: "interactive",interactive: {type: "button",body: {text: body},action: {buttons: buttons}}})
}
function listReplyMessage(number, options, body, sedd, messageId) {
  const rows = options.map((option, i) => ({id: sedd + "_row_" + (i + 1),title: option,description: ""}))
  return JSON.stringify({messaging_product: "whatsapp",recipient_type: "individual",to: number,type: "interactive",interactive: {type: "list",body: {text: body},action: {button: "show options",sections: [{title: "Secciones",rows: rows}]}}})
}
function stickerMessage(number, stickerId) {return JSON.stringify({messaging_product: "whatsapp",recipient_type: "individual",to: number,type: "sticker",sticker: {id: stickerId}})}
function getMediaId(mediaName, mediaType) {
  let mediaId = ""
  if (mediaType === "sticker") {mediaId = sett.stickers[mediaName] || null}
  return mediaId;
}
function replyReactionMessage(number, messageId, emoji) {return JSON.stringify({messaging_product: "whatsapp",recipient_type: "individual",to: number,type: "reaction",reaction: {message_id: messageId,emoji: emoji}})}
function replaceStart(s) {if (s.startsWith("521")) {return "52" + s.slice(3)} else {return s}}
export {findUserByPhone,getAddress,getWspMessage,sendMsgWhatsapp,textMessage,replaceStart,adminChatbot,markReadMessage}

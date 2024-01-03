import NodeGeocoder from "node-geocoder"
import sett from "./sett.js"
import fetch from "node-fetch"
const options = { provider: "google", apiKey: sett.googleApiKey }
const geocoder = NodeGeocoder(options)

let isFirstGreeting = true
let requestName = false
let confirmName = false
let confirmAddress = false
let customerAddress = ""
let detectedAddress = false
let confirmLanguage = false
let confirmTypeService = false
let nativeLang = false

let typeServiceChoosed = null
let userName = null
let userLang = "en"

function getMsg(type, user) {
  if (userName === null) {
    userName = user?.name
  }
  userLang = user?.lang || userLang
  const messages = {
    es: {
      addressDetected: 'La dirección detectada es, ',
      assignedService: "Tu servicio ha sido asignado con los siguientes datos:",
      cancelService: 'Tu Servicio ha sido Cancelado',
      confirmAddressAgain: '🌐 Necesitamos tu dirección para proceder, ¿puedes confirmarla?',
      confirmName: 'confirma tu nombre.',
      driverName: 'Conductor: ',
      estimatedTime: 'Tiempo Estimado: ',
      farewell: "¡Hasta luego! Esperamos verte pronto.",
      greeting: `Hola👋, *${userName}*, elige el servicio que deseas.`,
      howShareLocation: 'Presiona 📎, selecciona la opción “ubicación” y “envía tu ubicación actual."',
      langList: ["Inglés 🇺🇸", "Español 🇪🇸"],
      lookingForVehicle: `*${userName}*, estamos buscando un vehículo disponible 🧭, cuando lo encontremos te notificaremos los datos del taxi.`,
      msgNotFound: 'Mensaje no reconocido',
      msgUnknown: "¡Hola! Parece que mi entrenamiento me hace un poco despistado a veces 😅. ¿Cómo puedo ayudarte hoy?",
      optionsList: ["✅ Confirmar", "📝 Modificar"],
      pickUpAddress: 'Dirección de Recogida 📍: ',
      rewriteName: 'Escribe tu nombre corectamente.',
      transportCompany: 'Empresa de transporte: ',
      preferredLang: '¿Cuál es tu idioma de preferencia para la conversación?',
      service: "Gracias por utilizar nuestro servicio.",
      servicesList: ["Taxi 🚕", "Comida 🍔"],
      shareLocation: 'Puedes ingresar manualmente una dirección o compartir tu ubicación.',
      shareLocationUserName: `¡Hola! *${userName}*, Puedes ingresar manualmente una dirección o compartir tu ubicación.`,
      shareLocationAgain: 'Comparte tu ubicación desde WhatsApp nuevamente.',
      undetectedAddress: 'No se pudo obtener la dirección, intenta nuevamente',
      unrecognizedMsg: 'Mensaje no reconocido',
      verifyAddress: "Verifica por favor la dirección ingresada.",
      welcome: "Hola, soy EagleBot 🤖. Es un placer atenderte. Para iniciar, ingresa tu nombre."
    },
    en: {
      addressDetected: 'The detected address is, ',
      assignedService: "Your service has been assigned with the following data:",
      cancelService: "Your service has been canceled.",
      confirmAddressAgain: '🌐 We need your address to proceed, can you confirm it?',
      confirmName: 'confirm your name.',
      driverName: 'Driver: ',
      estimatedTime: 'Estimated Time: ',
      farewell: "Goodbye! We hope to see you again soon.",
      greeting: `Hello👋, *${userName}*, choose the service you want.`,
      howShareLocation: 'Press 📎, select the "location" option, and "send your current location."',
      langList: ["English 🇺🇸", "Spanish 🇪🇸"],
      lookingForVehicle: `*${userName}*, we are looking for an available vehicle 🧭, and when we find it, we will notify you of the taxi's details.`,
      msgNotFound: 'Message not found',
      msgUnknown: "Hello! It seems like my training makes me a little absent-minded sometimes 😅. How can I help you today?",
      optionsList: ["✅ Confirm", "📝 Modify"],
      preferredLang: 'What is your preferred language for the conversation?',
      pickUpAddress: 'Pick-up Address 📍: ',
      rewriteName: 'Write your name correctly.',
      transportCompany: 'Transport Company: ',
      service: "Thank you for using our service.",
      servicesList: ["Taxi 🚕", "Food 🍔"],
      shareLocation: 'Share your location from WhatsApp',
      shareLocationUserName: `Hello! *${userName}*, share your location from WhatsApp.`,
      shareLocationAgain: 'Share your location from WhatsApp again.',
      undetectedAddress: 'Unable to retrieve the address, try again.',
      unrecognizedMsg: 'Unrecognized message',
      verifyAddress: "Please verify the address entered.",
      welcome: `Hello, I'm EagleBot 🤖. It's a pleasure to assist you. To begin, enter your name.`
    }
  }
  const userMessages = messages[userLang] || messages["en"];
  return userMessages[type] || "Message not found";
}
function findUserByPhone(phone) {
  const customerData = {
    571234567890: { name: "Ana", age: 25, city: "City A", lang: "en" },
    579876543210: { name: "Juan", age: 30, city: "City B", lang: "es" },
    573242796218: { name: "Esleyder", age: 28, city: "City C", lang: "es" },
    1: { name: "William", age: 28, city: "Salt Lake City", lang: "en" },
  }
  return customerData[phone];
}
/*
  startConversation() extrae el mensaje del cliente para determinar la intención.
*/
function startConversation(number, message, messageId) {
  let list = [];
  let markRead = markReadMessage(messageId);
  list.push(markRead);
  const greetings = {
    en: ["hello","hi","hey","good morning","good afternoon","good evening","greetings","hey there","hi there","welcome","hello there","morning","howdy","hi everyone"],
    es: ["hola","buenos días","buenas tardes","buenas noches","saludos","qué tal","bienvenido","hola qué tal","buen día","salutaciones","hola a todos"]
  }
  const services = {
    en: ["vehicle", "trip", "transfer", "transport", "driver", "car", "automobile", "mobility", "order", "restaurant", "deliver", "delivery", "menu", "lunch", "dinner", "fast", "taxi", "food"],
    es: ["vehiculo", "viaje", "traslado", "transporte", "conductor", "coche", "automóvil", "movilidad","pedido", "restaurante", "entregar", "envío", "menú", "almuerzo", "cena", "rápido","taxi","comida"]
  }
  //findUserByPhone() busca por medio del número de telefono a un usuario.
  let user = findUserByPhone(number);
  let foundService = false;
  if (isFirstGreeting) {
    //foundGreeting => busca coincidencias en el objeto 'greetings', y obtiene el idioma en el cual se entró la coincidencia, devuelve true o false.
    let foundGreeting = Object.entries(greetings).some(
      ([lang, greetingsList]) => {
        if (
          greetingsList.some((greeting) =>
            greeting.toLowerCase().includes(message.toLowerCase())
          )
        ) {
          userLang = lang;
          return true;
        }
        return false;
      }
    );

    if (!foundGreeting) {
      foundService = Object.entries(services).some(([lang, servicesList]) => {
        if (
          servicesList.some((service) =>
            service.toLowerCase().includes(message.toLowerCase())
          )
        ) {
          userLang = lang;
          return true;
        }
        return false;
      });
    }
    // foundGreeting => true, el bot responde con un mensaje de saludo + los servicios que ofrece.
    // sino encuentra el saludo, responde con una bienvenida.
    if (foundGreeting) {
      if (user) {
        let body = getMsg("greeting", user);
        let options = getMsg("servicesList", user);
        let replyButtonData = buttonReplyMessage(
          number,
          options,
          body,
          "sed1",
          messageId
        );
       list.push(replyButtonData); 
        confirmTypeService = true;
      } else {
        let textMsg = textMessage(number, getMsg("welcome"));
        sendMsgWhatsapp(textMsg);
        requestName = true;
      }

      isFirstGreeting = false;
    } else if (foundService) {
      if (user) {
        let requestLocation = sendRequestLocation(number,getMsg("shareLocationUserName",user))
        list.push(requestLocation); 
      } else {
        let textMsg = textMessage(number, getMsg("welcome"));
        sendMsgWhatsapp(textMsg);
        requestName = true;
      }
      isFirstGreeting = false;
    } else {
      let textMsg = textMessage(number, getMsg("msgUnknown"));
      sendMsgWhatsapp(textMsg);
      isFirstGreeting = true;
    }

    list.forEach((item) => {
      sendMsgWhatsapp(item);
    });
  }
}
/**
 * Administra el chatbot con la información proporcionada.
 *
 * @param {string} text - El texto o contenido del mensaje del cliente.
 * @param {string} number - Un número del cliente
 * @param {string} messageId - El identificador único del mensaje
 */
async function adminChatbot(text, number, messageId) {
  let list = [];
  let markRead = markReadMessage(messageId);
  list.push(markRead);
  setTimeout(async () => {
    //isFirstGreeting, determina si es el primer mensaje del cliente.
    if (isFirstGreeting) {
      startConversation(number, text, messageId);
    } else {
      if (confirmTypeService) {
        let msg = getMsg("shareLocation") + "\n\n" + getMsg("howShareLocation");
        let textMsg = textMessage(number, msg);
        sendMsgWhatsapp(textMsg);
        typeServiceChoosed = text;
        confirmTypeService = false;
      } else if (requestName) {
        userName = `${text.charAt(0).toUpperCase() + text.slice(1)}`;
        let body = `*${userName}* ` + getMsg("confirmName");
        let options = getMsg("optionsList");
        let replyButtonData = buttonReplyMessage(
          number,
          options,
          body,
          "sed2",
          messageId
        );
        list.push(replyButtonData);
        requestName = false;
        confirmName = true;
      } else if (confirmName) {
        console.log(nativeLang);

        if (
          text.toLowerCase().includes("confirm") ||
          text.toLowerCase().includes("confirmar")
        ) {
          let textMsg = textMessage(number, getMsg("shareLocation"));
          sendMsgWhatsapp(textMsg);
          confirmName = false;
        } else {
          let textMsg = textMessage(number, getMsg("rewriteName"));
          sendMsgWhatsapp(textMsg);
          confirmName = true;
        }
      } else if (confirmLanguage) {
        console.log(text, text.includes("english"));
        if (text.includes("english") || text.includes("inglés")) {
          userLang = "en";
        } else if (text.includes("spanish") || text.includes("español")) {
          userLang = "es";
        }
        let textMsg = textMessage(number, getMsg("shareLocation"));
        sendMsgWhatsapp(textMsg);
        confirmLanguage = false;
      } else if (detectedAddress) {
        let textMsg = textMessage(number, text);
        sendMsgWhatsapp(textMsg);
        await sleep(1000);
        let body = getMsg("verifyAddress");
        let options = getMsg("optionsList");
        let replyButtonData = buttonReplyMessage(
          number,
          options,
          body,
          "sed3",
          messageId
        );
        list.push(replyButtonData);
        detectedAddress = false;
        confirmAddress = true;
      } else if (confirmAddress) {
        if (
          text.toLowerCase().includes("confirm") ||
          text.toLowerCase().includes("confirmar")
        ) {
          let textMsg = textMessage(number, getMsg("lookingForVehicle"));
          sendMsgWhatsapp(textMsg);
          sendAssignedService(customerAddress, number);
          isFirstGreeting = true;
        } else if (
          text.toLowerCase().includes("modify") ||
          text.toLowerCase().includes("modificar")
        ) {
          let textMessageName = textMessage(
            number,
            getMsg("shareLocationAgain")
          );
          sendMsgWhatsapp(textMessageName);
        } else {
          let body = getMsg("confirmAddressAgain");
          let options = getMsg("optionsList");
          let replyButtonData = buttonReplyMessage(
            number,
            options,
            body,
            "sed4",
            messageId
          );
          list.push(replyButtonData);
          detectedAddress = false;
          confirmAddress = true;
        }
      }
    }
    list.forEach((item) => {
      sendMsgWhatsapp(item);
    });
  }, 2000);
}

// getWspMessage() obtiene el mensaje y extrae el tipo del mensaje, puede ser text, location, etc.
async function getWspMessage(message) {
  let text;
  if (!("type" in message)) {
    text = getMsg("unrecognizedMsg");
    return text;
  }
  const typeMessage = message["type"];
  if (typeMessage === "text") {
    text = message["text"]["body"];
  } else if (typeMessage === "location") {
    const latitude = message["location"]["latitude"];
    const longitude = message["location"]["longitude"];
    const address = await getAddress(latitude, longitude);
    if (address) {
      customerAddress = address;
      text = `${getMsg("addressDetected")}*${address}*`;
    } else {
      text = getMsg("undetectedAddress");
    }
  } else if (typeMessage === "button") {
    text = message["button"]["text"];
  } else if (
    typeMessage === "interactive" &&
    message["interactive"]["type"] === "list_reply"
  ) {
    text = message["interactive"]["list_reply"]["title"];
  } else if (
    typeMessage === "interactive" &&
    message["interactive"]["type"] === "button_reply"
  ) {
    text = message["interactive"]["button_reply"]["title"];
  } else {
    text = "Unprocessed message";
  }
  return text;
}
// markReadMessage() pone el doble check azul
function markReadMessage(messageId) {
  return JSON.stringify({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
// getAddress() obtiene la latitud y longitud para poder convertilo en una dirección formateada.
async function getAddress(lat, lon) {
  try {
    const result = await geocoder.reverse({ lat, lon });
    detectedAddress = true;
    return result[0].formattedAddress;
  } catch (error) {
    console.error("Error getting address:", error.message);
    throw error;
  }
}
// sendMsgWhatsapp() obtiene el json construido y lo envia como mensaje del bot.
async function sendMsgWhatsapp(data) {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sett.whatsappToken,
    };
    const response = await fetch(sett.whatsappUrl, {
      method: "POST",
      headers: headers,
      body: data,
    });
    if (response.ok) {const response = await response.json()}
    else {
      const error = await response.json()
      console.log(error)
    }
  } catch (error) {
    return [error, 403];
  }
}
//textMessage () se emplea para enviar un mensaje de solo texto.
function textMessage(number, text) {
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "text",
    text: { body: text },
  });
}
//buttonReplyMessage() se emplea para enviar un mensaje con texto y botones.
/**
 * Params
 *  number => (string) recibe el número del whatsapp del cliente.
    options => (array) en este ejemplo se observa un arreglo de dos opciones, 
    que luego se convertiran en botones y tendrán un identificador único, ["Taxi 🚕", "Comida 🍔"]
    body => (string) cuerpo del mensaje
    seed => (string) identificador único del mensaje
 */
function buttonReplyMessage(number, options, body, seed, messageId) {
  const buttons = options.map((option, i) => ({
    type: "reply",
    reply: { id: seed + "_btn_" + (i + 1), title: option },
  }));
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons },
    },
  });
}
//listReplyMessage() envia un mensaje con una lista de opciones.
/**
 * Params
 *  number => (string) recibe el número del whatsapp del cliente.
    options => (array) opciones de una lista y tendrán un identificador único ["Taxi 🚕", "Comida 🍔"]
    body => (string) cuerpo del mensaje
    seed => (string) identificador único del mensaje
 */
function listReplyMessage(number, options, body, seed) {
  const rows = options.map((option, i) => ({
    id: seed + "_row_" + (i + 1),
    title: option,
    description: "",
  }));
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: "show options",
        sections: [{ title: "Sections", rows: rows }],
      },
    },
  });
}

/*
sendRequestLocation() permite enviar un mensaje interactivo, se le pasa una cadena de texto, 
el se enviará un mensaje con un botón por defecto: Enviar Ubicación, el texto cambia dependiendo del idioma de la aplicación
*/
function sendRequestLocation(number, body) {
  console.log(typeof(body))
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive:{
       type: "location_request_message",
       body: { text: body },
       action: {
           name: "send_location" 
       }
    }
  });
}

/*
stickerMessage() enviar un sticket de la lista de stickers.
uso => sticker = stickerMessage(number, getMediaId("perro_traje", "sticker"))
*/
function stickerMessage(number, stickerId) {
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "sticker",
    sticker: { id: stickerId },
  });
}
function getMediaId(mediaName, mediaType) {
  let mediaId = "";

  if (mediaType === "sticker") {
    mediaId = sett.stickers[mediaName] || null;
  }
  else if (mediaType === "image") {
    mediaId = sett.images[mediaName] || null;
  } else if (mediaType === "video") {
    mediaId = sett.videos[mediaName] || null;
  } else if (mediaType === "audio") {
    mediaId = sett.audio[mediaName] || null;
  }

  return mediaId;
}

/*
replyReactionMessage() se usa para responder a un mensaje del cliente con un emoji.
uso => replyReaction = replyReactionMessage(number, messageId, "🫡")
*/
function replyReactionMessage(number, messageId, emoji) {
  return JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "reaction",
    reaction: { message_id: messageId, emoji: emoji },
  });
}
// sleep() metodo usado para crear una demora entre un mensaje y otro.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
//sendAssignedService() Evento para enviar un mensaje con el servicio asignado y el detalle.
async function sendAssignedService(customerAddress, number) {
  try {
    await sleep(10000);
    let response =
      getMsg("assignedService") + "\n\n" +
      getMsg("pickUpAddress") + ` *${customerAddress}*\n` +
      getMsg("estimatedTime") + "15m\n" +
      getMsg("driverName") + "JUAN MONTOYA\n" +
      getMsg("transportCompany") + "TAXI LAS AGUILAS";

    let textService = textMessage(number, response);
    await sendMsgWhatsapp(textService);
    // let textCancel = textMessage(number, getMsg('cancelService'));
    // await sendMsgWhatsapp(textCancel);
    confirmAddress = false;
  } catch (error) {
    console.error("Error sending assigned service message:", error);
  }
}

export {getWspMessage,adminChatbot }

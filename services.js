import NodeGeocoder from "node-geocoder";
import sett from "./sett.js";
import fetch from "node-fetch";
const options = {
  provider: "google",
  apiKey: sett.googleApiKey,
};
const geocoder = NodeGeocoder(options);

let isFirstGreeting = true;
let requestName = false;
let confirmName = false;
let confirmAddress = false;
let customerAddress = "";

function getMessage(type, user) {
  const userName = user?.name || "Usuario";
  const userLang = user?.lang || "en";

  const messages = {
    es: {
      greeting: `¡Hola! *${userName}*, elige el servicio que deseas`,
      welcome: "HOla, soy EagleBot, para iniciar, ingresa tu nombre",
      service: "Gracias por utilizar nuestro servicio",
      farewell: "¡Hasta luego! Esperamos verte pronto",
      servicesList: ["Taxi 🚕", "Comida 🍔"],
      langList: ["Inglés 🇺🇸", "Español 🇪🇸"],
    },
    en: {
      greeting: `Hello! *${userName}*, choose the service you want`,
      welcome: `Hello, I'm EagleBot, to get started, enter your name`,
      service: "Thank you for using our service",
      farewell: "Goodbye! We hope to see you again soon",
      servicesList: ["Taxi 🚕", "Food 🍔"],
      langList: ["English 🇺🇸", "Spanish 🇪🇸"],
    },
  };

  const userMessages = messages[userLang] || messages["en"];
  return userMessages[type] || "Message not found";
}

function findUserByPhone(phone) {
  const customerData = {
    571234567890: { name: "Ana", age: 25, city: "City A", lang: "en" },
    579876543210: { name: "Juan", age: 30, city: "City B", lang: "es" },
    573242796218: { name: "Maria", age: 28, city: "City C", lang: "es" },
  };
  const user = customerData[phone];
  return user;
}

function startConversation(number, message, messageId) {
  let list = [];
  let markRead = markReadMessage(messageId);
  list.push(markRead);

  const greetingKeywords = {
    english: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "greetings",
      "hey there",
      "hi there",
      "welcome",
      "hello there",
      "morning",
      "howdy",
      "hi everyone",
    ],
    spanish: [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "saludos",
      "qué tal",
      "bienvenido",
      "hola qué tal",
      "buen día",
      "salutaciones",
      "hola a todos",
    ],
  };

  const changeDirectionKeywords = ["taxi", "comida"];
  let user = findUserByPhone(number);
  if (isFirstGreeting) {
    const containsGreeting = Object.values(greetingKeywords).some((keywords) =>
      keywords.some((greeting) =>
        message.toLowerCase().includes(greeting.toLowerCase())
      )
    );
    const shouldChangeDirection = changeDirectionKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    if (containsGreeting) {
      console.log(containsGreeting);
      if (user) {
        let body = getMessage("greeting", user);
        let options = getMessage("servicesList", user);

        let replyButtonData = buttonReplyMessage(
          number,
          options,
          body,
          "sed5",
          messageId
        );
        list.push(replyButtonData);

      } else {
        let textMsg = textMessage(number, getMessage("welcome"));
        sendMsgWhatsapp(textMsg);

        // let body = "Choose your language";
        // let options = getMessage('langList');

        // let replyButton = buttonReplyMessage(number,options,body,"sed6",messageId);
        // list.push(replyButton);

      }
      list.forEach((item) => {
        sendMsgWhatsapp(item);
      });
      isFirstGreeting = false;
    } else if (shouldChangeDirection) {
      if (user) {
        let textMsg = textMessage(
          number,
          `¡Hola! *${user.name}*, comparte tu ubicación desde WhatsApp`
        );
        sendMsgWhatsapp(textMsg);
      } else {
        let textMsg = textMessage(number, getMessage("welcome"));
        sendMsgWhatsapp(textMsg);
      }
      isFirstGreeting = false;
    } else {
      let textMsg = textMessage(
        number,
        "¡Hola! Parece que mi entrenamiento me hace un poco despistado a veces 😅. ¿Cómo puedo ayudarte hoy?"
      );
      sendMsgWhatsapp(textMsg);
      isFirstGreeting = true;
    }
    
  }
}

async function adminChatbot(text, number, messageId, name, session) {
  let list = [];
  let markRead = markReadMessage(messageId);
  list.push(markRead);
  setTimeout(() => {
    if (isFirstGreeting) {
      startConversation(number, text, messageId);
    } else {
      if (requestName) {
        let customerName = `*${text.charAt(0).toUpperCase() + text.slice(1)}*`;
        let body = `${customerName} confirma tu nombre`;
        let options = ["✅ Confirmar", "📝 Modificar"];

        let replyButtonData = buttonReplyMessage(
          number,
          options,
          body,
          "sed1",
          messageId
        );
        list.push(replyButtonData);
        requestName = false;
        confirmName = true;
      } else if (text.includes("dirección")) {
        let textMsg = textMessage(number, text);
        sendMsgWhatsapp(textMsg);
        let bodyConf = "Verifica por favor la dirección ingresada";
        let optionsConf = ["✅ Confirmar", "📝 Modificar"];

        let replyButtonDataConf = buttonReplyMessage(
          number,
          optionsConf,
          bodyConf,
          "sed1",
          messageId
        );
        list.push(replyButtonDataConf);
        confirmAddress = true;
      }

      if (confirmAddress) {
        if (text.includes("confirmar")) {
          let response =
            `Dirección de Recogida 📍: *${customerAddress}*\n` +
            "Tiempo Estimado: 15 minutos\n" +
            "Conductor: JUAN MONTOYA\n" +
            "Empresa de transporte: TAXI LAS AGUILAS";

          let textMessageName = textMessage(number, response);
          sendMsgWhatsapp(textMessageName);
          confirmAddress = false;
        } else if (text.includes("modificar")) {
          let textMessageName = textMessage(
            number,
            "Comparte tu ubicación desde WhatsApp nuevamente."
          );
          sendMsgWhatsapp(textMessageName);
        }
      }
    }

    list.forEach((item) => {
      sendMsgWhatsapp(item);
    });
  }, 2000);
}

async function getWspMessage(message) {
  let text;

  if (!("type" in message)) {
    text = "Unrecognized message";
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
      text = `La dirección detectada es, *${address}*`;
    } else {
      text = "Unable to retrieve the address.";
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

function markReadMessage(messageId) {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });

  return data;
}

async function getAddress(lat, lon) {
  try {
    const result = await geocoder.reverse({ lat, lon });
    return result[0].formattedAddress;
  } catch (error) {
    console.error("Error getting address:", error.message);
    throw error;
  }
}

async function sendMsgWhatsapp(data) {
  try {
    const whatsappToken = sett.whatsappToken;
    const whatsappUrl = sett.whatsappUrl;

    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + whatsappToken,
    };
    const response = await fetch(whatsappUrl, {
      method: "POST",
      headers: headers,
      body: data,
    });
    // if (response.ok) {
    //   const responseData = await response.json();
    // } else {
    //   const errorData = await response.json();
    // }
  } catch (error) {
    return [error, 403];
  }
}

function textMessage(number, text) {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "text",
    text: {
      body: text,
    },
  });

  return data;
}

function buttonReplyMessage(number, options, body, sedd, messageId) {
  const buttons = options.map((option, i) => ({
    type: "reply",
    reply: {
      id: sedd + "_btn_" + (i + 1),
      title: option,
    },
  }));

  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: body,
      },
      action: {
        buttons: buttons,
      },
    },
  });

  return data;
}

function listReplyMessage(number, options, body, sedd, messageId) {
  const rows = options.map((option, i) => ({
    id: sedd + "_row_" + (i + 1),
    title: option,
    description: "",
  }));

  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text: body,
      },
      action: {
        button: "Ver Opciones",
        sections: [
          {
            title: "Secciones",
            rows: rows,
          },
        ],
      },
    },
  });

  return data;
}

function stickerMessage(number, stickerId) {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "sticker",
    sticker: {
      id: stickerId,
    },
  });

  return data;
}

function getMediaId(mediaName, mediaType) {
  let mediaId = "";

  if (mediaType === "sticker") {
    mediaId = sett.stickers[mediaName] || null;
  }
  // else if (mediaType === "image") {
  //     mediaId = sett.images[mediaName] || null;
  // } else if (mediaType === "video") {
  //     mediaId = sett.videos[mediaName] || null;
  // } else if (mediaType === "audio") {
  //     mediaId = sett.audio[mediaName] || null;
  // }

  return mediaId;
}

function replyReactionMessage(number, messageId, emoji) {
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "reaction",
    reaction: {
      message_id: messageId,
      emoji: emoji,
    },
  });

  return data;
}

function replaceStart(s) {
  if (s.startsWith("521")) {
    return "52" + s.slice(3);
  } else {
    return s;
  }
}

export {
  findUserByPhone,
  getAddress,
  getWspMessage,
  sendMsgWhatsapp,
  textMessage,
  replaceStart,
  adminChatbot,
  markReadMessage,
};
## Features

- Send text messages
- Send menus with buttons or lists
- Send stickers
- Mark messages as "seen" (blue double check)
- React to user messages with emojis
- Send PDF documents

## To Test Locally

1. Navigate to the directory where you downloaded the project

```bash
  cd eagleBotJS
```
2. Create a virtual environment with Python version 3.10

```bash
  virtualenv -p 3.10.11 .venv
```
3. Activate the virtual environment

```bash
  source .venv/bin/activate
```
4. Install dependencies

```bash
  pip install -r requirements.txt
```

5. Run the application

```bash
  python app.py
```


## Simulate User Messages with Postman

```javascript
Enter the URL
http://127.0.0.1:5000/webhook


In the body, select "raw" and type "JSON", don't forget to add your number
{
  "object": "whatsapp_business_account",
  "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
          "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                  "display_phone_number": "PHONE_NUMBER",
                  "phone_number_id": "PHONE_NUMBER_ID"
              },
              "contacts": [{
                  "profile": {
                    "name": "NAME"
                  },
                  "wa_id": "PHONE_NUMBER"
                }],
              "messages": [{
                  "from": "agrega tu numero",
                  "id": "wamid.ID",
                  "timestamp": "TIMESTAMP",
                  "text": {
                    "body": "hola"
                  },
                  "type": "text"
                }]
          },
          "field": "messages"
        }]
  }]
}
```


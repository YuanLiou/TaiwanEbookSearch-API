import TelegramBot from 'node-telegram-bot-api';

let bot: TelegramBot;
let groupId: string;

export const botInit = (token: string, group: string) => {
  return new Promise((resolve, reject) => {
    if (bot) {
      return reject('bot is already inited.');
    }

    bot = new TelegramBot(token, { polling: false });
    groupId = group;

    resolve();
  }).catch(error => {
    if (error) {
      console.error(error);
    }
  });
};

export const sendMessage = (message: string) => {
  return bot
    .sendMessage(groupId, message, { parse_mode: 'Markdown' })
    .catch(error => console.error(error));
};

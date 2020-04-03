"use strict";

const Discord = require('discord.js');

let client = new Discord.Client();
let dmTimers = [];
let destChannel;

const config = require('./config.json');

async function main() {
  // Handlers
  client.on('ready', async () => {
    // Console feedback
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);

    // Bot invite link
    let inviteLink = await client.generateInvite(['VIEW_CHANNEL', 'SEND_MESSAGES'])
    console.log(`Invite link is: ${inviteLink}`);

    // Get destination channel
    try {
      destChannel = await client.channels.fetch(config.destChannel);
      console.log(`Ready to relay DMs to #${destChannel.name} in ${destChannel.guild}`);
    } catch (e) {
      console.error("UNABLE TO SET DESTINATION CHANNEL!", e);
    }
  });

  client.on('message', async (msg) => {
    // Ugh... its me okay?
    if (msg.author.id === client.user.id) return;

    // Is this a DM?
    if (msg.guild) return;

    // Creates an Embed
    let embed = new Discord.MessageEmbed()
    embed.setDescription(msg.content);

    try {
      // Try sending the message
      await destChannel.send(`Message received from ${msg.author}`, embed);
      console.log(`Message from ${msg.author.username}#${msg.author.discriminator} (${msg.author.id} delivered successfully)`);

      // Setup the timer to send the feedback into
      setFeedbackTimer(msg.author.id);
    } catch (e) {
      // Failed to send message, let the user know
      try {
        await msg.channel.send('Unable to deliver message');
        console.error(`Unable to deliver message`, e);
      } catch (e) {/* bad luck... */ console.log(e);}
    }

    // Link attachments
    let attachments = msg.attachments.array();
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          let embed = new Discord.MessageEmbed();
          embed.setImage(`${attachment.proxyURL}`);
          await destChannel.send('\u200b', embed);
        } catch (e) {
          await msg.channel.send('Unable to send attachment');
          console.error('Unable to send attachment', e);
        }
      }
    }

  });

  // Login to discord
  await client.login(config.discord.token);
}

function setFeedbackTimer(id) {
  // If there is an existing timer, delete it (to reset it)
  if (dmTimers[id]) clearTimeout(dmTimers[id]);

  // Create a new timeout timer
  dmTimers[id] = setTimeout(() => sentFeedback(id), config.feedbackTime * 1000);
}

async function sentFeedback(id) {
  // Send the feedback message to let the user know the message is delivered
  try {
    // Fetch the dm channel to send the feedback into
    let user = await client.users.fetch(id);
    await user.send(`Message delivered successfully, a member of the moderator team will be taking a look at it shortly`);
  } catch (e) {
    console.error(`Delivered feedback couldn't be sent`, e);
  }

  // Delete the timer
  delete dmTimers[id];
}

main();

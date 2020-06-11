const express = require('express')
const bodyParser = require('body-parser');
const request = require('request-promise-native')
require('dotenv').config()

const {WebClient} = require('@slack/web-api');

const slackClient = new WebClient(process.env.BOT_USER_OAUTH_ACCESS_TOKEN);

const app = express();

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({extended: true}));

app.post("/slack/handle_response", async function (req, res) {
  console.log(req.body)
  const payload = JSON.parse(req.body.payload)

  if (payload) {
    if (payload.type === "dialog_submission") {
      const callback_id = payload.callback_id

      if (callback_id === "submit_standup_dialog") {

        const data = {
          "user_id": payload.user.id,
          "yesterday": payload.submission.yesterday.trim(),
          "today": payload.submission.today.trim(),
          "timeline": payload.submission.timeline.trim(),
          "obstacles": payload.submission.obstacles.trim()
        }

        const attachments = [
          {
            "text": data.yesterday,
            "title": "What was done yesterday",
            "color": "2eb886",
            "mrkdwn_in": [
              "text",
              "title",
              "pretext",
              "fields"
            ],
            "fallback": "What did you do yesterday?"
          },
          {
            "text": data.today,
            "title": "What will be done today",
            "color": "2eb886",
            "mrkdwn_in": [
              "text",
              "title",
              "pretext",
              "fields"
            ],
            "fallback": "What did you do today?"
          },
          {
            "text": data.timeline,
            "title": "Changes to timelines",
            "color": "2eb886",
            "mrkdwn_in": [
              "text",
              "title",
              "pretext",
              "fields"
            ],
            "fallback": "Changes to timelines?"
          },
          {
            "text": data.obstacles,
            "title": "What are your blockers",
            "color": "2eb886",
            "mrkdwn_in": [
              "text",
              "title",
              "pretext",
              "fields"
            ],
            "fallback": "What are your blockers?"
          }
        ]

        await slackClient.apiCall(
          'chat.postMessage',
          {
            channel: process.env.STANDUP_CHANNEL_ID,
            text: `Hi, <@${data.user_id}> submitted their stand-up`,
            username: "Standup Alice",
            attachments
          }
        )

        await request(
          {
            method: "POST",
            uri: payload.response_url,
            body: {
              text: 'Thank you! :tada:',
              response_type: "ephemeral"
            },
            json: true
          })

        return res.send('')
      }
      return res.send('')
    }
    return res.send('')
  } else {
    return res.send('')
  }

})

app.post("/slack/command", async function (req, res) {
  const {trigger_id} = req.body;

  await slackClient.apiCall('dialog.open', {
    dialog: {
      "title": "Daily Standup",
      "submit_label": "Submit",
      "callback_id": "submit_standup_dialog",
      "elements": [
        {
          "label": "What did you do yesterday?",
          "name": "yesterday",
          "type": "textarea",
          "hint": "What did you do yesterday?"
        },
        {
          "label": "What will you do today?",
          "name": "today",
          "type": "textarea",
          "hint": "What will you do today?"
        },
        {
          "label": "Are there changes to the timelines?",
          "name": "timeline",
          "type": "textarea",
          "hint": "Are there changes to the timelines?"
        },
        {
          "label": "What are your blockers?",
          "name": "obstacles",
          "type": "textarea",
          "hint": "What are your blockers?"
        }
      ]
    },
    trigger_id
  })

  return res.send('')
})

app.listen(process.env.PORT || 4100, () => {
  console.log('App is listening')
})

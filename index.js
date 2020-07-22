'use strict'
const requestPromise = require('request-promise')
const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: 'ap-northeast-1'
})
let slackPostOption = {
  url: 'https://slack.com/api/chat.postMessage',
  method: 'POST',
  qs: {
    token: process.env.SLACK_TOKEN,
    channel: process.env.SLACK_CHANNEL,
    text: '',
    username: 'ぼくのいうことはぜったい'
  },
  json: true
}

exports.handler = async () => {
  return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => {
      // 直近のファシリテーターを取得
      return getLatestFacilitator()
    })
    .then((latestFacilitator) => {
      // ランダムに取得（直近を除く）
      return getFacilitator(latestFacilitator)
    })
    .then((facilitator) => {
      // 直近のファシリテーターを登録
      return putLatestFacilitator(facilitator)
    })
    .then((facilitator) => {
      // Slackに通知
      return postSlack(facilitator)
    })
    .then(() => {
      resolve('Finish')
    })
    .catch(reject)
  })
}

const getLatestFacilitator = () => {
  const param = {
    TableName: 'FacilitatorHistory',
    Key: {
      status: 'latest'
    }
  }
  return new Promise((resolve, reject) => {
    dynamodb.get(param, (err, data) => {
      if (err) reject(err)
      resolve(data.Item ? data.Item.member : '')
    })
  })
}

const getFacilitator = (latestFacilitator) => {
  return new Promise((resolve, reject) => {
    const memberList = process.env.MEMBER.split(',')
    const get = () => {
      const facilitator = memberList[Math.floor(Math.random() * memberList.length)]
      if (latestFacilitator == facilitator) {
        get()
        return
      }
      resolve(facilitator)
    }
    get()
  })
}

const putLatestFacilitator = (facilitator) => {
  return new Promise((resolve, reject) => {
    var param = {
    TableName: 'FacilitatorHistory',
      Item:{
        status: 'latest',
        member: facilitator
      }
    }
    dynamodb.put(param, (err, data) => {
      if (err) reject(err)
      resolve(facilitator)
    })
  })
}

const postSlack = (facilitator) => {
  return new Promise((resolve, reject) => {
    slackPostOption.qs.text = `きょうのあさかいは <${facilitator}> だ。`
    requestPromise(slackPostOption)
    .then(resolve)
    .catch(reject)
  })
}

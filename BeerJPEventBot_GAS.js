
var myLINEUserID = "<Your_LINE_User_ID>"; // LINEユーザーID
var myAccessToken = '<Your_LINE_Access_Token>'; // LINEアクセストークン
var calendarId = "84g71qbda1g27dr7i1arerq454@group.calendar.google.com"; // 全国ビールイベントカレンダー

// doPost関数を追加
function doPost(e) {
  try {
    var event = JSON.parse(e.postData.contents).events[0];

    if (event.type === 'message') {
      var userId = event.source.userId;
      var replyToken = event.replyToken;
      var userMessage = event.message.text;

      if (userMessage === "かんぱい" || userMessage === "乾杯" || userMessage === "関西") {
        var calendar = CalendarApp.getCalendarById(calendarId);
        var today = new Date();
        var oneWeeksFromNow = new Date();
        oneWeeksFromNow.setDate(today.getDate() + 7);
        var reqEvents = calendar.getEvents(today, oneWeeksFromNow);

        if (reqEvents.length > 0) {
          var responseMessage = "次の1週間のビールイベント予定:\n\n";
          
          for (var i = 0; i < reqEvents.length; i++) {
          //for (var i = 0; i < 2; i++) {
            var reqEvent = reqEvents[i];
            var title = reqEvent.getTitle();
            var startTime = reqEvent.getStartTime();
            var endTime = reqEvent.getEndTime();
            if (userMessage === "関西") {
              if (title.startsWith("大阪")||title.startsWith("兵庫")||title.startsWith("京都")||title.startsWith("滋賀")||title.startsWith("奈良")||title.startsWith("和歌山")) {
                responseMessage += title + " 【" + formatDate(startTime, 1) + "〜" + formatDate(endTime, 0) + "】\n";
              }
            } else {
              responseMessage += title + " 【" + formatDate(startTime, 1) + "〜" + formatDate(endTime, 0) + "】\n";
            }
            
          }
          // メッセージが5000文字を超える場合、5000文字にカット
          if (responseMessage.length > 5000) {
            responseMessage = responseMessage.substring(0, 4900) + "\n(以下略";
          }
          replyToUser(replyToken, responseMessage);
        } else {
          replyToUser(replyToken, "次の1週間、予定はありません。");
        }
      } else if (userMessage === "おはよう") {
        replyToUser(replyToken, "おはようございます");
      } else {
        replyToUser(replyToken, "あなたのユーザーIDは " + userId + " です。");
      }
    }
    return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error: " + error.toString());
  }
}

function replyToUser(replyToken, message) {
  var accessToken = myAccessToken;  // アクセストークン
  var url = 'https://api.line.me/v2/bot/message/reply';
  var payload = JSON.stringify({
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: message
      }
    ]
  });

  var options = {
    'method' : 'post',
    'contentType' : 'application/json',
    'headers' : {
      'Authorization' : 'Bearer ' + accessToken
    },
    'payload' : payload
  };
  UrlFetchApp.fetch(url, options);
}

function setTrigger() {

  let triggers = ScriptApp.getScriptTriggers();
  for(let trigger of triggers){
    let funcName = trigger.getHandlerFunction();
    if(funcName == 'sendLineNotifications'){
      ScriptApp.deleteTrigger(trigger);
    }
  }
  let now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  let d = now.getDate();
  let date = new Date(y, m, d+1, 08, 05);
  ScriptApp.newTrigger('sendLineNotifications').timeBased().at(date).create();
}

function sendLineNotifications() {
  var calendar = CalendarApp.getCalendarById(calendarId);
  var today = new Date();
  var twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);
  var events = calendar.getEvents(today, twoWeeksFromNow);

  if (events.length > 0) {
    var message = "次の2週間のビールイベント予定:\n\n";
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var title = event.getTitle();
      var startTime = event.getStartTime();
      var endTime = event.getEndTime();
      message += title + " 【" + formatDate(startTime, 1) + "〜" + formatDate(endTime, 0) + "】\n";
    }
    sendToLine(message);
  } else {
    sendToLine("次の2週間、予定はありません。");
  }
  setTrigger();
}

function formatDate(date, opt) {
  if (opt > 1) {
  return Utilities.formatDate(date, "JST", "yyyy/MM/dd HH:mm");
  } else {
    return Utilities.formatDate(date, "JST", "MM/dd");
  }
}

function sendToLine(message) {
  var accessToken = myAccessToken; // LINEアクセストークン
  var lineEndpoint = 'https://api.line.me/v2/bot/message/push';

  // メッセージが5000文字を超える場合、5000文字にカット
  if (message.length > 5000) {
    message = message.substring(0, 4900) + "\n(以下略";
  }
  var payload = JSON.stringify({
    to: myLINEUserID,
    messages: [{
      type: 'text',
      text: message
    }]
  });

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + accessToken
    },
    'payload': payload
  };
  UrlFetchApp.fetch(lineEndpoint, options);
}

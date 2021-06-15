/* Web socket web console */
//debugger;

/****** Settings ******/
// CTRL combos
const disKey = 68;  // disconnect key, default D (68)
const cliKey = 67;  // clear input key, default C (67)
const clrKey = 76;  // clear everything (input and message box), default L

// Prompts
// const praw = '#'; - unused 'raw' mode
const pcmd = '>';
const ppwd = 'PWD';

// Default mode. Modes: cmd, raw - unused, pwd
var reqm = 'cmd';

/****** END OF SETTINGS - DO NOT CHANGE ANYTHING BELOW THIS LINE ******/





/****** Definitions and declarations of variables and constants ******/
// CTRL combos
var ctrlDown = false;
const ctrlKey = 17; // CTRL key
const cmdKey = 91;  // command key

// Message types
const err = 'err';
const con = 'con';
const cof = 'cof';
const warn = 'warn';

// WebSocket client
var host;
var socket;

// Message box - selects message box only one time (improves performance)
const msgb = $('#msgbox');

// Prompt init
if (reqmode(reqm) == -1) {
  mess('Switching mode to cmd', warn);
  reqmode('cmd');
}

/****** END OF DEFINITIONS/DECLARATIONS OF VARS/CONSTS*/


/****** Document on load ******/
$(function() {
  $('#jsupport').remove();
  $('label[for="cli"]').html('CTRL+' + String.fromCharCode(cliKey) + ' clears input');
  $('label[for="clr"]').html('CTRL+' + String.fromCharCode(clrKey) + ' clears screen');
  $('label[for="dis"]').html('CTRL+' + String.fromCharCode(disKey) + ' disconnects');
  /****** Event registration when the page loads ******/
  //// SOCKET CONNECTION FORM AND SOCKET HANDLING
  $('#srv').submit(function(e) {
    e.preventDefault();
    host = $('#srvi').val();

    if (host == '') mess('Host not specified', err);
    else if ($('#port').val() == '') mess('Port not specified', err);
    else if ((host.indexOf('ws://') != 0) && (host.indexOf('wss://') != 0)) mess('Invalid host. Maybe missing wss:// or ws://?', err);
    else {
      host = $('#srvi').val() + ':' + $('#port').val();
      mess('Connecting to ' + host, cof);
      sem('yellow');
      connen(false);
      if (host.indexOf('ws://') == 0) mess('Alert! You are using an unsafe protocol (ws://). Usage of this protocol is discouraged, use wss:// instead.', warn);

      socket = new WebSocket(host);
      socket.onclose = function(event) {
        if (event.wasClean) {
          mess('Connection to ' + host + ' closed, code: ' + event.code + ' reason: ' + event.reason', con);
        } else {
          // e.g. server process killed or network down
          // event.code is usually 1006 in this case
          mess('Connection to ' + host + ' unexpectedly closed or connecting failed, error code: ' + event.code + ' reason: ' + event.reason, err);
          connen(true);
        }
        disconnect();
      };

      socket.onerror = function() {
        mess('An error occured, check console for details!', err);
      };

      socket.onopen = function() {
        mess('Connection to ' + host + ' established', con);
        sem('lightgreen');
        reqmode('enable');
      };

      socket.onmessage = function(msg) {
        mess(msg.data);
      };
    }
  });

  //// TOP PANEL CONTROLS
  $('input[name=inp]').change(function() {
    reqmode(this.id);
  });
  $('input[name=ctl]').change(function() {
    document.getElementById('req').focus();
  });

  //// DISCONNECTOR - BUTTON
  $('#closecon').click(function(e) {
    e.preventDefault();
    disconnect();
  });

  //// DISCONNECTOR AND CLEARER - CTRL+disKey (default CTRL+D), CTRL+cliKey (default CTRL+C) and CTRL+clrKey (default CTRL+L)
  $('#req').keydown(function(e) {
    // output currently pressed keycode to console
    // console.log(e.keyCode);

    // if CTRL was pressed, log it.
    if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = true;

    // if CTRL+cliKey were pressed, clear input
    if ($('#cli').is(':checked') && ctrlDown && e.keyCode == cliKey) {
      e.preventDefault();
      if (reqmode() != 'pwd') mess($('#prompt').html() + $('#req').val() + '^' + String.fromCharCode(cliKey));
      else mess($('#prompt').html() + '^' + String.fromCharCode(cliKey));
      $('#req').val('');
    }
    // if CTRL+clrKey were pressed, clear everyhing
    else if ($('#clr').is(':checked') && ctrlDown && e.keyCode == clrKey) {
      e.preventDefault();
      clr();
    }
    // if CTRL+disKey were pressed, terminate connection
    else if ($('#dis').is(':checked') && ctrlDown && e.keyCode == disKey) {
      e.preventDefault();
      disconnect();
    }
  }).keyup(function(e) {
    if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = false;
  });
  $('#req').focus(function() {
    ctrlDown = false;
  });

  //// MESSAGE SENDING / REQUEST SENDING
  $('#msg').submit(function(e) {
    sendreq(e);
  });
  /****** END OF EVENT REGISTRATION ******/
});
/****** END OF ONLOAD FUNCTION ******/



/****** Function definitions ******/
//// Clear messages and input
function clr() {
  msgb.html('');
  $('#req').val('');
}

//// Disconnect from server
function disconnect() {
  mess('Disconnecting ' + host, con);
  sem('gray');
  connen(true);
  socket.close();
}

//// Enable / disable connection / disconnection menus and buttons
function connen(toggle) {
  $('#srvi').prop('disabled', !toggle);
  $('#port').prop('disabled', !toggle);
  $('#conn').prop('disabled', !toggle);
  $('#closecon').prop('disabled', toggle);
  // disable request sending
  if (toggle) reqmode('disable');
}

//// Print message to the main message box
function mess(msg, type = 'msg') {
  const msgm = document.getElementById('maincont');
  
  // output message
  switch (type) {
    case 'cof':
      console.info('Conn: ' + msg);
      msgb.append('\n[☇] ' + msg + '\n');
      break;
    case 'con':
      console.info('Conn: ' + msg);
      msgb.append('[☇] ' + msg + '\n');
      break;
    case 'err':
      console.error('Error: ' + msg);
      msgb.append('[!] ' + msg + '\n');
      sem('red');
      break;
    case 'warn':
      console.warn(msg);
      msgb.append('[!] ' + msg + '\n');
      break;
    case 'msg':
      console.log('New message: ' + msg);
      msgb.append(msg + '\n');
      break;
    default:
      console.error('Invalid message type');
      $('#msbox').append('Invalid message type \n');
  }
  /*
  scrollHeight: total container size.
  scrollTop: amount of scroll user has done.
  clientHeight: amount of container a user sees.
  */
  // scroll down
  msgm.scrollTop = msgm.scrollHeight;
}

//// Send message
function sendreq(e, prompt = reqmode()) {
  e.preventDefault();
  var req = $('#req').val();

  if (req == 'clear') clr();
  else if (req != '') {
    switch (prompt) {
      // command
      case 'cmd':
        mess('<span class="sent">' + pcmd + req + '</span>');
        socket.send(req);
        break;
      // password
      case 'pwd':
        mess('<span class="sent">PWD</span>');
        // socket.send(req);
        break;
      default:
        mess('Invalid mode: ' + prompt, err);
        break;
    }
    if ($('#clr').is(':checked') || reqm == 'pwd') {
      $('#req').val('');
    }
  }
}

//// Set request form mode
function reqmode(mode = '0') {
  // if the function was called without an argument, return current mode of request form
  if (mode == '0') return reqm;
  // if switching from password, clear the input first
  if (reqm == 'pwd') $('#req').val('');

  switch(mode) {
    // enable message sending
    case 'enable':
      $('#msg #req').prop('disabled', false);
      $('#msg #msgs').prop('disabled', false);
      $('#msg').css({'visibility': 'visible'});
      break;
    // disable message sending
    case 'disable':
      $('#msg #req').prop('disabled', true);
      $('#msg #msgs').prop('disabled', true);
      $('#msg').css({'visibility': 'hidden'});
      break;
    case 'cmd':
      // reqmode('enable');
      // document.getElementById('req').type = 'text';
      reqm = 'cmd';
      $('#cmd').prop('checked', true);
      $('#req').css({'opacity':'1.0'});
      $('#prompt').html(pcmd);
      break;
    /* Unused 'raw' mode
    case 'raw':
      // reqmode('enable');
      // document.getElementById('req').type = 'text';
      reqm = 'raw';
      $('#raw').prop('checked', true);
      $('#req').css({'opacity':'1.0'});
      $('#prompt').html(praw);
      break;*/
    case 'pwd':
      // reqmode('enable');
      // I have decided not to switch to 'password' input type since after you switch to it one time,
      // some browsers (Mozilla for example) consider it a password input for the rest of your relation.
      // That has some unwanted effects, such as the password hinting dialog appearing near the input box.
      // document.getElementById('req').type = 'password';
      reqm = 'pwd';
      $('#pwd').prop('checked', true);
      $('#req').css({'opacity':'0.0'});
      $('#prompt').html(ppwd);
      break;
    default:
      mess('Invalid request mode', err);
      return -1;
  }
  if (mode != 'disable') document.getElementById('req').focus();
}

//// Set semaphore/lightbulb color
function sem(color) {
  $('#bulb').css({fill: color});
}

/****** END OF FUNCTION DEFINITIONS ******/
// EOF

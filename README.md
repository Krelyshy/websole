# websole
A web console (websole) that can send commands to a websocket server and receive messages from it. This application should work out of the box, just copy the files to some folder.

Simply connect to a websocket server and send your commands! All received messages will be printed to the console.
There are 2 input types available: command and password. Command mode simply sends what you enter to the server, password mode hides the input and protects it from being snitched out. Right now the password mode does not send anything to the server, but you can change that and you can easily add your own input modes.

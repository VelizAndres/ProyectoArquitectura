const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Board, Led, Proximity, Piezo } = require('johnny-five');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

// Conexión a Johnny-Five
const board = new Board();

let led, emergencia , proximity, piezo;
board.on('ready', () => {
  led = new Led(12);
  emergencia = new Led(13);
  piezo = new Piezo(9); 

   proximity = new Proximity({
    controller: 'HCSR04',
    pin: 7
  });

    
  io.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('encender_luz', () => {
      led.on();
      io.emit('luz_estado', true);
    });

    socket.on('apagar_luz', () => {
      led.off();
      io.emit('luz_estado', false);
    });

    socket.on('encender_emergencia', () => {
      emergencia.on();
      io.emit('luz_estado', true);
    });

    socket.on('apagar_emergencia', () => {
      if(emergencia.isRunning)
      {
        emergencia.stop();
      }
      else{
        emergencia.off();
      }
      io.emit('luz_estado', false);
    });

    socket.on('bocina', () => {
      // Emitir sonido con el buzzer
      piezo.play({
        tempo: 150,
        song: [
          'E5', 'E5', 'E5', 'E5', 'E5', 'E5', 'E5', 'G5', 'C5', 'D5', 'E5',
          'F5', 'F5', 'F5', 'F5', 'F5', 'E5', 'E5', 'E5', 'E5', 'E5', 'D5',
          'D5', 'E5', 'D5', 'G5'
        ]
      });
      console.log("Bocina")
    });


    let medirDistanciaInterval;
    socket.on('medir_distancia', () => {
      medirDistanciaInterval = setInterval(() => {

        proximity.on('data', function () {
          io.emit('distancia', this.cm);
          if (this.cm < 5 && !emergencia.isRunning) {
            emergencia.blink(500);
            piezo.play({
              song: [
                'E5'],
              tempo: 300
             });
          }
        });
      }, 500); // Cambia el intervalo según sea necesario
 
    });

    socket.on('detener_medicion', () => {
      clearInterval(medirDistanciaInterval);
      proximity.off();
      emergencia.stop();
    });
  });


});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

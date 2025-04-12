<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Índice de Calidad del Aire</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }

      .encabezado {
        background-color: #ffffff;
        padding: 10px 0;
        text-align: center;
        border-bottom: 1px solid #ddd;
      }

      .encabezado img {
        width: 120%;
        max-width: 1300px;
        height: 1020;
      }

      .contenido-principal {
        max-width: 1200px;
        margin: 20px auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }

      .estado-calidad {
        text-align: center;
        margin-bottom: 20px;
      }

      .estado-calidad h1 {
        font-size: 24px;
        margin: 0;
      }

      .estado-calidad p {
        font-size: 18px;
        margin: 5px 0;
      }

      .indicadores {
        display: flex;
        justify-content: space-around;
        margin-bottom: 20px;
      }

      .indicador {
        text-align: center;
      }

      .indicador .valor {
        font-size: 18px;
        color: #fff;
        background-color: #00b300;
        border-radius: 50%;
        width: 100px;
        height: 100px;
        line-height: 100px;
        margin: 0 auto 10px;
        font-weight: bold;
        background: linear-gradient(145deg, #00b300, #008000);
        box-shadow: 0 4px 15px rgba(0,179,0,0.2);
        transition: transform 0.3s ease;
      }

      .indicador .valor .unidad {
        font-size: 14px;
        margin-left: 5px;
      }

      .grafica {
        margin: 30px auto;
        padding: 20px;
        background: #ffffff;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        max-width: 1000px;
        height: 500px;
        position: relative;
        transition: all 0.3s ease;
      }

      #grafica-calidad-aire {
        width: 100% !important;
        height: 450px !important;
        padding: 10px;
      }

      .chart-legend {
        margin-top: 20px;
        font-size: 14px;
        display: flex;
        justify-content: center;
        gap: 30px;
        padding: 10px;
        background: rgba(255,255,255,0.9);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }

      .chart-legend span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .chart-legend i {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .bueno { color: #4CAF50; }
      .moderado { color: #FFC107; }
      .dañino { color: #FF5722; }
      .peligroso { color: #F44336; }

      .pie-pagina {
        text-align: center;
        padding: 20px;
        background-color: #fff;
        border-top: 1px solid #ddd;
      }

      .valor.animated {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    </style>
  </head>

  <body>
    <div class="encabezado">
      <img src="/api/placeholder/1300/1020" alt="encabezado img"/>
    </div>
    
    <div class="contenido-principal">
      <div class="estado-calidad">
        <h1>Hoy, <span id="hora-actual"></span> La calidad del aire es: 
          <span class="bueno" id="estado-calidad-aire">bueno</span>
        </h1>
        <p id="descripcion-calidad">Sin impactos para la salud en este rango. Se puede realizar cualquier actividad al aire libre</p>
      </div>

      <div class="indicadores">
        <div class="indicador">
          <div class="valor animated" id="co2">0 
            <span class="unidad">ppm</span>
          </div>
          <p>Dióxido de Carbono (CO2)</p>
        </div>
        <div class="indicador">
          <div class="valor animated" id="tvoc">0 
            <span class="unidad">ppb</span>
          </div>
          <p>Totales Compuestos Orgánicos Volátiles (TVOC)</p>
        </div>
      </div>

      <div class="grafica">
        <canvas id="grafica-calidad-aire"></canvas>
      </div>
    </div>

    <div class="pie-pagina">
      <p>Índice de Calidad Aire (ICA)<br>MEDICIÓN DE LA CONTAMINACIÓN DEL AIRE EN CUENCA</p>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      // Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyDMqkF_5MUbh-SdF0Gnw2Bx4-3-dPhdmkc",
        authDomain: "esp32-tesiscalidadaire.firebaseapp.com",
        databaseURL: "https://esp32-tesiscalidadaire-default-rtdb.firebaseio.com",
        projectId: "esp32-tesiscalidadaire",
        storageBucket: "esp32-tesiscalidadaire.appspot.com",
        messagingSenderId: "355885440104",
        appId: "1:355885440104:web:849875a8762a9576466fdd",
        measurementId: "G-1X9LX1CNF3"
      };

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      const database = firebase.database();
      const datosRef = database.ref('/');

      let chart = null;
      const maxDataPoints = 15;
      let co2Data = [];
      let tvocData = [];
      let timeLabels = [];

      function initChart() {
        const ctx = document.getElementById('grafica-calidad-aire').getContext('2d');
        
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [
              {
                label: 'CO2 (ppm)',
                data: co2Data,
                borderColor: '#FFA500',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'TVOC (ppb)',
                data: tvocData,
                borderColor: '#0000FF',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: {
                  display: true,
                  color: 'rgba(0,0,0,0.05)'
                },
                title: {
                  display: true,
                  text: 'Tiempo',
                  font: { size: 14, weight: 'bold' }
                }
              },
              y: {
                beginAtZero: false,
                min: 400,
                max: 2000,
                grid: {
                  color: 'rgba(0,0,0,0.05)'
                },
                title: {
                  display: true,
                  text: 'Valores',
                  font: { size: 14, weight: 'bold' }
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  font: { size: 14, weight: 'bold' }
                }
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            },
            animation: {
              duration: 1000,
              easing: 'easeInOutQuart'
            }
          }
        });
      }

      function updateQualityStatus(co2Level) {
        const statusElement = document.getElementById('estado-calidad-aire');
        const descriptionElement = document.getElementById('descripcion-calidad');
        
        let status = 'bueno';
        let description = 'Sin impactos para la salud en este rango. Se puede realizar cualquier actividad al aire libre';
        
        if (co2Level > 1900) {
          status = 'peligroso';
          description = 'Evitar actividades al aire libre';
        } else if (co2Level > 800) {
          status = 'dañino';
          description = 'Grupos sensibles deben evitar exposición';
        } else if (co2Level > 500) {
          status = 'moderado';
          description = 'Considerar reducir actividades intensas';
        }
        
        statusElement.className = status;
        statusElement.textContent = status;
        descriptionElement.textContent = description;
      }

      function updateData(snapshot) {
        const data = snapshot.val();
        if (!data) return;

        const co2Value = parseFloat(data.CO2) || 0;
        const tvocValue = parseFloat(data.tTVOC) || 0;
        const currentTime = moment().format('HH:mm');

        // Update indicators
        document.getElementById('co2').innerHTML = `${co2Value} <span class="unidad">ppm</span>`;
        document.getElementById('tvoc').innerHTML = `${tvocValue} <span class="unidad">ppb</span>`;

        // Update arrays
        timeLabels.push(currentTime);
        co2Data.push(co2Value);
        tvocData.push(tvocValue);

        // Keep only last maxDataPoints
        if (timeLabels.length > maxDataPoints) {
          timeLabels.shift();
          co2Data.shift();
          tvocData.shift();
        }

        // Update chart
        if (chart) {
          chart.data.labels = timeLabels;
          chart.data.datasets[0].data = co2Data;
          chart.data.datasets[1].data = tvocData;
          chart.update('none');
        }

        updateQualityStatus(co2Value);
      }

      function updateTime() {
        document.getElementById('hora-actual').textContent = moment().format('HH:mm');
      }

      // Initialize
      document.addEventListener('DOMContentLoaded', () => {
        initChart();
        updateTime();
        setInterval(updateTime, 60000);
        datosRef.on('value', updateData);
      });
    </script>
  </body>
</html>
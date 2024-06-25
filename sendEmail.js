const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(bodyParser.json());

// Ruta para manejar la solicitud de la cita
app.post('/citareg', (req, res) => {
  const { subject, email, description, dynamicData } = req.body;

  console.log('Datos recibidos:', { subject, email, description, dynamicData });

  const msg = {
    to: email,
    from: 'siosaenz15@gmail.com',
    subject: subject,
    templateId: 'd-2c5e6e87427341079390f15907de8410', // Reemplaza con tu ID de template de SendGrid
    dynamic_template_data: dynamicData
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Correo enviado exitosamente');
      res.status(200).send('Correo enviado exitosamente');
    })
    .catch((error) => {
      console.error('Error al enviar el correo:', error.response ? error.response.body : error);
      res.status(500).send('Error al enviar el correo');
    });
});

// Ruta para manejar la solicitud de contacto
app.post('/contact', (req, res) => {
  const { subject, email, description, dynamicData } = req.body;

  console.log('Datos recibidos:', { subject, email, description, dynamicData });

  const msg = {
    to: 'siosaenz15@gmail.com', // Correo fijo
    from: email, // Correo del remitente del formulario
    subject: subject,
    templateId: 'd-c34c015b526949b2b86f0cfd3da91863', // Reemplaza con tu ID de template de SendGrid
    dynamic_template_data: dynamicData
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log('Correo enviado exitosamente');
      res.status(200).send('Correo enviado exitosamente');
    })
    .catch((error) => {
      console.error('Error al enviar el correo:', error.response ? error.response.body : error);
      res.status(500).send('Error al enviar el correo');
    });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en http://localhost:${port}`);
});

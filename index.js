require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
var admin = require("firebase-admin");

var serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://amor-incondicional-fec3e-default-rtdb.firebaseio.com"
});

const db = admin.database();
const app = express();


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false}));


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// obtener todas las citas
app.post('/citareg', (req, res) => {
  const { destinatario, nombre, telefono, correo, fechaCita, nombreAn, genero, servicios, motivo } = req.body;

  if (!destinatario || !nombre || !telefono || !correo || !fechaCita || !nombreAn || !genero || !servicios || !motivo) {
    console.error('Datos incompletos para enviar el correo');
    return res.status(400).send('Datos incompletos para enviar el correo');
  }
  
  console.log('Datos recibidos para el correo:', { destinatario, nombre, telefono, correo, fechaCita, nombreAn, genero, servicios, motivo });

  const msg = {
    to: destinatario,
    from: 'siosaenz15@gmail.com',
    templateId: 'd-2c5e6e87427341079390f15907de8410',
    dynamic_template_data: {
      nombre,
      telefono,
      correo,
      fechaCita,
      nombreAn,
      genero,
      servicios: servicios.join(', '),
      motivo
    }
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

// obtener todas las citas
app.get('/citas', async (req, res) => {
  try {
    const citasRef = db.ref('citas');
    const snapshot = await citasRef.once('value');
    const citas = snapshot.val();
    res.status(200).json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// obtener citas de un usuario
app.get('/citas/usuario', async (req, res) => {
try {
  const { nombreIn } = req.query;
  console.log('Nombre del usuario recibido:', nombreIn);
  if (!nombreIn) {
    return res.status(400).json({ error: 'El nombre del usuario es obligatorio' });
  }
  const citasRef = db.ref('citas');
  const snapshot = await citasRef.orderByChild('nombreIn').equalTo(nombreIn).once('value');
  const citas = snapshot.val();
  console.log('Citas encontradas:', citas);
  if (citas) {
    res.status(200).json(citas);
  } else {
    res.status(404).json({ message: 'No se encontraron citas para el usuario' });
  }
} catch (error) {
  console.error('Error al obtener citas por usuario:', error);
  res.status(500).json({ error: error.message });
}
});

// obtener citas de un telefono
app.get('/citas/telefono', async (req, res) => {
  try {
    const { telefonoIn } = req.query;
    console.log('Telefono recibido:', telefonoIn);
    if (!telefonoIn) {
      return res.status(400).json({ error: 'El telefono es obligatorio' });
    }
    const citasRef = db.ref('citas');
    const snapshot = await citasRef.orderByChild('telefonoIn').equalTo(telefonoIn).once('value');
    const citas = snapshot.val();
    console.log('Citas encontradas:', citas);
    if (citas) {
      res.status(200).json(citas);
    } else {
      res.status(404).json({ message: 'No se encontraron citas para el usuario' });
    }
  } catch (error) {
    console.error('Error al obtener citas por usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

  // obtener citas entre fechas
  app.get('/citas/rango', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const citasRef = db.ref('citas');
      const snapshot = await citasRef.orderByChild('fechaCita').startAt(startDate).endAt(endDate).once('value');
      const citas = snapshot.val();
      res.status(200).json(citas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // num de citas por dia
    app.get('/citas/countPorDia', async (req, res) => {
        try {
        const citasRef = db.ref('citas');
        const snapshot = await citasRef.once('value');
        const citas = snapshot.val();
        
        // calcular conteo por día
        const countPorDia = {};
        if (citas) {
            Object.values(citas).forEach(cita => {
            const fechaCita = cita.fechaCita.split('T')[0];
            if (countPorDia[fechaCita]) {
                countPorDia[fechaCita]++;
            } else {
                countPorDia[fechaCita] = 1;
            }
            });
        }
        
        res.status(200).json(countPorDia);
        } catch (error) {
        res.status(500).json({ error: error.message });
        }
    });
  
  // crear una cita
  app.post('/citas', async (req, res) => {
    try {
      const { cita, key } = req.body;
      const citasRef = db.ref('citas');
      await citasRef.child(key).set(cita);
      res.status(201).json({ message: 'Cita creada con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // actualizar una cita
  app.put('/citas/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const value = req.body;
      const citasRef = db.ref('citas');
      await citasRef.child(key).update(value);
      res.status(200).json({ message: 'Cita actualizada con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // eliminar una cita
  app.delete('/citas/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const citasRef = db.ref('citas');
      await citasRef.child(key).remove();
      res.status(200).json({ message: 'Cita eliminada con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // eliminar todas las citas
  app.delete('/citas', async (req, res) => {
    try {
      const citasRef = db.ref('citas');
      await citasRef.remove();
      res.status(200).json({ message: 'Todas las citas eliminadas con éxito' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // verificar si una cita existe en una cierta fecha y hora
  app.get('/citas/existe/:fecha', async (req, res) => {
    try {
      const fecha = req.params.fecha;
      const citasRef = db.ref('citas');
      const snapshot = await citasRef.orderByChild('fechaCita').equalTo(fecha).once('value');
      const citas = snapshot.val();
      const existe = citas !== null;
      res.status(200).json({ existe });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
//correo registrar cita
app.post('/citareg', (req, res) => {
  const { destinatario, nombre, telefono, correo, fechaCita, nombreAn, genero, servicios, motivo } = req.body;

  if (!destinatario || !nombre || !telefono || !correo || !fechaCita || !nombreAn || !genero || !servicios || !motivo) {
    return res.status(400).send('Datos incompletos para enviar el correo');
  }
  console.log('Datos recibidos:', { nombre, telefono, correo, fechaCita, nombreAn, genero, servicios, motivo });

  const msg = {
    to: destinatario,
    from: 'siosaenz15@gmail.com',
    templateId: 'd-2c5e6e87427341079390f15907de8410', 
    dynamic_template_data: {
      nombre: nombre,
      telefono: telefono,
      correo: correo,
      fechaCita: fechaCita,
      nombreAn: nombreAn,
      genero: genero,
      servicios: servicios.join(', '),
      motivo: motivo
    }
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

//correo contacto
app.post('/contact', (req, res) => {
  const { subject, email, description, dynamicData } = req.body;

  console.log('Datos recibidos:', { subject, email, description, dynamicData  });

  const msg = {
    to: 'siosaenz15@gmail.com',
    from: email,
    subject: subject,
    templateId: 'd-c34c015b526949b2b86f0cfd3da91863', 
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
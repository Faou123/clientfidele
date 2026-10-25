
'use strict';

const addAppointmentButton = document.querySelector('#addAppointment');
const prepareMessageButton = document.querySelector('#prepareMessage');
const feedback = document.querySelector('#feedback');

addAppointmentButton.addEventListener('click', () => {
  alert('Le formulaire de création de rendez-vous sera ajouté à la prochaine étape.');
});

prepareMessageButton.addEventListener('click', () => {
  const message = `Bonjour Amélie,

Nous espérons que vous allez bien ! Cela fait quelque temps que nous ne vous avons pas vue au salon. N'hésitez pas à nous contacter pour votre prochain rendez-vous.

À bientôt !`;

  feedback.textContent = message;
  feedback.style.whiteSpace = 'pre-line';

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(message)
      .then(() => {
        feedback.textContent = `${message}\n\nMessage copié : vous pouvez le coller dans votre outil de messagerie.`;
      })
      .catch(() => {
        feedback.textContent = message;
      });
  }
});

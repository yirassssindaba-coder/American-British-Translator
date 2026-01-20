'use strict';

const Translator = require('../components/translator.js');

module.exports = function (app) {
  app.route('/api/translate').post((req, res) => {
    const { text, locale } = req.body || {};

    // Missing required fields
    if (text === undefined || locale === undefined) {
      return res.json({ error: 'Required field(s) missing' });
    }

    // Empty text
    if (typeof text === 'string' && text.length === 0) {
      return res.json({ error: 'No text to translate' });
    }

    // Invalid locale
    if (locale !== 'american-to-british' && locale !== 'british-to-american') {
      return res.json({ error: 'Invalid value for locale field' });
    }

    const translator = new Translator();
    const translation = translator.translate(text, locale);

    return res.json({
      text,
      translation,
    });
  });
};

const fs = require("fs");
const path = require("path");

var tinyi18n = {
	_data: null,
	_translate_elements: null,
	_current_language: 'en',

	getLang: function(new_language) {
		return tinyi18n._current_language
	},

	setLang: function(language) {
		for (let i = 0; i < tinyi18n._translate_elements.length; i++) {
			const key = tinyi18n._translate_elements[i].getAttribute('data-translatekey');
			const attribute = tinyi18n._translate_elements[i].getAttribute('data-translateattribute');

			try {
				var translated_text = tinyi18n._data.translations[key][language]
			}

			catch (error) {
				console.error('tinyi18n: Key', "'" + key + "'", 'is not in JSON file')
			}

			if (attribute) {
				tinyi18n._translate_elements[i].setAttribute(attribute, translated_text)
			}

			else {
				tinyi18n._translate_elements[i].innerHTML = translated_text
			}
		}

		document.documentElement.lang = language
		tinyi18n._current_language = language
	},

	loadTranslations: function() {
		let filePath = path.join(__dirname,"/translations.json");
		tinyi18n._data = JSON.parse(fs.readFileSync(filePath),"utf8");
		tinyi18n._translate_elements = document.querySelectorAll('[data-translatekey]') // Get all elements with a translate key
		tinyi18n._current_language = tinyi18n._data.default_language || 'en'
		tinyi18n.setLang(tinyi18n._current_language);
	}
}

// MARK: i18n — Vietnamese/English language support
// Purpose: Provide centralized bilingual strings for nhonly UI
// Vietnamese-English support as core feature, not afterthought

import { writable } from 'svelte/store';

export type Language = 'vi' | 'en';

const strings: Record<Language, Record<string, string>> = {
	vi: {
		// Main page
		tell_story: 'Kể chuyện của bạn',

		// Recording UI
		saved_as_you_go: 'Tự động lưu',
		stop_recording: 'Dừng lại',

		// Archive UI
		story_title: 'Tiêu đề chuyện',
		archive_button: 'Lưu trữ',

		// Confirmation
		story_archived: 'Chuyện của bạn đã được lưu trữ'
	},
	en: {
		// Main page
		tell_story: 'Tell your story',

		// Recording UI
		saved_as_you_go: 'Saved as you go',
		stop_recording: 'Stop',

		// Archive UI
		story_title: 'Story title',
		archive_button: 'Archive',

		// Confirmation
		story_archived: 'Story archived'
	}
};

// Reactive language store
export const currentLanguage = writable<Language>('en');

export function setLanguage(lang: Language): void {
	if (lang === 'vi' || lang === 'en') {
		currentLanguage.set(lang);
	}
}

// Getter function: contract for UI text access
// Success: key exists in current language, returns string
// Failure: returns fallback to English if key missing
export function t(key: string): string {
	let lang: Language = 'en';
	currentLanguage.subscribe((l) => {
		lang = l;
	})();

	if (strings[lang][key as keyof typeof strings[Language]]) {
		return strings[lang][key as keyof typeof strings[Language]];
	}
	// Fallback to English
	if (strings['en'][key as keyof typeof strings['en']]) {
		return strings['en'][key as keyof typeof strings['en']];
	}
	return key; // Last resort: return key itself
}

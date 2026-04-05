// MARK: i18n — Vietnamese/English language support
// Purpose: Provide centralized bilingual strings for nhonly UI
// Vietnamese-English support as core feature, not afterthought

import { writable } from 'svelte/store';

export type Language = 'vi' | 'en';

const strings: Record<Language, Record<string, string>> = {
	vi: {
		// App header
		app_title: 'Nhơn Lý — Kể Chuyện',

		// Main page
		tell_story: 'Kể chuyện của bạn',

		// Recording UI
		recording: 'Đang ghi âm',
		pause: 'Tạm dừng',
		stop_recording: 'Dừng lại',
		paused: 'Đã tạm dừng',
		resume: 'Tiếp tục',
		record_again: 'Ghi lại',
		preview: 'Xem trước',
		saving_story: 'Đang lưu chuyện...',
		save_confirmation: 'Chuyện của bạn đã được lưu trữ',
		saved_as_you_go: 'Tự động lưu',

		// Archive UI
		story_title: 'Tiêu đề chuyện',
		enter_title: 'Nhập tiêu đề',
		archive_button: 'Lưu trữ',
		please_enter_title: 'Vui lòng nhập tiêu đề',
		story_archived: 'Chuyện của bạn đã được lưu trữ',

		// Error handling
		error_occurred: 'Có lỗi xảy ra',
		try_again: 'Thử lại',
		microphone_required: 'Cần quyền truy cập microphone',
		browser_old: 'Trình duyệt không hỗ trợ ghi âm',
		storage_full: 'Bộ nhớ đầy',
		cancel: 'Hủy'
	},
	en: {
		// App header
		app_title: 'Nhơn Lý — Tell Your Story',

		// Main page
		tell_story: 'Tell your story',

		// Recording UI
		recording: 'Recording',
		pause: 'Pause',
		stop_recording: 'Stop',
		paused: 'Paused',
		resume: 'Resume',
		record_again: 'Record Again',
		preview: 'Preview',
		saving_story: 'Saving your story...',
		save_confirmation: 'Your story has been saved',
		saved_as_you_go: 'Saved as you go',

		// Archive UI
		story_title: 'Story title',
		enter_title: 'Enter story title',
		archive_button: 'Archive',
		please_enter_title: 'Please enter a title',
		story_archived: 'Story archived',

		// Error handling
		error_occurred: 'An error occurred',
		try_again: 'Try again',
		microphone_required: 'Microphone access is required',
		browser_old: 'Your browser does not support recording',
		storage_full: 'Storage is full',
		cancel: 'Cancel'
	}
};

// Reactive language store
export const currentLanguage = writable<Language>('en');

/**
 * Initialize language based on system preference or stored preference.
 * Called on app mount in +layout.svelte
 */
export function initLanguage(): void {
	// Check localStorage for saved preference
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('nhonly_language');
		if (saved === 'vi' || saved === 'en') {
			currentLanguage.set(saved);
			return;
		}
	}

	// Check system language preference
	if (typeof navigator !== 'undefined') {
		const lang = navigator.language.substring(0, 2);
		if (lang === 'vi') {
			currentLanguage.set('vi');
			return;
		}
	}

	// Default to English
	currentLanguage.set('en');
}

export function setLanguage(lang: Language): void {
	if (lang === 'vi' || lang === 'en') {
		currentLanguage.set(lang);
		// Save preference to localStorage
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('nhonly_language', lang);
		}
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

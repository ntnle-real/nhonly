// MARK: i18n — Vietnamese/English language support
// Purpose: Provide centralized bilingual strings for nhonly UI
// Vietnamese-English support as core feature, not afterthought

import { writable, derived } from 'svelte/store';

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
		cancel: 'Hủy',

		// Landing page
		landing_headline: 'Giữ gìn ký ức quê hương',
		landing_sub: 'Kể câu chuyện của bạn cho thế hệ mai sau',
		landing_cta: 'Bắt đầu khi bạn sẵn sàng',
		saved_log: 'Đã lưu vào kho lưu trữ',

		// Archive UI — Phase 2
		home_nav: 'Trang chủ',
		archive_nav: 'Lưu trữ',
		archive_empty_headline: 'Kho lưu trữ của bạn còn trống',
		archive_empty_body: 'Các chuyện bạn ghi âm sẽ xuất hiện ở đây. Hãy bắt đầu bằng cách ghi âm chuyện đầu tiên.',
		archive_empty_cta: 'Ghi âm chuyện đầu tiên',
		archive_header: 'Các chuyện của bạn',
		archive_count_singular: '{count} chuyện',
		archive_count_plural: '{count} chuyện',
		playback_close: '✕',
		playback_replay: '↻',
		delete_heading: 'Xóa chuyện này?',
		delete_body: 'Chuyện này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.',
		delete_confirm: 'Xóa',
		delete_cancel: 'Giữ lại',
		delete_success: 'Chuyện đã bị xóa',
		playback_error_heading: 'Không thể phát chuyện',
		playback_error_body: 'Tệp âm thanh có thể bị hỏng. Hãy thử một chuyện khác hoặc ghi âm lại.',
		playback_error_cta: 'Quay lại kho lưu trữ',

		// Diorama — Phase 3
		diorama_label: 'Trải nghiệm',
		diorama_type_badge: 'Trải nghiệm nhập vai',
		diorama_duration_badge_vi: '~{seconds} giây',
		diorama_tap_to_begin: 'Chạm để bắt đầu',
		diorama_exit: '>>',
		diorama_exit_label: 'Quay lại lưu trữ',
		diorama_leave_confirm: 'Rời khỏi ký ức này?',
		diorama_leave_yes: 'Có, quay lại',
		diorama_leave_no: 'Tiếp tục',
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
		cancel: 'Cancel',

		// Landing page
		landing_headline: 'Preserving the memories of home',
		landing_sub: 'Tell your story for generations to come',
		landing_cta: 'Begin when you are ready',
		saved_log: 'Added to the archive',

		// Archive UI — Phase 2
		home_nav: 'Home',
		archive_nav: 'Archive',
		archive_empty_headline: 'Your archive is empty',
		archive_empty_body: 'Stories you record will appear here. Begin by recording your first story.',
		archive_empty_cta: 'Record your first story',
		archive_header: 'Your stories',
		archive_count_singular: '{count} story',
		archive_count_plural: '{count} stories',
		playback_close: '✕',
		playback_replay: '↻',
		delete_heading: 'Delete this story?',
		delete_body: 'This story will be permanently deleted. This action cannot be undone.',
		delete_confirm: 'Delete',
		delete_cancel: 'Keep',
		delete_success: 'Story deleted',
		playback_error_heading: 'Could not play story',
		playback_error_body: 'The audio file may be corrupted. Try another story or re-record.',
		playback_error_cta: 'Return to archive',

		// Diorama — Phase 3
		diorama_label: 'Experience',
		diorama_type_badge: 'Immersive experience',
		diorama_duration_badge_vi: '~{seconds} sec',
		diorama_tap_to_begin: 'Tap to begin',
		diorama_exit: '>>',
		diorama_exit_label: 'Return to archive',
		diorama_leave_confirm: 'Leave this memory?',
		diorama_leave_yes: 'Yes, return',
		diorama_leave_no: 'Keep reading',
	}
};

// Reactive language store
export const currentLanguage = writable<Language>('en');

// Derived store that provides current language strings
export const currentStrings = derived(currentLanguage, ($lang) => strings[$lang]);

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

// Get current language synchronously (for non-reactive contexts)
let currentLang: Language = 'en';
currentLanguage.subscribe((lang) => {
	currentLang = lang;
});

/**
 * Synchronous translation — for component logic (event handlers, etc.)
 */
export function t(key: string): string {
	return translate(currentLang, key);
}

/**
 * Reactive translation — pass $currentLanguage to make templates re-render on language change.
 * Usage in Svelte 5 templates: {translate($currentLanguage, 'key')}
 */
export function translate(lang: Language, key: string): string {
	if (strings[lang][key as keyof typeof strings[Language]]) {
		return strings[lang][key as keyof typeof strings[Language]];
	}
	// Fallback to English
	if (strings['en'][key as keyof typeof strings['en']]) {
		return strings['en'][key as keyof typeof strings['en']];
	}
	return key;
}

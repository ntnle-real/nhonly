<script lang="ts">
	import { currentLanguage, translate, setLanguage } from '$lib/i18n';

	function toggleLanguage(): void {
		const newLang = $currentLanguage === 'en' ? 'vi' : 'en';
		setLanguage(newLang);
	}
</script>

<svelte:head>
	<title>{translate($currentLanguage, 'app_title')}</title>
</svelte:head>

<div class="hero">
	<!-- Language toggle -->
	<button class="lang-toggle" onclick={toggleLanguage}>
		{$currentLanguage === 'en' ? 'VI' : 'EN'}
	</button>

	<!-- Center content -->
	<div class="content">
		<p class="village-name">Nhơn Lý</p>
		<h1 class="headline">{translate($currentLanguage, 'landing_headline')}</h1>
		<p class="sub">{translate($currentLanguage, 'landing_sub')}</p>
		<a href="/record" class="cta-btn">
			{translate($currentLanguage, 'landing_cta')}
		</a>
	</div>

	<!-- Photo credit placeholder -->
	<p class="photo-credit">Photo coming soon</p>
</div>

<style>
	:global(body) {
		font-family: 'Be Vietnam Pro', system-ui, -apple-system, sans-serif;
	}

	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;

		/* Placeholder: coastal Vietnam evoked through color */
		background: linear-gradient(160deg, #0d3b3b 0%, #1b6b7b 45%, #c8974a 100%);
	}

	/* Dark overlay to ensure text is always readable */
	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.38);
	}

	.lang-toggle {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 10;
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.4);
		color: #fff;
		padding: 0.4rem 0.9rem;
		border-radius: 4px;
		font-family: inherit;
		font-weight: 600;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		backdrop-filter: blur(4px);
		transition: background 0.2s;
	}

	.lang-toggle:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.content {
		position: relative;
		z-index: 1;
		text-align: center;
		color: #fff;
		padding: 2rem;
		max-width: 600px;
	}

	.village-name {
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #e2d7b0;
		margin: 0 0 1.25rem 0;
		opacity: 0.9;
	}

	.headline {
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 700;
		line-height: 1.2;
		margin: 0 0 1rem 0;
		color: #fff;
	}

	.sub {
		font-size: clamp(1rem, 2.5vw, 1.2rem);
		font-weight: 300;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.85);
		margin: 0 0 2.5rem 0;
	}

	.cta-btn {
		display: inline-block;
		background: #FF773E;
		color: #fff;
		text-decoration: none;
		font-size: 1.1rem;
		font-weight: 600;
		padding: 1rem 2.5rem;
		border-radius: 6px;
		min-height: 48px;
		line-height: 1.3;
		transition: background 0.2s, transform 0.15s;
	}

	.cta-btn:hover {
		background: #e8642a;
		transform: translateY(-2px);
	}

	.cta-btn:active {
		transform: translateY(0);
	}

	.photo-credit {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		z-index: 1;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		margin: 0;
	}

	@media (max-width: 480px) {
		.content {
			padding: 1.5rem;
		}

		.cta-btn {
			width: 100%;
			text-align: center;
		}
	}
</style>

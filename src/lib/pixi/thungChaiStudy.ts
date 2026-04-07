import { Application, BlurFilter, Container, Graphics } from 'pixi.js';

export interface ThungChaiStudyHandle {
	app: Application;
	destroy: () => void;
}

interface StudyLayout {
	width: number;
	height: number;
	horizonY: number;
	boatX: number;
	boatY: number;
}

function getLayout(host: HTMLElement): StudyLayout {
	const width = Math.max(host.clientWidth, 1);
	const height = Math.max(host.clientHeight, 1);
	return {
		width,
		height,
		horizonY: height * 0.62,
		boatX: width * 0.56,
		boatY: height * 0.7
	};
}

function drawWaterField(background: Graphics, glow: Graphics, reflection: Graphics, layout: StudyLayout): void {
	background.clear();
	background
		.rect(0, 0, layout.width, layout.height)
		.fill({ color: 0x081b1d })
		.rect(0, layout.horizonY - 2, layout.width, 4)
		.fill({ color: 0xd5a458, alpha: 0.18 })
		.rect(0, layout.horizonY, layout.width, layout.height - layout.horizonY)
		.fill({ color: 0x102c2b, alpha: 0.56 });

	glow.clear();
	glow
		.ellipse(layout.width * 0.5, layout.horizonY + layout.height * 0.08, layout.width * 0.34, layout.height * 0.12)
		.fill({ color: 0xd5a458, alpha: 0.16 });

	reflection.clear();
	reflection
		.roundRect(layout.width * 0.47, layout.horizonY + 8, layout.width * 0.06, layout.height * 0.2, 24)
		.fill({ color: 0xe5bf77, alpha: 0.14 })
		.roundRect(layout.width * 0.54, layout.horizonY + 18, layout.width * 0.035, layout.height * 0.16, 18)
		.fill({ color: 0xdca45d, alpha: 0.12 });
}

function drawBoat(hull: Graphics, shadow: Graphics, layout: StudyLayout): void {
	hull.clear();
	hull
		.moveTo(-58, 14)
		.quadraticCurveTo(-46, -24, 0, -30)
		.quadraticCurveTo(46, -24, 58, 14)
		.quadraticCurveTo(12, 4, -58, 14)
		.fill({ color: 0xf2dbb0, alpha: 0.16 })
		.stroke({ width: 1.2, color: 0xf6e6bf, alpha: 0.2 });

	shadow.clear();
	shadow
		.ellipse(0, 24, 62, 12)
		.fill({ color: 0x000000, alpha: 0.14 });

	hull.position.set(layout.boatX, layout.boatY);
	shadow.position.set(layout.boatX, layout.boatY + 12);
}

export async function createThungChaiStudy(host: HTMLElement): Promise<ThungChaiStudyHandle> {
	const app = new Application();
	await app.init({
		resizeTo: host,
		backgroundAlpha: 0,
		antialias: true,
		autoDensity: true
	});

	host.appendChild(app.canvas);

	const root = new Container();
	const background = new Graphics();
	const glow = new Graphics();
	const reflection = new Graphics();
	const shadow = new Graphics();
	const hull = new Graphics();

	glow.filters = [new BlurFilter({ strength: 18, quality: 3, kernelSize: 9 })];

	root.addChild(background, glow, reflection, shadow, hull);
	app.stage.addChild(root);

	let layout = getLayout(host);

	const redraw = (): void => {
		layout = getLayout(host);
		drawWaterField(background, glow, reflection, layout);
		drawBoat(hull, shadow, layout);
	};

	redraw();

	const resizeObserver = new ResizeObserver(() => {
		redraw();
	});
	resizeObserver.observe(host);

	app.ticker.add(() => {
		const t = performance.now() / 1000;
		hull.rotation = Math.sin(t * 0.9) * 0.028;
		shadow.rotation = hull.rotation * 0.45;
		hull.y = layout.boatY + Math.sin(t * 1.15) * 2.6;
		shadow.y = layout.boatY + 12 + Math.sin(t * 1.15) * 1.2;
		reflection.alpha = 0.1 + (Math.sin(t * 1.4) + 1) * 0.035;
		glow.alpha = 0.72 + Math.sin(t * 0.45) * 0.04;
	});

	return {
		app,
		destroy: () => {
			resizeObserver.disconnect();
			app.destroy({ removeView: true }, { children: true });
		}
	};
}

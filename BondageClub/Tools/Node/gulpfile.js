import path from "path";
import log from "fancy-log";
import c from "ansi-colors";
import gulp from "gulp";
import gulpCount from "gulp-count";
import gulpIf from "gulp-if";
import gulpSize from "gulp-size";
import filter from "gulp-filter";
import imagemin, { optipng, svgo } from "gulp-imagemin";
import jpegtran from "imagemin-jpegtran";
import cache from "gulp-cache";
import through from "through2";
import { rimraf } from "rimraf";
import { table } from "table";
import prettyBytes from "pretty-bytes";
import StreamCounter from "stream-counter";

const BASE_DIR = path.resolve(import.meta.dirname, "..", "..");
const CACHE_DIR = path.resolve(import.meta.dirname, ".imagemin-cache");
const BATCH_SIZE = 500;
const SIZE_CONFIG = { showTotal: false };

export const assetMinify = gulp.series(logIntro, analyzeBefore, generateBatches, minifyBatches, analyzeAfter, report);

export async function clean() {
	await rimraf(CACHE_DIR);
}

let files = [];
let batches = [];
const supportedSizes = {
	before: {
		png: gulpSize(SIZE_CONFIG),
		jpg: gulpSize(SIZE_CONFIG),
		svg: gulpSize(SIZE_CONFIG),
		total: gulpSize(SIZE_CONFIG),
	},
	after: {
		png: gulpSize(SIZE_CONFIG),
		jpg: gulpSize(SIZE_CONFIG),
		svg: gulpSize(SIZE_CONFIG),
		total: gulpSize(SIZE_CONFIG),
	},
};

async function logIntro() {
	log(c.cyan("Starting image minification. Please be patient, this can take a long time..."));
}

function analyze(beforeOrAfter, sizePlugins, record = false) {
	if (record) {
		files = [];
	}
	return sourceFiles()
		.pipe(gulpIf(record, through.obj((file, env, cb) => {
			files.push(file.path);
			cb(null, file);
		})))
		.pipe(gulpLog(
			"",
			c.cyan(`File counts ${beforeOrAfter} minification`),
			"--------------------------------",
		))
		.pipe(gulpIf(/\.png$/, count("PNG:\t<%= files %> found")))
		.pipe(gulpIf(/\.png$/, sizePlugins.png))
		.pipe(gulpIf(/\.jpe?g$/, count("JPG:\t<%= files %> found")))
		.pipe(gulpIf(/\.jpe?g$/, sizePlugins.jpg))
		.pipe(gulpIf(/\.svg$/, count("SVG:\t<%= files %> found")))
		.pipe(gulpIf(/\.svg$/, sizePlugins.svg))
		.pipe(gulpLog("--------------------------------"))
		.pipe(count("Found <%= files %> in total for minification"))
		.pipe(sizePlugins.total)
		.pipe(gulpLog(
			"",
			c.cyan(`File sizes ${beforeOrAfter} minification`),
			"--------------------------------",
		))
		.pipe(gulpLog(
			() => `PNG: \t${c.magenta(sizePlugins.png.prettySize)}`,
			() => `JPG: \t${c.magenta(sizePlugins.jpg.prettySize)}`,
			() => `SVG: \t${c.magenta(sizePlugins.svg.prettySize)}`,
			"--------------------------------",
			() => `Total: \t${c.magenta(sizePlugins.total.prettySize)}`,
			"",
		));
}

function analyzeBefore() {
	return analyze("before", supportedSizes.before, true);
}

function analyzeAfter() {
	return analyze("after", supportedSizes.after);
}

function report(cb) {
	const { before, after } = supportedSizes;
	log("");
	log(c.cyan("Image minification report"));
	log("--------------------------------");
	const tableData = [
		reportHeader(),
		reportRow("PNG", before.png, after.png),
		reportRow("JPG", before.jpg, after.jpg),
		reportRow("SVG", before.svg, after.svg),
		reportRow("Total", before.total, after.total),
	];
	const tableLines = table(tableData).split("\n");
	for (const line of tableLines) {
		log(line);
	}
	cb();
}

function reportHeader() {
	return [
		c.cyan("File Type"),
		c.cyan("Size before"),
		c.cyan("Size after"),
		c.cyan("Difference"),
		c.cyan("Percentage reduction"),
	];
}

function reportRow(fileType, before, after) {
	return [
		fileType,
		before.prettySize,
		after.prettySize,
		colorizeSizeDifference(before.size, after.size),
		colorizeSizePercentage(before.size, after.size),
	];
}

function getRAGColor(before, after) {
	return after < before ? c.green
		: after > before ? c.red
			: c.yellow;
}

function colorizeSizeDifference(before, after) {
	const color = getRAGColor(before, after);
	return color(prettyBytes(after - before, { signed: true }));
}

function colorizeSizePercentage(before, after) {
	const color = getRAGColor(before, after);
	const reduction = before - after;
	const percentage = before !== 0 ? 100 * reduction / before : 0;
	return color(`${percentage.toFixed(2)}%`);
}

function generateBatches(cb) {
	log(`Splitting ${c.magenta(`${files.length}`)} files into batches of size ${c.magenta(`${BATCH_SIZE}`)}...`);
	batches = [];
	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		batches.push(files.slice(i, i + BATCH_SIZE));
	}
	log(`${c.magenta(`${batches.length}`)} batches generated.`);
	cb();
}

function minifyBatches(cb) {
	const tasks = batches.map((batch, i) => {
		function minifyTask() {
			log(`Minifying batch ${c.magenta(`${i + 1}`)} of ${c.magenta(`${batches.length}`)}`);
			return minifyBatch(batch);
		}

		minifyTask.displayName = `Minify batch ${i + 1} of ${batches.length}`;
		return minifyTask;
	});

	return gulp.series(...tasks, (seriesDone) => {
		seriesDone();
	})(cb);
}

function minifyBatch(batch) {
	const sizesBefore = fileSizes();
	const sizesAfter = fileSizes();
	return gulp.src(batch, { base: BASE_DIR })
		.pipe(sizesBefore)
		.pipe(cache(
			configureImagemin(),
			{
				name: "imagemin",
				fileCache: new cache.Cache({
					// @ts-expect-error There's something wrong with the typings here…
					// This is actually cache-swap's interface, which has this option.
					tmpDir: CACHE_DIR,
					cacheDirName: "imagemin-cache",
				}),
			},
		))
		.pipe(sizesAfter)
		.pipe(filter((file) => {
			const sizeBefore = /** @type {number} */ (sizesBefore.sizes.get(file.path));
			const sizeAfter = /** @type {number} */ (sizesAfter.sizes.get(file.path));
			if (sizeAfter > sizeBefore) {
				log(`Omitting file "${c.magenta(file.path)}": size after minification is greater than original size.`);
			}
			return sizeAfter <= sizeBefore;
		}))
		.pipe(gulp.dest(BASE_DIR));
}

function configureImagemin() {
	return imagemin([
		jpegtran(),
		optipng({ optimizationLevel: 5 }),
		svgo({
			plugins: [
				{
					name: "removeViewBox",
				},
				// @ts-expect-error no idea
				{
					name: "cleanupIDs",
				},
			],
		}),
	]);
}

function sourceFiles() {
	return gulp.src([
		`${BASE_DIR}/**/*.{jpg,jpeg,png,svg}`,
		`!${BASE_DIR}/**/Assets/Female3DCG/BodyUpper/3DCGPose/**/*`,
		`!${BASE_DIR}/Tools/**/*`,
		`!${BASE_DIR}/node_modules/**/*`
	], { base: BASE_DIR });
}

function count(message) {
	return gulpCount({ message, logger: log });
}

function gulpLog(...messages) {
	return through.obj(
		(file, enc, cb) => cb(null, file),
		(cb) => {
			for (const message of messages) {
				if (typeof message === "function") {
					log(message());
				} else {
					log(message);
				}
			}
			cb();
		},
	);
}

/**
 *
 * @returns {import("stream").Transform & {sizes: Map<string, number>}}
 */
function fileSizes() {
	const sizes = new Map();

	const obj = through.obj(
		async function (file, enc, cb) {
			// @ts-expect-error Smuggling size through
			if (!this.sizes) {
				// @ts-expect-error Smuggling size through
				this.sizes = sizes;
			}

			if (file.isNull()) {
				cb(null, file);
				return;
			}

			let size = 0;

			if (file.isStream()) {
				size = await getStreamSize(file);
			} else if (file.isBuffer()) {
				size = file.contents.length;
			}

			sizes.set(file.path, size);

			cb(null, file);
		},
	);
	return /** @type {import("stream").Transform & {sizes: Map<any, any>}} */ (obj);
}

function getStreamSize(file) {
	return new Promise((resolve, reject) => {
		const stream = file.contents.pipe(new StreamCounter());
		stream.on("finish", () => resolve(stream.bytes))
			.on("error", (error) => reject(error));
	});
}

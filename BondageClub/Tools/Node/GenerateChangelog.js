import fs from "fs";
import path from "path";
import util from "util";
import * as cheerio from "cheerio";
import { marked } from "marked";
import { simpleGit } from "simple-git";

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const bcRoot = path.resolve(import.meta.dirname, "../..");
const htmlPath = path.join(bcRoot, "changelog.html");
const markdownPath = path.join(bcRoot, "CHANGELOG.md");

const GIT_GUD_PROJECT_ID = 18180;

/** @type {Record<string, string>} */
const CONTRIBUTOR_NAMES = {
	"ABalfik": "Alfi",
	"Ace": "Ace",
	"ace-1331": "Ace",
	"Ada": "Ada",
	"Ada18980": "Ada",
	"anniclub": "anniclub",
	"Anonymous-WghrYkBGUjBt": "Anonymous-WghrYkBGUjBt",
	"answork01": "answork01",
	"Arius": "Arius",
	"Atasly": "Atasly",
	"Ayesha": "Ayesha",
	"Ayesha-678": "Ayesha",
	"bananarama92": "Rama",
	"banarama92": "Rama",
	"Ben987": "Ben987",
	"Bluesilv": "Bluesilv",
	"BondageProjects": "Ben987",
	"Cleon": "Cleon",
	"Constantan": "Constantan",
	"Constantan2": "Constantan",
	"Constantan4": "Constantan",
	"crimsonfox": "Haruhi",
	"Da'Inihlus": "Da'Inihlus",
	"DaddyDaubeny": "Daddy Daubeny",
	"dDeepLb": "dDeepLb",
	"DekuWang": "DekuWang",
	"Demopans": "Demopans",
	"dependabot[bot]": "Dependabot",
	"DESKTOP-HWR\\HWR": "DESKTOP-HWR\\HWR",
	"diaperand": "diaperand",
	"dynilath": "dynilath",
	"Elda": "Elda",
	"EliseRoland": "EliseRoland",
	"Ellie": "Ellie",
	"elliesec": "Ellie",
	"EllieThePink": "EllieThePink",
	"EmilyR42": "Emily R",
	"estuiguang": "estuiguang",
	"Fareeha": "Fareeha",
	"fleisch11": "fleisch11",
	"gatetrek": "gatetrek",
	"Gatey": "gatetrek",
	"Gelmezon": "Gelmezon",
	"Haruhi": "Haruhi",
	"ItsJustMeVerity": "Verity",
	"Jean-Baptiste Emmanuel Zorg": "Estsanatlehi",
	"Jomshir98": "Jomshir",
	"jomshir98": "Jomshir",
	"Jules Papillon": "Yuki",
	"Kalina": "Kalina",
	"karame1": "Karamel",
	"Karamel": "Karamel",
	"karamel": "Karamel",
	"kastenbrotstueck": "kastenbrotstueck",
	"Kimei Nishimura": "Kimei",
	"klorpa": "klorpa",
	"kotax": "kotax",
	"KyraObscura": "KyraObscura",
	"Lanarux": "Lanarux",
	"Leo L. Schwab": "ewhac",
	"Leo Schwab": "ewhac",
	"Luna": "Luna",
	"luna-gleam": "Luna",
	"luoxingchen": "luoxingchen",
	"Manilla32": "Manilla",
	"Marie": "Marie",
	"Mark": "Mark",
	"markbc": "markbc",
	"meshwork": "meshwork",
	"meshwork100": "meshwork100",
	"Miisha": "Miisha",
	"Moonlight": "Luna",
	"MoonlightGleam": "Luna",
	"Natsuki": "Natsuki",
	"NepTimeline": "NepTimeline",
	"Nina-1474": "Nina",
	"NoneNoname": "Sekkmer",
	"Pjara Yuzu": "Pjara Yuzu",
	"Rama": "Rama",
	"remiliacn": "remiliacn",
	"Ruilov3": "Rui",
	"Sepia Oulomenohn": "Sepia Oulomenohn",
	"SepiaOulomenohn": "SepiaOulomenohn",
	"shion": "shion",
	"shion11": "shion",
	"Shiranui-Izayoi": "Aeren",
	"Sidiousious": "Sidious",
	"sqrt10pi": "sqrt10pi",
	"T-Bone Shark": "T-Bone Shark",
	"Tama-chan": "Tama-chan",
	"tamachan": "Tama-chan",
	"TheGnarp": "Gnarp",
	"Timeline": "Timeline",
	"Tsubasahane": "Tsubasahane",
	"tui": "tui",
	"VCode": "VCode",
	"Verity": "Verity",
	"wildsj": "wildsj",
	"YuccaThePlant": "YuccaThePlant",
	"Yuki": "Yuki",
	"zorgjbe": "Estsanatlehi",
	"zorgjeanbe": "Estsanatlehi",
	"zR1OQicz": "zR1OQicz",
};

async function generateChangelogHtml() {

	const [sourceHtml, sourceMarkdown] = await Promise.all([
		readFileAsync(htmlPath, "utf-8"),
		readFileAsync(markdownPath, "utf-8"),
	]);

	const startIndex = sourceMarkdown.search(/^## \[R[0-9a-zA-Z]+]/m);
	const trimmedMarkdown = sourceMarkdown.substring(startIndex);

	// Restore the heading ID assignment that got removed at _some_ point in Marked
	const renderer = new marked.Renderer();
	renderer.heading = function ({ text, depth }) {
		const id = text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "");
		return `<h${depth} id="${id}">${text}</h${depth}>`;
	};
	const renderedMarkdown = await marked.parse(trimmedMarkdown, { renderer });

	const $ = cheerio.load(sourceHtml);
	$("body").empty()
		.append("<h1>Bondage Club - Changelog</h1>\n")
		.append("<h2 id=\"table-of-contents\">Table of Contents</h2>\n")
		.append(generateToc(sourceMarkdown) + "\n")
		.append(generateContributorNote())
		.append(renderedMarkdown);

	const contents = $.root().html();
	if (!contents) {
		console.error(`no contents?`);
		return;
	}

	await writeFileAsync(htmlPath, contents);
}

function generateContributorNote() {
	return `
<blockquote id="note-to-contributors">
	<p>
		<strong>Note to contributors:</strong> If you have not stated a preferred name for inclusion in the changelog or
		 game credits, we will use the username on your Git commits by default. If you would like to use another name,
		 please ask in the programming channel of <a href="https://discordapp.com/invite/dkWsEjf">the game&apos;s
		 official Discord Server</a>, or <a href="https://gitgud.io/BondageProjects/Bondage-College/-/issues">raise
		 an issue</a> on the game's GitGud project.
	</p>
</blockquote>
`;
}

function generateToc(sourceMarkdown) {
	const $ = cheerio.load("<ul>\n</ul>");
	const matches = sourceMarkdown.match(/^## \[R[0-9A-Z]+]/gim);
	matches.forEach((match, i) => {
		const version = match.match(/\[(R[0-9A-Z]+)]/)[1];
		$("ul").attr("id", "toc-list").append(`\t<li><a href="#${version.toLowerCase()}">${version}${i === 0 ? " (Current)" : ""}</a></li>\n`);
	});
	return $.root().html();
}

async function fetchMergeRequests(page) {
	const MAX_ATTEMPTS = 5;
	for (let i = 0; i < MAX_ATTEMPTS; i++) {
		console.log(`Fetching page ${page} of merge requests` + (i > 0 ? `(attempt ${i + 1})` : ''));
		try {
			const response = await fetch(`https://gitgud.io/api/v4/projects/${GIT_GUD_PROJECT_ID}/merge_requests?page=${page}`);
			return /** @type {any} */ (await response.json());
		} catch {
			console.warn(`Fetch of merge request page ${page} failed. Retrying...`);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	console.error(`Merge request fetch failed after ${MAX_ATTEMPTS} attempts. The GitLab API may be down.`);
	return [];
}

async function getCommits() {
	/** @type {import("simple-git").SimpleGit} */
	const git = simpleGit(bcRoot);

	const remoteName = await git.revparse(['--abbrev-ref', "--symbolic-full-name", "@{u}"]);
	if (!remoteName) {
		console.error(`Unable to get remote name for current branch!`);
		process.exit(-1);
	}

	return (await git.log([remoteName])).all;
}

async function prepareChangelog(release = "") {
	let mergeRequestPage = 1;
	const mergeRequests = await fetchMergeRequests(mergeRequestPage);

	const originalMarkdown = fs.readFileSync(markdownPath, "utf-8");
	let lines = originalMarkdown.split(/\n/g);

	const lastUpdateRegex = /^\* Changelog last updated: /;
	const lastUpdateLine = lines.findIndex(line => lastUpdateRegex.test(line));

	if (lastUpdateLine < 0) {
		console.error("ERROR: Failed to find last upate date in changelog");
		return;
	}
	console.log(lines[lastUpdateLine].substr(12));

	const lastPRRegex = /^\* Last recorded PR: \[#(\d+)\]/;
	const lastPRLine = lines.findIndex(line => lastPRRegex.test(line));
	const lastPRRegexResult = lastPRLine >= 0 && lastPRRegex.exec(lines[lastPRLine]);

	if (lastPRLine < 0 || !lastPRRegexResult) {
		console.error("ERROR: Failed to find last PR in changelog");
		return;
	}
	const lastPR = lastPRRegexResult[1];
	console.log(`Last recorded PR: #${lastPR}`);

	const lastCommitRegex = /^\* Last recorded commit hash: `([0-f]+)`/;
	const lastCommitLine = lines.findIndex(line => lastCommitRegex.test(line));
	const lastCommitRegexResult = lastCommitLine >= 0 && lastCommitRegex.exec(lines[lastCommitLine]);

	if (lastCommitLine < 0 || !lastCommitRegexResult) {
		console.error("ERROR: Failed to find last commit in changelog");
		return;
	}
	const lastCommit = lastCommitRegexResult[1];
	console.log(`Last recorded commit: ${lastCommit}`);

	const commits = await getCommits();

	const lastPos = commits.findIndex(c => c.hash === lastCommit);

	if (lastPos < 0) {
		console.error("ERROR: Last recorded commit not found in history!");
		return;
	}

	console.log("Processing new commits...\n");

	/** @type {string[]} */
	const matchedCommits = [];
	/** @type {string[]} */
	const unmatchedCommits = [];

	let newLastPR = lastPR;
	let newLastCommit = lastCommit;

	for (let i = lastPos - 1; i >= 0; i--) {
		const commit = commits[i];

		let PR;
		let PRText = '(PR not found)';
		let message = commit.message;
		let author = commit.author_name;
		const GitGudPRMatch = /See merge request BondageProjects\/Bondage-College!(\d+)$/.exec(commit.body);
		const GithubPRMatch = /^(.*)\(#(\d+)\)$/.exec(commit.message);
		if (GitGudPRMatch && GitGudPRMatch[1]) {
			PR = GitGudPRMatch[1];
			let mergeRequest = mergeRequests.find((mr) => mr.iid === Number(PR));
			while (!mergeRequest) {
				const nextPage = await fetchMergeRequests(++mergeRequestPage);
				if (!nextPage || !nextPage.length) {
					console.warn(`Could not retrieve merge request ${PR} from GitLab API`);
					break;
				} else {
					mergeRequests.push(...nextPage);
					mergeRequest = mergeRequests.find((mr) => mr.iid === Number(PR));
				}
			}
			const bodyLines = commit.body.split(/\r?\n/);
			if (mergeRequest && mergeRequest.title) {
				message = mergeRequest.title;
			} else {
				const firstNonEmptyLine = bodyLines.find((line) => !!line);
				if (firstNonEmptyLine) {
					message = firstNonEmptyLine;
				}
			}
			if (mergeRequest && mergeRequest.author && mergeRequest.author.name) {
				author = mergeRequest.author.name;
			} else {
				console.warn(`Could not find merge request author for merge request ${PR}`);
			}
		} else if (GithubPRMatch && GithubPRMatch[2]) {
			PR = GithubPRMatch[2];
			message = GithubPRMatch[1];
			author = commit.author_name;
		}

		if (PR) {
			PRText = `([#${PR}](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/${PR}))`;
			newLastPR = PR;
		}
		newLastCommit = commit.hash;

		if (CONTRIBUTOR_NAMES[author] === undefined) {
			console.warn(`Unknown commit author "${author}"`);
			CONTRIBUTOR_NAMES[author] = author;
		}

		const markdownLine = `* ${CONTRIBUTOR_NAMES[author]} - ${message} ${PRText}`;
		(PR ? matchedCommits : unmatchedCommits).push(markdownLine);
	}

	const now = new Date();
	const num = ( /** @type {number} */ n) => `${n}`.padStart(2, '0');

	lines[lastUpdateLine] = `* Changelog last updated: ${now.getFullYear()}-${num(now.getMonth()+1)}-${num(now.getDate())}`;
	lines[lastPRLine] = `* Last recorded PR: [#${newLastPR}](https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/${newLastPR})`;
	lines[lastCommitLine] = `* Last recorded commit hash: \`${newLastCommit}\``;

	const releaseAdd = release ? `
## [${release}]

### [Added]

* Nothing this release

### [Removed]

* Nothing this release

### [Changed]

* Nothing this release

### [Fixed]

* Nothing this release

### [Technical]

* Nothing this release

### [Beta Fixes]

* Nothing... yet
` : "";

	lines = [
		...lines.slice(0, lastCommitLine+1),
		"",
		"## [Generated]",
		...matchedCommits,
		"\n## [Unmatched commits]",
		...unmatchedCommits,
		releaseAdd,
		...lines.slice(lastCommitLine+1)
	];

	fs.writeFileSync(markdownPath, lines.join("\n"), "utf-8");

	console.log(`\nDone! ${matchedCommits.length} commits processed`);
}

if (process.argv.length < 3) {
	console.log(`Expected usage: node ${process.argv[1]} <generate|prepare> [release]`);
} else if (process.argv[2].toLocaleLowerCase() === "generate") {
	generateChangelogHtml();
} else if (process.argv[2].toLocaleLowerCase() === "prepare") {
	prepareChangelog(process.argv[3]);
}

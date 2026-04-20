let font;
let fontBold;
let isError = false;
let grade_type = "Adult";
let hasInteracted = false;

const vals = {
	grade: "",
	name: "Jane Doe",
	title: "",
	unit: "",
	address: "",
	phone_1_type: "M",
	phone_1: "",
	phone_2_type: "M",
	phone_2: "",
	email: "",
};

function sanitizeText(s) {
	return String(s)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function formatPhoneDisplay(value) {
	let digits = String(value || "").replace(/\D/g, "");

	if (digits.length > 10 && digits.charAt(0) === "1") {
		digits = digits.slice(1);
	}

	digits = digits.slice(0, 10);

	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return digits.slice(0, 3) + "." + digits.slice(3);
	return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
}

function autoFormatPhoneInput(el) {
	if (!el) return;
	const formatted = formatPhoneDisplay(el.value);
	if (el.value !== formatted) {
		el.value = formatted;
	}
}

function isValidCapEmail(email) {
	if (!email) return true;
	return /^[A-Z0-9._%+-]+@cap\.(gov|us)$/i.test(email);
}

function renderValidationWarnings(items) {
	const box = document.getElementById("validation_warnings");
	if (!box) return;

	if (!items.length) {
		box.style.display = "none";
		box.innerHTML = "";
		return;
	}

	let html = '<h3>Brand standards review</h3><ul>';

	for (const item of items) {
		html += "<li>" + sanitizeText(item) + "</li>";
	}

	html += "</ul>";
	box.style.display = "block";
	box.innerHTML = html;
}

function gateGrades() {
	const gradeSelect = document.getElementById("grade");
	const options = Array.from(gradeSelect.querySelectorAll("option"));

	for (const opt of options) {
		const isCadet = opt.getAttribute("data-cadet") === "true";
		const isAdult = opt.getAttribute("data-adult") === "true";
		const isAny = opt.getAttribute("data-any") === "true";
		const isNhq = opt.getAttribute("data-nhq") === "true";

		if (grade_type === "NHQ") {
			opt.disabled = !isNhq;
		} else if (grade_type === "Adult") {
			if (isNhq) {
				opt.disabled = true;
			} else if (isAny) {
				opt.disabled = false;
			} else {
				opt.disabled = isCadet;
			}
		} else if (grade_type === "Cadet") {
			if (isNhq) {
				opt.disabled = true;
			} else if (isAny) {
				opt.disabled = false;
			} else {
				opt.disabled = isAdult;
			}
		}
	}

	const selected = gradeSelect.selectedOptions[0];
	if (selected && selected.disabled) {
		if (grade_type === "NHQ") {
			gradeSelect.value = "";
		} else if (grade_type === "Cadet") {
			gradeSelect.value = "Airman";
		} else {
			gradeSelect.value = "2nd Lt.";
		}
	}
}

function getValidationWarnings() {
	const warnings = [];

	const gradeValue = String(vals.grade || "").trim();
	const nameValue = String(vals.name || "").trim();
	const titleValue = String(vals.title || "").trim();
	const unitValue = String(vals.unit || "").trim();
	const addressValue = String(vals.address || "").trim();
	const emailValue = String(vals.email || "").trim();

	const combinedName = [gradeValue, nameValue].filter(Boolean).join(" ").trim();

	if (!nameValue) {
		warnings.push("Name is required.");
	}

	if (/\bSM\b/i.test(combinedName)) {
		warnings.push('"SM" is not a valid CAP grade.');
	}

	if (/\b(MD|DO|PhD|EdD|DBA|DNP|PharmD|DDS|DMD|OD|JD|LLM|MA|MS|MBA|MPA|MEd|BA|BS|BBA|RN|NP|PA-C|CPA|CFA|PMP|CISSP|PE|CFI|CFII|ATP|A&P|Esq\.?)\b/i.test(combinedName)) {
		warnings.push('Do not include professional titles or post-nominals such as "MD," "PhD," or "CFI."');
	}

	if (grade_type === "Adult" && /\bCadet\b/i.test(combinedName)) {
		warnings.push('Adult Volunteer entries should not include the word "Cadet" in the name line.');
	}

	if (grade_type === "NHQ" && gradeValue && !/^(Mr\.|Ms\.|Mrs\.)$/i.test(gradeValue)) {
		warnings.push("NHQ Staff may only use no grade or an approved courtesy title.");
	}

	if (titleValue && /(certified|certification|award|graduate|distinguished|quote|")/i.test(titleValue)) {
		warnings.push("Do not list certifications, accomplishments, or quotes in the duty position field.");
	}

	if (titleValue && /,\s*CAP\b/i.test(titleValue)) {
		warnings.push('Do not append ", CAP" to duty position text.');
	}

	if (unitValue && /,\s*CAP\b/i.test(unitValue)) {
		warnings.push('Do not append ", CAP" to the unit name.');
	}

	if (addressValue && addressValue.split(/\r?\n/).length > 3) {
		warnings.push("Address should not exceed 3 lines.");
	}

	if (emailValue && !isValidCapEmail(emailValue)) {
		warnings.push("Email must end in @cap.gov or @cap.us.");
	}

	if (titleValue && titleValue.length > 40) {
		warnings.push('Duty position may be too long for the layout. Invalid entry: "' + titleValue + '"');
	}

	return warnings;
}

function setActionLockState(isLocked) {
	const updateButton = document.getElementById("update_button");
	const preview = document.getElementById("pdf");
	const overlay = document.getElementById("preview_overlay");

	if (updateButton) {
		updateButton.disabled = isLocked;
		updateButton.classList.toggle("button--disabled", isLocked);
		updateButton.title = isLocked
			? "Resolve brand standard warnings before proceeding."
			: "";
	}

	if (preview) {
		preview.classList.toggle("preview-disabled", isLocked);
	}

	if (overlay) {
		overlay.hidden = !isLocked;
	}
}

async function generatePdf() {
	const url = "source.pdf";
	const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
	const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

	pdfDoc.setTitle("CAP Business Card Template");
	pdfDoc.setAuthor("Civil Air Patrol");

	font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
	fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

	const pages = pdfDoc.getPages();
	const pageFront = pages[0];

	let rowY = 735.6;
	const shiftY = 143.9;
	const colX = 173;

	placeText(pageFront, colX, rowY);
	placeText(pageFront, colX + 252, rowY);

	rowY -= shiftY;
	placeText(pageFront, colX, rowY);
	placeText(pageFront, colX + 252, rowY);

	rowY -= shiftY;
	placeText(pageFront, colX, rowY);
	placeText(pageFront, colX + 252, rowY);

	rowY -= shiftY;
	placeText(pageFront, colX, rowY);
	placeText(pageFront, colX + 252, rowY);

	rowY -= shiftY;
	placeText(pageFront, colX, rowY);
	placeText(pageFront, colX + 252, rowY);

	const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
	document.getElementById("pdf").src = pdfDataUri;
}

function placeText(page, x, y) {
	const maxWidth = 121;

	let gradeNameIsMultiline = false;
	let gradeNameText = "";

	let gradeText = vals.grade;
	if (grade_type === "Cadet" && gradeText) {
		gradeText = "Cadet " + gradeText;
	}

	const gradeTextWidth = fontBold.widthOfTextAtSize(gradeText || "", 8);

	if (grade_type === "Cadet" && gradeText && gradeTextWidth > maxWidth) {
		gradeText = "C/" + vals.grade;
	}

	const nameText = vals.name;
	gradeNameText = [gradeText, nameText].filter(Boolean).join(" ");

	const gradeNameTextWidth = fontBold.widthOfTextAtSize(gradeNameText, 8);

	if (gradeNameTextWidth > maxWidth) {
		gradeNameText = [gradeText, nameText].filter(Boolean).join("\n");
		gradeNameIsMultiline = true;

		const gradeOnlyWidth = fontBold.widthOfTextAtSize(gradeText || "", 8);
		const nameOnlyWidth = fontBold.widthOfTextAtSize(nameText, 8);

		if ((gradeText && gradeOnlyWidth > maxWidth) || nameOnlyWidth > maxWidth) {
			$("#name").addClass("error");
			isError = true;
		}
	}

	page.drawText(gradeNameText, {
		x: x,
		y: y,
		size: 8,
		lineHeight: 9,
		font: fontBold,
		color: PDFLib.rgb(0, 0.09411764706, 0.4431372549),
	});

	if (vals.title || vals.unit) {
		const titleTextWidth = font.widthOfTextAtSize(vals.title, 8);
		const unitTextWidth = font.widthOfTextAtSize(vals.unit, 7);

		if (titleTextWidth > maxWidth) {
			$("#title").addClass("error");
			isError = true;
		}

		if (unitTextWidth > maxWidth) {
			$("#unit").addClass("error");
			isError = true;
		}

		page.drawText(
			vals.title + (vals.title && vals.unit ? "\n" : "") + vals.unit,
			{
				x: x,
				y: y - (gradeNameIsMultiline ? 18 : 9),
				size: 7,
				lineHeight: 8,
				font: font,
				color: PDFLib.rgb(0, 0, 0),
			}
		);
	}

	if (vals.address) {
		const addressTextParts = vals.address.split("\n");
		let addressTextWidth = 0;

		addressTextParts.forEach((part) => {
			const w = font.widthOfTextAtSize(part, 7);
			if (w > addressTextWidth) {
				addressTextWidth = w;
			}
		});

		if (addressTextWidth > maxWidth) {
			$("#address").addClass("error");
			isError = true;
		}

		page.drawText(vals.address, {
			x: x,
			y: y - (gradeNameIsMultiline ? 52.5 : 46.5),
			size: 7,
			lineHeight: 8,
			font: font,
			color: PDFLib.rgb(0, 0, 0),
		});
	}

	if (vals.phone_1 || vals.phone_2 || vals.email) {
		const contactText = [];
		const emailTextWidth = vals.email
			? font.widthOfTextAtSize(vals.email, 7)
			: 0;

		if (emailTextWidth > maxWidth) {
			$("#email").addClass("error");
			isError = true;
		}

		if (vals.phone_1) {
			contactText.push("(" + vals.phone_1_type + ") " + vals.phone_1);
		}

		if (vals.phone_2) {
			contactText.push("(" + vals.phone_2_type + ") " + vals.phone_2);
		}

		if (vals.email) {
			contactText.push(vals.email);
		}

		if (contactText.length === 2) {
			contactText.unshift("");
		} else if (contactText.length === 1) {
			contactText.unshift("", "");
		}

		page.drawText(contactText.join("\n"), {
			x: x,
			y: y - 95,
			size: 7,
			lineHeight: 8,
			font: font,
			color: PDFLib.rgb(0, 0, 0),
		});
	}
}

function updateInput() {
	autoFormatPhoneInput(document.getElementById("phone_1"));
	autoFormatPhoneInput(document.getElementById("phone_2"));

	vals.grade = $("#grade").val();

	if ($("#name").val().trim()) {
		vals.name = $("#name").val().trim();
	} else {
		vals.name = "Jane Doe";
	}

	vals.title = $("#title").val().trim();
	vals.unit = $("#unit").val().trim();
	vals.address = $("#address").val().trim();
	vals.phone_1_type = $("#phone_1_type").val();
	vals.phone_1 = $("#phone_1").val().trim();
	vals.phone_2_type = $("#phone_2_type").val();
	vals.phone_2 = $("#phone_2").val().trim();
	vals.email = $("#email").val().trim();

	$("#name").removeClass("error");
	$("#title").removeClass("error");
	$("#unit").removeClass("error");
	$("#address").removeClass("error");
	$("#email").removeClass("error");

	isError = false;

	if (hasInteracted) {
		const warnings = getValidationWarnings();
		renderValidationWarnings(warnings);

		const hasBlockingErrors =
			!vals.name ||
			(vals.email && !isValidCapEmail(vals.email));

		setActionLockState(hasBlockingErrors);
	} else {
		renderValidationWarnings([]);
		setActionLockState(false);
	}

	if (!isValidCapEmail(vals.email)) {
		$("#email").addClass("error");
		isError = true;
	}

	generatePdf();
}

$(document).ready(function () {
	grade_type = $("#grade_type").val();
	gateGrades();

	$("#phone_1, #phone_2").on("input", function () {
		hasInteracted = true;
		autoFormatPhoneInput(this);
		updateInput();
	});

	$("#phone_1, #phone_2").on("blur", function () {
		hasInteracted = true;
		autoFormatPhoneInput(this);
		updateInput();
	});

	$("#email").on("input blur change", function () {
		hasInteracted = true;

		const value = $(this).val().trim();

		if (value === "" || isValidCapEmail(value)) {
			$(this).removeClass("error");
		} else {
			$(this).addClass("error");
		}

		updateInput();
	});

	$("#grade_type").on("change", function () {
		hasInteracted = true;
		grade_type = $(this).val();
		gateGrades();
		updateInput();
	});

	$("#grade").on("change", function () {
		hasInteracted = true;
		updateInput();
	});

	$("#name, #title, #unit, #address, #phone_1_type, #phone_2_type")
		.on("input change blur", function () {
			hasInteracted = true;
			updateInput();
		});

	generatePdf();

	$("#form").on("submit", function (e) {
		e.preventDefault();
		hasInteracted = true;
		updateInput();
	});
});

let font;
let fontBold;
let isError = false;
let grade_type = "Adult";

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
	const maxWidth = 140;

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

	placeError(page);
}

function placeError(page) {
	if (isError) {
		page.drawText("TEXT IS TOO LONG", {
			x: 140,
			y: 700,
			size: 50,
			font: font,
			color: PDFLib.rgb(1, 0, 0),
			rotate: PDFLib.degrees(-45),
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
		autoFormatPhoneInput(this);
		updateInput();
	});

	$("#phone_1, #phone_2").on("blur", function () {
		autoFormatPhoneInput(this);
		updateInput();
	});

	$("#email").on("input blur change", function () {
		const value = $(this).val().trim();

		if (value === "" || isValidCapEmail(value)) {
			$(this).removeClass("error");
		} else {
			$(this).addClass("error");
		}

		updateInput();
	});

	$("#grade_type").on("change", function () {
		grade_type = $(this).val();
		gateGrades();
		updateInput();
	});

	$("#grade").on("change", updateInput);

	$("#name, #title, #unit, #address, #phone_1_type, #phone_2_type")
		.on("input change blur", updateInput);

	updateInput();

	$("#form").on("submit", function (e) {
		e.preventDefault();
		updateInput();
	});
});

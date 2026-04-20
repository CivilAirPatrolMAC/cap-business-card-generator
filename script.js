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

	const grade

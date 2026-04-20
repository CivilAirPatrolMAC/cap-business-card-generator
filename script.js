let font, fontBold;
let isError = false;
let grade_type = "Senior";

const vals = {
	grade: "2nd Lt.",
	name: "Jane Doe",
	title: "",
	unit: "",
	address: "",
	phone_1_type: "M",
	phone_1: "",
	phone_2_type: "M",
	phone_2: "",
	email: "",
	// grade: "Lt. Col.",
	// name: "Matthew Congrove",
	// title: "Public Affairs Staff Assistant",
	// unit: "National Headquarters",
	// address:
	// 	"123 Flight Line Road\nBuilding C\nSomewhere, TX 12345",
	// phone_1_type: "M",
	// phone_1: "555-555-5555",
	// phone_2_type: "M",
	// phone_2: "555-555-5555",
	// email: "mcongrove@cap.gov",
};

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

	// GRADE / NAME
	let gradeNameIsMultiline = false;
	let gradeNameText = "";
	let gradeText = (grade_type === "Cadet" ? "Cadet " : "") + vals.grade;
	const gradeTextWidth = fontBold.widthOfTextAtSize(gradeText, 8);

	if (gradeTextWidth > maxWidth && grade_type === "Cadet") {
		gradeText = "C/" + vals.grade;
	}

	let nameText = vals.name;
	gradeNameText = (gradeText && gradeText + " ") + nameText;
	let gradeNameTextWidth = fontBold.widthOfTextAtSize(gradeNameText, 8);

	if (gradeNameTextWidth > maxWidth) {
		gradeNameText = (gradeText && gradeText + "\n") + nameText;
		gradeNameIsMultiline = true;

		const gradeTextWidth = fontBold.widthOfTextAtSize(gradeText, 8);
		const nameTextWidth = fontBold.widthOfTextAtSize(nameText, 8);

		if (gradeTextWidth > maxWidth || nameTextWidth > maxWidth) {
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

	// TITLE / UNIT
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
		let addressTextParts = vals.address.split("\n");
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
	vals["grade"] = $("#grade").val();

	if ($("#name").val()) {
		vals["name"] = $("#name").val();
	} else {
		vals["name"] = "Jane Doe";
	}

	vals["title"] = $("#title").val();
	vals["unit"] = $("#unit").val();
	vals["address"] = $("#address").val();
	vals["phone_1_type"] = $("#phone_1_type").val();
	vals["phone_1"] = $("#phone_1").val();
	vals["phone_2_type"] = $("#phone_2_type").val();
	vals["phone_2"] = $("#phone_2").val();
	vals["email"] = $("#email").val();

	$("#name").removeClass("error");
	$("#title").removeClass("error");
	$("#unit").removeClass("error");
	$("#address").removeClass("error");
	$("#email").removeClass("error");

	isError = false;

	generatePdf();
}

$(document).ready(function () {
	generatePdf();

	$("#grade_type").change(function () {
		grade_type = $(this).val();

		// Gate the grades based on SM or Cadet
		if (grade_type === "Senior") {
			$('option[data-cadet="true"]').attr("disabled", "disabled");
			$('option[data-senior="true"]').removeAttr("disabled");
		} else {
			$('option[data-senior="true"]').attr("disabled", "disabled");
			$('option[data-cadet="true"]').removeAttr("disabled");
		}

		updateInput();
	});

	$("#form").submit(function (e) {
		e.preventDefault();
		updateInput();
	});
});

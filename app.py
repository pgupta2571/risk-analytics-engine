from flask import Flask, render_template, request, send_file
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable,
    ListItem, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4
import io
from datetime import datetime
import json

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/test")
def test():
    return "Server is running properly"


@app.route("/generate_report", methods=["POST"])
def generate_report():

    # =============================
    # RECEIVE DATA (MATCHES index.html EXACTLY)
    # =============================

    riskScore = request.form.get("riskScore", "0")
    riskLevel = request.form.get("riskLevel", "Not Classified")
    maturity = request.form.get("maturity", "Not Defined")
    summary = request.form.get("summary", "")

    company_name = request.form.get("companyName", "Confidential Organization")
    industry = request.form.get("industry", "Not Specified")
    employees = request.form.get("employees", "Not Provided")
    endpoints = request.form.get("endpoints", "Not Provided")
    assessment_date = request.form.get(
        "assessmentDate",
        datetime.now().strftime('%d %B %Y')
    )

    try:
        domains = json.loads(request.form.get("domains", "[]"))
    except:
        domains = []

    try:
        recommendations = json.loads(request.form.get("recommendations", "[]"))
    except:
        recommendations = []

    # Remove duplicate domains
    unique_domains = []
    seen = set()
    for d in domains:
        if d["name"] not in seen:
            unique_domains.append(d)
            seen.add(d["name"])

    # =============================
    # CREATE PDF
    # =============================

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0a3d62")

    title_style = ParagraphStyle(
        'BoardTitle',
        parent=styles['Heading1'],
        fontSize=26,
        textColor=primary_color,
        spaceAfter=20
    )

    section_style = ParagraphStyle(
        'BoardSection',
        parent=styles['Heading2'],
        textColor=primary_color,
        spaceAfter=12
    )

    normal_style = styles["Normal"]

    # ==========================================
    # FOOTER FUNCTION
    # ==========================================

    def add_footer(canvas, doc):
        canvas.saveState()
        footer_text = "Confidential | Cybersecurity Risk Assessment Report"
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawCentredString(A4[0] / 2, 15, footer_text)
        canvas.restoreState()

    # ==========================================
    # COVER PAGE
    # ==========================================

    elements.append(Spacer(1, 2 * inch))
    elements.append(Paragraph("CYBERSECURITY RISK ASSESSMENT REPORT", title_style))
    elements.append(Spacer(1, 0.4 * inch))

    elements.append(Paragraph(f"<b>Organization:</b> {company_name}", normal_style))
    elements.append(Paragraph(f"<b>Industry:</b> {industry}", normal_style))
    elements.append(Paragraph(f"<b>Assessment Date:</b> {assessment_date}", normal_style))

    elements.append(Spacer(1, 1 * inch))

    elements.append(Spacer(1, 0.3 * inch))
    elements.append(Paragraph(
    f"<font size=24><b>{riskScore}%</b></font>",
    normal_style
))
    elements.append(Paragraph(f"Classification: {riskLevel}", styles["Heading2"]))
    elements.append(Paragraph(f"Maturity Level: {maturity}", normal_style))

    elements.append(PageBreak())

    # ==========================================
    # ORGANIZATION PROFILE
    # ==========================================

    elements.append(Paragraph("Organization Profile", section_style))
    elements.append(Spacer(1, 0.2 * inch))

    profile_data = [
        ["Company Name", company_name],
        ["Industry", industry],
        ["Employees", employees],
        ["Endpoints", endpoints],
        ["Assessment Date", assessment_date]
    ]

    profile_table = Table(profile_data, colWidths=[2.5 * inch, 3 * inch])
    profile_table.setStyle(TableStyle([
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),

    # Header row styling
    ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 10),

    # Alignment
    ("ALIGN", (0, 0), (0, -1), "LEFT"),
    ("ALIGN", (1, 0), (1, -1), "LEFT"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

    # Padding for professional spacing
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))


    elements.append(profile_table)
    elements.append(Spacer(1, 0.4 * inch))

    # ==========================================
    # EXECUTIVE SUMMARY
    # ==========================================

    elements.append(Paragraph("Executive Summary", section_style))
    elements.append(Spacer(1, 0.15 * inch))
    elements.append(Paragraph(summary, normal_style))
    elements.append(Spacer(1, 0.4 * inch))

    # ==========================================
    # DOMAIN BREAKDOWN
    # ==========================================

    elements.append(Paragraph("Domain Risk Breakdown", section_style))
    elements.append(Spacer(1, 0.2 * inch))

    domain_table_data = [["Domain", "Risk Percentage"]]

    for d in unique_domains:
        domain_table_data.append([d["name"], f"{d['value']}%"])

    domain_table = Table(domain_table_data, colWidths=[3 * inch, 2.5 * inch])
    domain_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey)
    ]))

    elements.append(domain_table)
    elements.append(Spacer(1, 0.4 * inch))

    # ==========================================
    # REMEDIATION ROADMAP
    # ==========================================

    elements.append(Paragraph("Remediation Roadmap", section_style))
    elements.append(Spacer(1, 0.2 * inch))

    elements.append(ListFlowable(
        [ListItem(Paragraph(r, normal_style)) for r in recommendations],
        bulletType="bullet"
    ))

    elements.append(Spacer(1, 0.6 * inch))

    elements.append(Paragraph(
        "This report is intended for executive and governance-level review.",
        styles["Italic"]
    ))

    # BUILD PDF WITH FOOTER
    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="Cybersecurity_Risk_Report.pdf",
        mimetype="application/pdf"
    )




if __name__ == "__main__":
    app.run()


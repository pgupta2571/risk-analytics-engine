from flask import Flask, render_template, request, send_file
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable,
    ListItem, Table, TableStyle, PageBreak, Flowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.lib.pagesizes import A4
import io
from datetime import datetime
import json
import math

app = Flask(__name__)

# ============================================================
# COLOUR HELPERS
# ============================================================

def risk_color_tuple(level):
    """Return an (R,G,B) float tuple (0-1) for a risk level string."""
    return {
        "Low":      (0.00, 1.00, 0.78),   # #00ffc8
        "Moderate": (0.00, 0.82, 1.00),   # #00d2ff
        "High":     (1.00, 0.62, 0.26),   # #ff9f43
        "Critical": (1.00, 0.28, 0.34),   # #ff4757
    }.get(level, (0.00, 0.82, 1.00))


def risk_color_hex(level):
    palettes = {
        "Low":      colors.HexColor("#00c896"),
        "Moderate": colors.HexColor("#00a8e8"),
        "High":     colors.HexColor("#ff9f43"),
        "Critical": colors.HexColor("#ff4757"),
    }
    return palettes.get(level, colors.HexColor("#00a8e8"))


# ============================================================
# CUSTOM FLOWABLE — GAUGE
# ============================================================

class GaugeFlowable(Flowable):
    """
    Half-circle gauge using canvas beginPath / drawPath (compatible with
    all ReportLab 3.x versions).
    """
    def __init__(self, score, level, size=200):
        super().__init__()
        self.score  = score
        self.level  = level
        self.size   = size
        self.width  = size + 24
        self.height = size * 0.72

    def draw(self):
        c     = self.canv
        score = self.score
        r     = self.size / 2
        cx    = self.width / 2
        cy    = r * 0.64
        thick = r * 0.18
        margin = thick / 2
        x1, y1 = cx - r + margin, cy - r + margin
        x2, y2 = cx + r - margin, cy + r - margin

        rc, gc, bc = risk_color_tuple(self.level)

        # ── Grey track (full semicircle) ─────────────────────
        c.saveState()
        c.setLineCap(1)
        c.setLineWidth(thick)
        c.setStrokeColorRGB(0.10, 0.16, 0.22)
        p = c.beginPath()
        p.arc(x1, y1, x2, y2, 180, -180)
        c.drawPath(p, stroke=1, fill=0)
        c.restoreState()

        # ── Coloured fill arc ─────────────────────────────────
        extent_deg = -(score / 100.0) * 180.0
        c.saveState()
        c.setLineCap(1)
        c.setLineWidth(thick)
        c.setStrokeColorRGB(rc, gc, bc)
        p2 = c.beginPath()
        p2.arc(x1, y1, x2, y2, 180, extent_deg)
        c.drawPath(p2, stroke=1, fill=0)
        c.restoreState()

        # ── Tip dot ───────────────────────────────────────────
        tip_angle = math.radians(180 + extent_deg)
        mid_r     = r - margin
        dot_x     = cx + mid_r * math.cos(tip_angle)
        dot_y     = cy + mid_r * math.sin(tip_angle)
        c.saveState()
        c.setFillColorRGB(rc, gc, bc)
        c.circle(dot_x, dot_y, thick * 0.48, stroke=0, fill=1)
        c.restoreState()

        # ── Score text ────────────────────────────────────────
        fs = max(int(r * 0.36), 14)
        c.saveState()
        c.setFillColorRGB(rc, gc, bc)
        c.setFont("Helvetica-Bold", fs)
        c.drawCentredString(cx, cy - fs * 0.30, f"{score:.1f}%")
        c.setFillColorRGB(0.45, 0.60, 0.68)
        c.setFont("Helvetica", 8.5)
        c.drawCentredString(cx, cy - fs * 0.30 - fs * 0.65, "OVERALL RISK SCORE")
        c.restoreState()

        # ── Level badge ───────────────────────────────────────
        badge_y = cy - fs * 0.30 - fs * 0.65 - 20
        bw, bh  = r * 0.88, 18
        c.saveState()
        c.setFillColorRGB(rc * 0.12, gc * 0.12, bc * 0.12)
        c.roundRect(cx - bw/2, badge_y - bh/2, bw, bh, bh/2, stroke=0, fill=1)
        c.setStrokeColorRGB(rc, gc, bc)
        c.setLineWidth(0.7)
        c.roundRect(cx - bw/2, badge_y - bh/2, bw, bh, bh/2, stroke=1, fill=0)
        c.setFillColorRGB(rc, gc, bc)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(cx, badge_y - 3.5, self.level.upper())
        c.restoreState()

        # ── 0% / 100% end labels ──────────────────────────────
        c.saveState()
        c.setFillColorRGB(0.35, 0.48, 0.55)
        c.setFont("Helvetica", 7.5)
        c.drawString(margin, cy - 4, "0%")
        c.drawRightString(self.width - margin, cy - 4, "100%")
        c.restoreState()


# ============================================================
# CUSTOM FLOWABLE — HORIZONTAL BAR CHART
# ============================================================

class HBarChartFlowable(Flowable):
    """
    Horizontal bar chart for domain risk percentages.
    Uses roundRect (safe in all ReportLab 3.x).
    """
    def __init__(self, domains, level, chart_width=420, bar_height=22, gap=14):
        super().__init__()
        self.domains     = domains
        self.level       = level
        self.bar_height  = bar_height
        self.gap         = gap
        self.chart_width = chart_width
        self.label_width = 132
        self.pct_width   = 40
        self.n           = len(domains)
        self.width       = chart_width
        self.height      = self.n * (bar_height + gap) + 10

    def _bar_color(self, val):
        if val >= 70:  return (1.00, 0.28, 0.34)
        if val >= 40:  return (1.00, 0.62, 0.26)
        return               (0.00, 0.95, 0.72)

    def draw(self):
        c     = self.canv
        bar_w = self.chart_width - self.label_width - self.pct_width - 18
        y     = self.height - self.bar_height  # top-down

        for d in self.domains:
            try:   val = float(d.get("value", 0))
            except: val = 0.0
            name      = d.get("name", "")
            rc, gc, bc = self._bar_color(val)
            filled_w  = max((val / 100.0) * bar_w, 0)

            # domain label
            c.saveState()
            c.setFillColorRGB(0.55, 0.68, 0.75)
            c.setFont("Helvetica", 8)
            c.drawRightString(self.label_width - 8, y + self.bar_height * 0.32, name)
            c.restoreState()

            # track background
            bx = self.label_width
            c.saveState()
            c.setFillColorRGB(0.07, 0.12, 0.16)
            c.roundRect(bx, y, bar_w, self.bar_height, 4, stroke=0, fill=1)
            c.restoreState()

            # filled portion
            if filled_w >= 1:
                c.saveState()
                c.setFillColorRGB(rc, gc, bc)
                c.roundRect(bx, y, filled_w, self.bar_height, 4, stroke=0, fill=1)
                c.restoreState()

            # percentage label to the right
            c.saveState()
            c.setFillColorRGB(rc, gc, bc)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(bx + bar_w + 7, y + self.bar_height * 0.32, f"{val:.1f}%")
            c.restoreState()

            y -= (self.bar_height + self.gap)


# ============================================================
# ROUTES
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/test")
def test():
    return "Server running"


@app.route("/generate_report", methods=["POST"])
def generate_report():

    riskScore  = request.form.get("riskScore",  "0")
    riskLevel  = request.form.get("riskLevel",  "Not Classified")
    maturity   = request.form.get("maturity",   "Not Defined")
    summary    = request.form.get("summary",    "")

    company_name    = request.form.get("companyName",    "Confidential Organisation")
    industry        = request.form.get("industryType",   "Not Specified")
    employees       = request.form.get("employeeCount",  "Not Provided")
    endpoints       = request.form.get("endpointCount",  "Not Provided")
    assessment_date = request.form.get("assessmentDate", datetime.now().strftime('%d %B %Y'))

    try:   domains = json.loads(request.form.get("domains", "[]"))
    except: domains = []

    try:   recommendations = json.loads(request.form.get("recommendations", "[]"))
    except: recommendations = []

    # deduplicate domains
    unique_domains, seen = [], set()
    for d in domains:
        nm = d.get("name")
        if nm not in seen:
            unique_domains.append(d)
            seen.add(nm)

    # parse score
    try:   score_float = float(riskScore)
    except: score_float = 0.0

    # ── PDF SETUP ────────────────────────────────────────────
    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=0.85*inch, rightMargin=0.85*inch,
        topMargin=inch, bottomMargin=0.8*inch
    )

    styles = getSampleStyleSheet()
    PW = A4[0] - 1.7 * inch   # usable page width

    primary  = colors.HexColor("#0a2a40")
    accent   = risk_color_hex(riskLevel)
    dimgrey  = colors.HexColor("#6a8a99")
    darkbg   = colors.HexColor("#081520")
    lightbg  = colors.HexColor("#0d2030")
    white    = colors.white

    def style(name, **kw):
        base = kw.pop("parent", "Normal")
        return ParagraphStyle(name, parent=styles[base], **kw)

    title_s   = style("Title",   fontSize=28, textColor=primary,      spaceAfter=6,  leading=34, fontName="Helvetica-Bold")
    eyebrow_s = style("Eye",     fontSize=9,  textColor=dimgrey,      spaceAfter=4,  letterSpacing=3, fontName="Helvetica")
    section_s = style("Sec",     fontSize=11, textColor=accent,       spaceBefore=20, spaceAfter=8, fontName="Helvetica-Bold", letterSpacing=2)
    normal_s  = styles["Normal"]
    small_s   = style("Small",   fontSize=9,  textColor=dimgrey,      leading=14)
    italic_s  = style("Italic",  fontSize=9,  textColor=dimgrey,      leading=14, fontName="Helvetica-Oblique")

    elements = []

    # ── FOOTER ────────────────────────────────────────────────
    def add_footer(canv, doc):
        canv.saveState()
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(dimgrey)
        canv.drawCentredString(A4[0]/2, 22, "Confidential  ·  Cybersecurity Risk Assessment Report")
        canv.drawRightString(A4[0] - 0.85*inch, 22, f"Page {doc.page}")
        # top accent bar
        canv.setFillColor(accent)
        canv.rect(0.85*inch, A4[1] - 0.3*inch, PW, 1.5, stroke=0, fill=1)
        canv.restoreState()

    # ============================================================
    # COVER PAGE
    # ============================================================

    elements.append(Spacer(1, 1.4*inch))
    elements.append(Paragraph("ENTERPRISE SECURITY PLATFORM", eyebrow_s))
    elements.append(Paragraph("Cybersecurity Risk<br/>Assessment Report", title_s))
    elements.append(Spacer(1, 0.2*inch))

    cover_tbl = Table([
        ["Organisation",    company_name],
        ["Industry",        industry],
        ["Employees",       employees],
        ["Endpoints",       endpoints],
        ["Assessment Date", assessment_date],
    ], colWidths=[1.8*inch, 3.8*inch])
    cover_tbl.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",     (0,0), (-1,-1), 10),
        ("FONTNAME",     (0,0), (0,-1),  "Helvetica-Bold"),
        ("TEXTCOLOR",    (0,0), (0,-1),  primary),
        ("TEXTCOLOR",    (1,0), (1,-1),  colors.HexColor("#2a4a5c")),
        ("TOPPADDING",   (0,0), (-1,-1), 7),
        ("BOTTOMPADDING",(0,0), (-1,-1), 7),
        ("LINEBELOW",    (0,0), (-1,-2), 0.3, colors.HexColor("#ccdde8")),
    ]))
    elements.append(cover_tbl)
    elements.append(Spacer(1, 0.6*inch))

    # GAUGE on cover
    elements.append(GaugeFlowable(score_float, riskLevel, size=220))
    elements.append(Spacer(1, 0.3*inch))

    maturity_s = style("Mat", fontSize=11, textColor=dimgrey, alignment=1)
    elements.append(Paragraph(f"Maturity Level: <b>{maturity}</b>", maturity_s))

    elements.append(PageBreak())

    # ============================================================
    # PAGE 2 — EXECUTIVE SUMMARY + DOMAIN BAR CHART
    # ============================================================

    elements.append(Paragraph("EXECUTIVE SUMMARY", section_s))
    clean_sum = summary.replace("<strong>","<b>").replace("</strong>","</b>")
    elements.append(Paragraph(clean_sum, normal_s))
    elements.append(Spacer(1, 0.4*inch))

    elements.append(Paragraph("DOMAIN RISK BREAKDOWN — BAR CHART", section_s))
    elements.append(Spacer(1, 0.1*inch))

    if unique_domains:
        elements.append(HBarChartFlowable(unique_domains, riskLevel,
                                          chart_width=int(PW),
                                          bar_height=24, gap=16))
    elements.append(Spacer(1, 0.4*inch))

    # domain table for exact numbers
    elements.append(Paragraph("DOMAIN SCORES", section_s))
    dom_data = [["Domain", "Risk Score", "Level"]]
    for d in unique_domains:
        try:   val = float(d.get("value", 0))
        except: val = 0.0
        lvl = "High" if val >= 70 else "Moderate" if val >= 40 else "Low"
        dom_data.append([d.get("name",""), f"{val:.1f}%", lvl])

    dom_tbl = Table(dom_data, colWidths=[3.0*inch, 1.6*inch, 1.4*inch])
    dom_tbl.setStyle(TableStyle([
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#d0e8f0")),
        ("BACKGROUND",    (0,0), (-1,0),  colors.HexColor("#ddeef8")),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 9.5),
        ("ALIGN",         (1,0), (2,-1),  "CENTER"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [white, colors.HexColor("#f4fafd")]),
    ]))
    elements.append(dom_tbl)

    elements.append(PageBreak())

    # ============================================================
    # PAGE 3 — ORGANISATION PROFILE
    # ============================================================

    elements.append(Paragraph("ORGANISATION PROFILE", section_s))
    prof_data = [
        ["Field",           "Value"],
        ["Company",         company_name],
        ["Industry",        industry],
        ["Employees",       employees],
        ["Endpoints",       endpoints],
        ["Date",            assessment_date],
        ["Risk Score",      f"{riskScore}%"],
        ["Classification",  riskLevel],
        ["Maturity",        maturity],
    ]
    prof_tbl = Table(prof_data, colWidths=[2.2*inch, 3.8*inch])
    prof_tbl.setStyle(TableStyle([
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#d0e8f0")),
        ("BACKGROUND",    (0,0), (-1,0),  colors.HexColor("#ddeef8")),
        ("FONTNAME",      (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,0), (-1,-1), 9.5),
        ("ALIGN",         (0,0), (0,-1),  "LEFT"),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [white, colors.HexColor("#f4fafd")]),
    ]))
    elements.append(prof_tbl)
    elements.append(Spacer(1, 0.5*inch))

    # ============================================================
    # PAGE 3 cont — REMEDIATION ROADMAP
    # ============================================================

    elements.append(Paragraph("REMEDIATION ROADMAP", section_s))
    elements.append(Spacer(1, 0.1*inch))
    if recommendations:
        items = [ListItem(Paragraph(str(r), small_s), leftIndent=14, spaceAfter=5)
                 for r in recommendations]
        elements.append(ListFlowable(items, bulletType="bullet", leftIndent=20))
    else:
        elements.append(Paragraph("No recommendations generated.", normal_s))

    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(
        "This report is intended for executive and governance-level review. "
        "All findings are based on self-reported inputs and should be validated by a qualified security professional.",
        italic_s
    ))

    # ── BUILD ─────────────────────────────────────────────────
    doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="Cybersecurity_Risk_Report.pdf",
        mimetype="application/pdf"
    )


if __name__ == "__main__":
    app.run(debug=True)
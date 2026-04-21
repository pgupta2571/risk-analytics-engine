// ============================================================
//  SME Cybersecurity Risk Assessment — main.js
// ============================================================

let chartInstance = null;
let gaugeInstance  = null;

// ============================================================
//  RENDER-SAFE: add .js-ready immediately so CSS reveal
//  animation activates only once JS is confirmed running.
//  This prevents blank screens on cold-start servers.
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("js-ready");
});
if (document.readyState !== "loading") {
    document.body.classList.add("js-ready");
}


// ============================================================
//  PARTICLE BACKGROUND
// ============================================================
(function initParticles() {
    try {
        const canvas = document.getElementById("bgCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let W, H;

        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        class Particle {
            constructor() { this.reset(true); }
            reset(rand) {
                this.x  = rand ? Math.random() * W : Math.random() * W;
                this.y  = rand ? Math.random() * H : -10;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = Math.random() * 0.25 + 0.05;
                this.r  = Math.random() * 1.4 + 0.3;
                this.a  = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.y > H + 10) this.reset(false);
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,210,255,${this.a})`;
                ctx.fill();
            }
        }

        let particles;
        function init() {
            resize();
            particles = Array.from({ length: 90 }, () => new Particle());
        }

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx   = particles[i].x - particles[j].x;
                    const dy   = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        const alpha = (1 - dist / 120) * 0.12;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(0,210,255,${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function drawGrid() {
            const step = 80;
            ctx.strokeStyle = "rgba(0,210,255,0.025)";
            ctx.lineWidth = 0.5;
            for (let x = 0; x < W; x += step) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y < H; y += step) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }
        }

        function loop() {
            ctx.clearRect(0, 0, W, H);
            drawGrid();
            drawConnections();
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(loop);
        }

        window.addEventListener("resize", resize);
        init();
        loop();
    } catch (e) {
        // Particle background is decorative — swallow any errors silently
        console.warn("Particle background skipped:", e.message);
    }
})();


// ============================================================
//  SCROLL REVEAL
// ============================================================
(function initReveal() {
    function revealEl(el) {
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => el.classList.add("revealed"), delay);
    }

    // Fallback: if IntersectionObserver is not supported
    if (!("IntersectionObserver" in window)) {
        document.querySelectorAll("[data-reveal]").forEach(revealEl);
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                revealEl(e.target);
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));

    // Safety net: force-reveal anything still hidden after 1.5s
    // (handles Render cold-start where IntersectionObserver may be slow)
    setTimeout(() => {
        document.querySelectorAll("[data-reveal]:not(.revealed)").forEach(el => {
            el.classList.add("revealed");
        });
    }, 1500);
})();


// ============================================================
//  DOMAIN META
// ============================================================
const DOMAIN_META = {
    network: {
        label:  "Network Security",
        weight: 0.30,
        compliance: ["ISO 27001 – A.13", "NIST CSF – PR.AC", "CIS Control 12"],
        adviceBank: {
            high: "Deploy a Next-Generation Firewall (NGFW) with IDS/IPS. Segment your network into trust zones and enforce strict ingress/egress rules.",
            mid:  "Upgrade firewall rules and schedule quarterly network vulnerability scans. Disable unused ports and services.",
            low:  "Continue 24/7 monitoring. Consider periodic red-team exercises to validate network defences."
        }
    },
    access: {
        label:  "Access Control",
        weight: 0.20,
        compliance: ["ISO 27001 – A.9", "NIST CSF – PR.AC", "CIS Control 5 & 6"],
        adviceBank: {
            high: "Enforce MFA across all systems immediately. Implement a Privileged Access Management (PAM) solution and remove all shared/generic accounts.",
            mid:  "Strengthen password policy (min 12 chars, complexity, 90-day rotation). Audit role assignments and remove excess privileges.",
            low:  "Maintain regular access reviews. Consider adopting a Zero Trust architecture."
        }
    },
    data: {
        label:  "Data Protection",
        weight: 0.25,
        compliance: ["ISO 27001 – A.8", "GDPR Article 32", "CIS Control 3 & 13"],
        adviceBank: {
            high: "Classify all sensitive data and apply AES-256 encryption at rest and in transit. Implement a Data Loss Prevention (DLP) solution urgently.",
            mid:  "Complete encryption rollout for all sensitive datasets. Tighten data sharing controls and audit third-party data access.",
            low:  "Conduct annual data classification reviews. Ensure encryption keys are rotated and stored in a dedicated key management service."
        }
    },
    backup: {
        label:  "Backup & Recovery",
        weight: 0.15,
        compliance: ["ISO 27001 – A.12.3", "NIST CSF – RC.RP", "CIS Control 10"],
        adviceBank: {
            high: "Implement automated daily backups immediately with offsite/cloud redundancy. Create and test a documented Disaster Recovery Plan (DRP).",
            mid:  "Increase backup frequency to daily. Establish an offsite backup copy and conduct a DR tabletop exercise this quarter.",
            low:  "Verify backup integrity monthly with automated restore tests. Review RTO/RPO objectives annually."
        }
    },
    employee: {
        label:  "Employee Awareness",
        weight: 0.10,
        compliance: ["ISO 27001 – A.7.2", "NIST CSF – PR.AT", "CIS Control 14 & 17"],
        adviceBank: {
            high: "Launch a mandatory security awareness programme immediately. Conduct simulated phishing campaigns quarterly and establish a formal incident reporting policy.",
            mid:  "Increase training frequency to quarterly. Introduce gamified security awareness modules and formally document the incident reporting procedure.",
            low:  "Maintain regular training cadence. Consider specialist training for IT staff and leadership on advanced threat topics."
        }
    }
};


// ============================================================
//  RISK CLASSIFICATION
// ============================================================
function classifyRisk(score) {
    if (score < 30)  return { level: "Low",      badge: "badge-low",      maturity: "Optimised",  color: "#00ffc8" };
    if (score < 55)  return { level: "Moderate", badge: "badge-moderate", maturity: "Managed",    color: "#00d2ff" };
    if (score < 75)  return { level: "High",     badge: "badge-high",     maturity: "Developing", color: "#ff9f43" };
    return                  { level: "Critical",  badge: "badge-critical", maturity: "Initial",    color: "#ff4757" };
}


// ============================================================
//  RESULT SECTION BUILDERS
// ============================================================
function buildSummary(score, cl, name) {
    const n = name || "The assessed organisation";
    return `${n} has recorded an overall cybersecurity risk score of ${score}%, classified as <strong>${cl.level}</strong> with a maturity level of <strong>${cl.maturity}</strong>. This assessment spans five critical control domains. Immediate leadership attention is recommended for any domain scoring above 60%.`;
}

function buildDomainBreakdown(p) {
    const rows = Object.keys(p).map(k => {
        const pct   = p[k].toFixed(1);
        const level = p[k] >= 70 ? "HIGH" : p[k] >= 40 ? "MOD" : "LOW";
        const col   = p[k] >= 70 ? "#ff4757" : p[k] >= 40 ? "#ff9f43" : "#00ffc8";
        return `<div class="breakdown-row">
            <div class="breakdown-label">${DOMAIN_META[k].label}</div>
            <div class="breakdown-bar-wrap">
                <div class="breakdown-bar" style="width:${pct}%;background:${col};color:${col};"></div>
            </div>
            <div class="breakdown-pct" style="color:${col}">${pct}%</div>
            <div class="breakdown-level" style="color:${col}">${level}</div>
        </div>`;
    }).join("");
    return `<div class="domain-breakdown-inner"><h3>DOMAIN EXPOSURE MAP</h3>${rows}</div>`;
}

function buildPriorityRanking(p) {
    const sorted = Object.entries(p)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v], i) => `<li><strong>#${i+1} — ${DOMAIN_META[k].label}</strong>: ${v.toFixed(1)}% exposure</li>`)
        .join("");
    return `<div class="priority-ranking"><h3>RISK PRIORITY RANKING</h3><ol>${sorted}</ol></div>`;
}

function buildComplianceMapping(p) {
    const elevated = Object.entries(p).filter(([, v]) => v >= 40);
    if (!elevated.length) {
        return `<div class="compliance-box"><h3>COMPLIANCE MAPPING</h3><p style="font-size:13px;color:var(--text-dim)">All domains within acceptable thresholds. No critical compliance gaps detected.</p></div>`;
    }
    const rows = elevated.map(([k]) => {
        const m = DOMAIN_META[k];
        return `<tr><td>${m.label}</td><td>${m.compliance.join("<br>")}</td></tr>`;
    }).join("");
    return `<div class="compliance-box"><h3>COMPLIANCE MAPPING</h3>
        <table class="compliance-table">
            <thead><tr><th>Domain</th><th>Frameworks</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
}

function buildRecommendations(p) {
    const items = Object.entries(p).map(([k, v]) => {
        const m    = DOMAIN_META[k];
        const tier = v >= 70 ? "high" : v >= 40 ? "mid" : "low";
        const icon = v >= 70 ? "🔴" : v >= 40 ? "🟡" : "🟢";
        return `<li>${icon} <strong>${m.label}:</strong> ${m.adviceBank[tier]}</li>`;
    });
    return `<h3>REMEDIATION ROADMAP</h3><ul>${items.join("")}</ul>`;
}


// ============================================================
//  CHARTS
// ============================================================
function createChart(p) {
    const canvas = document.getElementById("riskChart");
    if (!canvas) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    const vals = [p.network, p.access, p.data, p.backup, p.employee];
    const bgs  = vals.map(v =>
        v >= 70 ? "rgba(255,71,87,0.75)" :
        v >= 40 ? "rgba(255,159,67,0.75)" :
                  "rgba(0,255,200,0.65)"
    );

    chartInstance = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels:   ["Network", "Access", "Data", "Backup", "Employee"],
            datasets: [{
                label:           "Risk %",
                data:            vals,
                backgroundColor: bgs,
                borderColor:     bgs.map(c => c.replace("0.75", "1").replace("0.65", "1")),
                borderWidth:     1,
                borderRadius:    10,
                borderSkipped:   false
            }]
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            animation:           { duration: 1000, easing: "easeOutQuart" },
            plugins: {
                legend: { labels: { color: "rgba(200,223,232,0.6)", font: { family: "Syne" } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "rgba(200,223,232,0.5)", callback: v => v + "%" },
                    grid:  { color: "rgba(0,210,255,0.06)" }
                },
                x: {
                    ticks: { color: "rgba(200,223,232,0.5)", font: { family: "Syne", weight: "700" } },
                    grid:  { color: "rgba(0,210,255,0.04)" }
                }
            }
        }
    });
}

function createGauge(score, color) {
    const canvas = document.getElementById("riskGauge");
    if (!canvas) return;
    if (gaugeInstance) { gaugeInstance.destroy(); gaugeInstance = null; }

    gaugeInstance = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
            datasets: [{
                data:            [score, 100 - score],
                backgroundColor: [color, "rgba(255,255,255,0.04)"],
                borderWidth:     0,
                hoverOffset:     0
            }]
        },
        options: {
            cutout:              "78%",
            responsive:          false,
            animation:           { duration: 1200, easing: "easeOutQuart" },
            plugins: {
                legend:  { display: false },
                tooltip: { enabled: false }
            }
        },
        plugins: [{
            id: "gaugeCenter",
            afterDraw(chart) {
                const { ctx, chartArea: { width, height, left, top } } = chart;
                const cx = left + width / 2;
                const cy = top + height / 2;
                ctx.save();
                ctx.font         = `800 ${Math.round(width * 0.22)}px Syne, sans-serif`;
                ctx.fillStyle    = "#ffffff";
                ctx.textAlign    = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(score.toFixed(1) + "%", cx, cy - 10);
                ctx.font      = "400 11px DM Sans, sans-serif";
                ctx.fillStyle = color;
                ctx.fillText("RISK", cx, cy + 18);
                ctx.restore();
            }
        }]
    });
}


// ============================================================
//  MAIN EVALUATE HANDLER
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("evaluateBtn");
    if (!btn) { console.error("evaluateBtn not found"); return; }

    btn.addEventListener("click", function () {

        // ── 1. Collect values from native <select> elements ────
        // inp.value is the standard HTMLSelectElement property —
        // always returns the value attribute of the selected option.
        const inputs = document.querySelectorAll(".risk-input");
        if (!inputs.length) { alert("No inputs found."); return; }

        let raw = { network: 0, access: 0, data: 0, backup: 0, employee: 0 };

        inputs.forEach((inp, i) => {
            const v = parseInt(inp.value) || 0;   // standard .value, no dataset dependency
            if      (i < 3)  raw.network  += v;
            else if (i < 6)  raw.access   += v;
            else if (i < 9)  raw.data     += v;
            else if (i < 12) raw.backup   += v;
            else             raw.employee += v;
        });

        // ── 2. Calculate percentages ───────────────────────────
        const domMax = 15;
        const p = {
            network:  (raw.network  / domMax) * 100,
            access:   (raw.access   / domMax) * 100,
            data:     (raw.data     / domMax) * 100,
            backup:   (raw.backup   / domMax) * 100,
            employee: (raw.employee / domMax) * 100
        };

        // ── 3. Weighted overall score ──────────────────────────
        const weighted = Object.entries(p).reduce((s, [k, v]) => s + v * DOMAIN_META[k].weight, 0);
        const score    = parseFloat(weighted.toFixed(2));
        const cl       = classifyRisk(score);

        // ── 4. Read profile fields ─────────────────────────────
        const companyName    = document.getElementById("companyName")?.value.trim()    || "";
        const industryType   = document.getElementById("industryType")?.value.trim()   || "Not Specified";
        const employeeCount  = document.getElementById("employeeCount")?.value.trim()  || "N/A";
        const endpointCount  = document.getElementById("endpointCount")?.value.trim()  || "N/A";
        const assessmentDate = document.getElementById("assessmentDate")?.value        || new Date().toISOString().slice(0, 10);

        // ── 5. Show results section ────────────────────────────
        const resultsEl = document.getElementById("resultsSection");
        resultsEl.style.display = "block";

        // ── 6. Company banner ──────────────────────────────────
        const sumEl = document.getElementById("companySummary");
        if (sumEl) {
            sumEl.innerHTML = `<div class="company-summary-banner">
                <span><strong>Organisation:</strong> ${companyName || "—"}</span>
                <span><strong>Industry:</strong> ${industryType}</span>
                <span><strong>Employees:</strong> ${employeeCount}</span>
                <span><strong>Endpoints:</strong> ${endpointCount}</span>
                <span><strong>Date:</strong> ${assessmentDate}</span>
            </div>`;
        }

        // ── 7. Score display ───────────────────────────────────
        const scoreEl = document.getElementById("riskScore");
        if (scoreEl) {
            scoreEl.innerText        = score.toFixed(1) + "%";
            scoreEl.style.color      = cl.color;
            scoreEl.style.textShadow = `0 0 40px ${cl.color}60, 0 0 80px ${cl.color}30`;
        }

        const badgeEl = document.getElementById("riskBadge");
        if (badgeEl) {
            badgeEl.className = `risk-badge ${cl.badge}`;
            badgeEl.innerText = cl.level;
        }

        const matEl = document.getElementById("maturity");
        if (matEl) matEl.innerText = "Maturity Level: " + cl.maturity;

        // ── 8. Executive summary ───────────────────────────────
        const execText  = buildSummary(score.toFixed(1), cl, companyName);
        const sumTextEl = document.getElementById("riskSummary");
        if (sumTextEl) sumTextEl.innerHTML = execText;

        // ── 9. Sub-sections ────────────────────────────────────
        const breakdownEl = document.getElementById("domainBreakdown");
        if (breakdownEl) breakdownEl.innerHTML = buildDomainBreakdown(p);

        const rankingEl = document.getElementById("riskPriorityRanking");
        if (rankingEl) rankingEl.innerHTML = buildPriorityRanking(p);

        const complianceEl = document.getElementById("complianceMapping");
        if (complianceEl) complianceEl.innerHTML = buildComplianceMapping(p);

        const recsEl = document.getElementById("recommendations");
        if (recsEl) recsEl.innerHTML = buildRecommendations(p);

        // ── 10. Populate PDF form hidden fields ────────────────
        const recsPlain = Object.entries(p).map(([k, v]) => {
            const tier = v >= 70 ? "high" : v >= 40 ? "mid" : "low";
            return `${DOMAIN_META[k].label}: ${DOMAIN_META[k].adviceBank[tier]}`;
        });
        const domainsJSON = Object.entries(p).map(([k, v]) => ({
            name:  DOMAIN_META[k].label,
            value: v.toFixed(1)
        }));

        document.getElementById("formCompanyName").value     = companyName;
        document.getElementById("formIndustryType").value    = industryType;
        document.getElementById("formEmployeeCount").value   = employeeCount;
        document.getElementById("formEndpointCount").value   = endpointCount;
        document.getElementById("formAssessmentDate").value  = assessmentDate;
        document.getElementById("formRiskScore").value       = score.toFixed(2);
        document.getElementById("formRiskLevel").value       = cl.level;
        document.getElementById("formMaturity").value        = cl.maturity;
        document.getElementById("formSummary").value         = execText.replace(/<[^>]+>/g, "");
        document.getElementById("formDomains").value         = JSON.stringify(domainsJSON);
        document.getElementById("formRecommendations").value = JSON.stringify(recsPlain);

        // ── 11. Render charts + scroll ─────────────────────────
        setTimeout(() => {
            createChart(p);
            createGauge(score, cl.color);
            resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    });
});
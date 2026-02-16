document.addEventListener("DOMContentLoaded", function () {

console.log("JS LOADED");

let chartInstance = null;
let gaugeInstance = null;

document.getElementById("evaluateBtn").addEventListener("click", function () {

    let inputs = document.querySelectorAll(".risk-input");

    let domainScores = {
        network: 0,
        access: 0,
        data: 0,
        backup: 0,
        employee: 0
    };

    // ----------------------------
    // COLLECT DOMAIN SCORES
    // ----------------------------

    inputs.forEach(function (input, index) {
        let value = parseInt(input.value);

        if (index < 3) {
            domainScores.network += value;
        } else if (index < 6) {
            domainScores.access += value;
        } else if (index < 9) {
            domainScores.data += value;
        } else if (index < 12) {
            domainScores.backup += value;
        } else {
            domainScores.employee += value;
        }
    });

    // ----------------------------
    // WEIGHTED RISK MODEL
    // ----------------------------

    let domainMax = 15;

    let networkPercent = (domainScores.network / domainMax) * 100;
    let accessPercent = (domainScores.access / domainMax) * 100;
    let dataPercent = (domainScores.data / domainMax) * 100;
    let backupPercent = (domainScores.backup / domainMax) * 100;
    let employeePercent = (domainScores.employee / domainMax) * 100;

    let weightedScore =
        (networkPercent * 0.30) +
        (accessPercent * 0.20) +
        (dataPercent * 0.25) +
        (backupPercent * 0.15) +
        (employeePercent * 0.10);

    let riskPercentage = weightedScore.toFixed(2);
    let numericScore = parseFloat(riskPercentage);

    // ----------------------------
    // RISK CLASSIFICATION
    // ----------------------------

    let riskLevel = "";

    if (numericScore <= 30) {
        riskLevel = "Low Risk";
    } else if (numericScore <= 60) {
        riskLevel = "Moderate Risk";
    } else if (numericScore <= 80) {
        riskLevel = "High Risk";
    } else {
        riskLevel = "Critical Risk";
    }

    // ----------------------------
    // SHOW RESULTS SECTION
    // ----------------------------

    document.querySelector(".results-section").style.display = "block";
    
    // Company Summary Display
let companyName = document.getElementById("companyName").value || "Not Provided";
let industry = document.getElementById("industryType").value || "Not Provided";
let employees = document.getElementById("employeeCount").value || "N/A";
let endpoints = document.getElementById("endpointCount").value || "N/A";

document.getElementById("companySummary").innerHTML = `
    <div style="
        padding:15px;
        border-radius:12px;
        background:rgba(255,255,255,0.05);
        margin-bottom:15px;
    ">
        <strong>Organization:</strong> ${companyName}<br>
        <strong>Industry:</strong> ${industry}<br>
        <strong>Employees:</strong> ${employees}<br>
        <strong>Endpoints:</strong> ${endpoints}
    </div>
`;


    // ----------------------------
    // ANIMATED SCORE COUNTER
    // ----------------------------

    let displayedScore = 0;
    let scoreElement = document.getElementById("riskScore");

    let counter = setInterval(function () {

        if (displayedScore >= numericScore) {
            clearInterval(counter);
            scoreElement.innerText = "Risk Score: " + numericScore + "%";
        } else {
            displayedScore += 1;
            scoreElement.innerText = "Risk Score: " + displayedScore + "%";
        }

    }, 15);

    // ----------------------------
    // RISK LEVEL + MATURITY INDEX
    // ----------------------------

    let maturityLevel = "";

    if (numericScore <= 20) {
        maturityLevel = "Level 5 – Optimized";
    }
    else if (numericScore <= 40) {
        maturityLevel = "Level 4 – Managed";
    }
    else if (numericScore <= 60) {
        maturityLevel = "Level 3 – Defined";
    }
    else if (numericScore <= 80) {
        maturityLevel = "Level 2 – Developing";
    }
    else {
        maturityLevel = "Level 1 – Initial / Weak";
    }

    let badge = document.getElementById("riskBadge");

badge.className = "risk-badge";

if (riskLevel === "Low Risk") {
    badge.classList.add("badge-low");
}
else if (riskLevel === "Moderate Risk") {
    badge.classList.add("badge-moderate");
}
else if (riskLevel === "High Risk") {
    badge.classList.add("badge-high");
}
else {
    badge.classList.add("badge-critical");
}

badge.innerText = riskLevel + " | " + maturityLevel;

    // ----------------------------
    // EXECUTIVE SUMMARY
    // ----------------------------

    let executiveSummary = "";

    if (riskLevel === "Critical Risk") {
        executiveSummary = "The organization is exposed to critical cybersecurity threats with major control weaknesses requiring immediate corrective action.";
    }
    else if (riskLevel === "High Risk") {
        executiveSummary = "The organization shows significant security gaps that must be addressed to reduce exposure and operational risk.";
    }
    else if (riskLevel === "Moderate Risk") {
        executiveSummary = "The organization maintains moderate cybersecurity controls but requires structured improvements across key domains.";
    }
    else {
        executiveSummary = "The organization demonstrates a relatively stable cybersecurity posture with controlled risk exposure.";
    }

    document.getElementById("riskSummary").innerText = executiveSummary;

    // ----------------------------
    // RECOMMENDATION ENGINE
    // ----------------------------

    let recommendations = [];
    let priorityTitle = "";
    let boxColor = "";

    if (riskLevel === "Critical Risk") {

        priorityTitle = "🚨 Immediate Action Required";
        boxColor = "#ff4d4d";

        recommendations.push("Conduct full-scale cybersecurity audit immediately.");
        recommendations.push("Deploy enterprise-grade firewall and intrusion detection systems.");
        recommendations.push("Enable Multi-Factor Authentication across all systems.");
        recommendations.push("Implement continuous security monitoring.");
        recommendations.push("Initiate emergency employee cybersecurity training.");

    } else if (riskLevel === "High Risk") {

        priorityTitle = "⚠ High Priority Improvements Needed";
        boxColor = "#ff9f43";

        recommendations.push("Strengthen network security monitoring.");
        recommendations.push("Enforce stricter access control mechanisms.");
        recommendations.push("Improve encryption standards and data protection.");
        recommendations.push("Enhance backup redundancy and recovery testing.");

    } else if (riskLevel === "Moderate Risk") {

        priorityTitle = "🔍 Security Optimization Recommended";
        boxColor = "#00c6ff";

        recommendations.push("Review password policies and access segmentation.");
        recommendations.push("Enhance employee security awareness programs.");
        recommendations.push("Conduct quarterly vulnerability assessments.");

    } else {

        priorityTitle = "✅ Stable Security Posture";
        boxColor = "#00ffd5";

        recommendations.push("Maintain current cybersecurity controls.");
        recommendations.push("Continue periodic monitoring and audits.");
        recommendations.push("Sustain employee awareness initiatives.");
    }

    let recommendationBox = document.getElementById("recommendations");

    recommendationBox.innerHTML =
        "<h3>" + priorityTitle + "</h3><br>" +
        recommendations.map(r => "• " + r).join("<br>");

    recommendationBox.style.borderLeft = "5px solid " + boxColor;
    // ----------------------------
// PREPARE FORM DATA FOR PDF
// ----------------------------

document.getElementById("formRiskScore").value = riskPercentage;
document.getElementById("formRiskLevel").value = riskLevel;
document.getElementById("formMaturity").value = maturityLevel;
document.getElementById("formSummary").value = executiveSummary;

// ----------------------------
// ADD COMPANY INFO TO PDF FORM
// ----------------------------

document.getElementById("formCompanyName").value =
    document.getElementById("companyName").value || "Confidential Organization";

document.getElementById("formIndustry").value =
    document.getElementById("industryType").value || "Not Specified";

document.getElementById("formEmployees").value =
    document.getElementById("employeeCount").value || "N/A";

document.getElementById("formEndpoints").value =
    document.getElementById("endpointCount").value || "N/A";

document.getElementById("formAssessmentDate").value =
    document.getElementById("assessmentDate").value || "";


document.getElementById("formDomains").value = JSON.stringify([
    { name: "Network Security", value: networkPercent.toFixed(1) },
    { name: "Access Control", value: accessPercent.toFixed(1) },
    { name: "Data Protection", value: dataPercent.toFixed(1) },
    { name: "Backup & Recovery", value: backupPercent.toFixed(1) },
    { name: "Employee Awareness", value: employeePercent.toFixed(1) }
]);

document.getElementById("formRecommendations").value = JSON.stringify(recommendations);


    // ----------------------------
    // CREATE VISUALS
    // ----------------------------

    createChart({
        network: networkPercent,
        access: accessPercent,
        data: dataPercent,
        backup: backupPercent,
        employee: employeePercent
    });

    createGauge(numericScore);

    // ----------------------------
// DOMAIN BREAKDOWN ANALYSIS
// ----------------------------

let domainData = [
    { name: "Network Security", value: networkPercent },
    { name: "Access Control", value: accessPercent },
    { name: "Data Protection", value: dataPercent },
    { name: "Backup & Recovery", value: backupPercent },
    { name: "Employee Awareness", value: employeePercent }
];

function classifyDomain(score) {
    if (score <= 30) return { label: "Low", color: "#00ffd5" };
    if (score <= 60) return { label: "Moderate", color: "#00c6ff" };
    if (score <= 80) return { label: "High", color: "#ff9f43" };
    return { label: "Critical", color: "#ff4d4d" };
}

let breakdownHTML = `
    <div style="margin-top:30px;">
        <h3 style="margin-bottom:15px;">Domain Risk Breakdown</h3>
`;

let maxValue = Math.max(...domainData.map(d => d.value));

let highestDomains = domainData.filter(d => d.value === maxValue);

let highestDomain = highestDomains.length === 1 ? highestDomains[0] : null;


domainData.forEach(domain => {

    let classification = classifyDomain(domain.value);

    let highlight = highestDomain && domain.name === highestDomain.name
        ? "box-shadow:0 0 10px rgba(255,77,77,0.4); border:1px solid #ff4d4d;"
        : "border:1px solid rgba(255,255,255,0.1);";

    breakdownHTML += `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:12px 16px;
            margin-bottom:10px;
            border-radius:12px;
            background:rgba(255,255,255,0.05);
            ${highlight}
        ">
            <div>
                <strong>${domain.name}</strong><br>
                <span style="color:${classification.color}; font-size:13px;">
                    ${classification.label}
                </span>
            </div>
            <div style="font-weight:600; font-size:14px;">
                ${domain.value.toFixed(1)}%
            </div>
        </div>
    `;
});

breakdownHTML += `</div>`;

document.getElementById("domainBreakdown").innerHTML = breakdownHTML;

// ----------------------------
// RISK PRIORITY RANKING (ENTERPRISE VIEW)
// ----------------------------

// Sort domains by highest risk
let sortedDomains = [...domainData].sort((a, b) => b.value - a.value);

let rankingHTML = `
    <div style="
        margin-top:40px;
        padding:20px;
        border-radius:16px;
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(15px);
        border:1px solid rgba(255,255,255,0.1);
    ">
        <h3 style="margin-bottom:20px;">Risk Priority Ranking</h3>
`;

sortedDomains.forEach((domain, index) => {

    let rankColor =
        index === 0 ? "#ff4d4d" :
        index === 1 ? "#ff9f43" :
        index === 2 ? "#00c6ff" :
        "#00ffd5";

    rankingHTML += `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:14px 18px;
            margin-bottom:12px;
            border-radius:12px;
            background:rgba(255,255,255,0.03);
            border-left:5px solid ${rankColor};
        ">
            <div>
                <strong>#${index + 1} ${domain.name}</strong>
            </div>
            <div style="font-weight:600;">
                ${domain.value.toFixed(1)}%
            </div>
        </div>
    `;
});

rankingHTML += `</div>`;

document.getElementById("riskPriorityRanking").innerHTML = rankingHTML;

// ----------------------------
// COMPLIANCE MAPPING ENGINE
// ----------------------------

let complianceStatus = "";
let complianceColor = "";

if (riskLevel === "Low Risk") {
    complianceStatus = "Mostly Aligned with ISO 27001 & NIST Framework";
    complianceColor = "#00ffd5";
}
else if (riskLevel === "Moderate Risk") {
    complianceStatus = "Partially Aligned – Improvement Required";
    complianceColor = "#00c6ff";
}
else if (riskLevel === "High Risk") {
    complianceStatus = "Significant Compliance Gaps Identified";
    complianceColor = "#ff9f43";
}
else {
    complianceStatus = "Non-Compliant – Immediate Remediation Required";
    complianceColor = "#ff4d4d";
}

let complianceHTML = `
    <div style="
        margin-top:40px;
        padding:22px;
        border-radius:16px;
        background:rgba(255,255,255,0.05);
        backdrop-filter:blur(15px);
        border:1px solid rgba(255,255,255,0.1);
    ">
        <h3 style="margin-bottom:18px;">Compliance Mapping Overview</h3>

        <div style="
            padding:14px 18px;
            border-radius:10px;
            background:rgba(255,255,255,0.03);
            border-left:5px solid ${complianceColor};
            font-weight:500;
        ">
            ${complianceStatus}
        </div>

        <div style="margin-top:15px; font-size:13px; opacity:0.8;">
            Reference Frameworks: ISO 27001, NIST CSF, CIS Controls
        </div>
    </div>
`;

document.getElementById("complianceMapping").innerHTML = complianceHTML;




});


// ----------------------------
// BAR CHART
// ----------------------------

function createChart(domainPercentages) {

    let ctx = document.getElementById("riskChart").getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Network", "Access Control", "Data Protection", "Backup", "Employee Awareness"],
            datasets: [{
                label: "Domain Risk Percentage",
                data: [
                    domainPercentages.network,
                    domainPercentages.access,
                    domainPercentages.data,
                    domainPercentages.backup,
                    domainPercentages.employee
                ],
                backgroundColor: [
                    "rgba(0, 198, 255, 0.7)",
                    "rgba(0, 114, 255, 0.7)",
                    "rgba(0, 255, 213, 0.7)",
                    "rgba(255, 159, 67, 0.7)",
                    "rgba(255, 107, 107, 0.7)"
                ],
                borderRadius: 14,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,0.08)" }
                }
            }
        }
    });
}


// ----------------------------
// CIRCULAR GAUGE
// ----------------------------

function createGauge(percentage) {

    let ctx = document.getElementById("riskGauge").getContext("2d");

    if (gaugeInstance) {
        gaugeInstance.destroy();
    }

    gaugeInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [
                    percentage > 80 ? "#ff4d4d" :
                    percentage > 60 ? "#ff9f43" :
                    percentage > 30 ? "#00c6ff" :
                    "#00ffd5",
                    "rgba(255,255,255,0.08)"
                ],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200
            },
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw(chart) {
                const { width, height, ctx } = chart;
                ctx.save();
                ctx.font = "600 " + (height / 7) + "px Poppins";
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(Math.round(percentage) + "%", width / 2, height / 2);
                ctx.restore();
            }
        }]
    });
}

// ----------------------------
// PDF REPORT DOWNLOAD ENGINE
// ----------------------------

document.addEventListener("DOMContentLoaded", function () {

    const downloadBtn = document.getElementById("downloadReport");

    if (!downloadBtn) return;

    
    });

});

// ----------------------------
// POPULATE FORM BEFORE DOWNLOAD
// ----------------------------

document.getElementById("reportForm").addEventListener("submit", function () {

    // ----------------------------
// COMPANY INFO FOR PDF
// ----------------------------

document.getElementById("formCompanyName").value =
    document.getElementById("companyName").value || "Not Provided";

document.getElementById("formIndustry").value =
    document.getElementById("industryType").value || "Not Provided";

document.getElementById("formEmployees").value =
    document.getElementById("employeeCount").value || "Not Provided";

document.getElementById("formEndpoints").value =
    document.getElementById("endpointCount").value || "Not Provided";

document.getElementById("formAssessmentDate").value =
    document.getElementById("assessmentDate").value || "Not Provided";

    // Risk Score
    let riskScoreText = document.getElementById("riskScore").innerText;
    let riskScore = riskScoreText.replace("Risk Score: ", "").replace("%", "");

    document.getElementById("formRiskScore").value = riskScore;

    // Risk Level & Maturity
    let riskLevelText = document.getElementById("riskLevel").innerText;

    let parts = riskLevelText.split("|");

    let riskLevel = parts[0].replace("Classification: ", "").trim();
    let maturity = parts[1] ? parts[1].replace("Maturity: ", "").trim() : "";

    document.getElementById("formRiskLevel").value = riskLevel;
    document.getElementById("formMaturity").value = maturity;

    // Executive Summary
    let summary = document.getElementById("riskSummary").innerText;
    document.getElementById("formSummary").value = summary;

    // Domain Breakdown
    let domainElements = document.querySelectorAll("#domainBreakdown div");

    let domains = [
        { name: "Network Security", value: networkPercent.toFixed(1) },
    { name: "Access Control", value: accessPercent.toFixed(1) },
    { name: "Data Protection", value: dataPercent.toFixed(1) },
    { name: "Backup & Recovery", value: backupPercent.toFixed(1) },
    { name: "Employee Awareness", value: employeePercent.toFixed(1) }
    ];

    domainElements.forEach(element => {
        let lines = element.innerText.split("\n");
        let name = lines[0].trim();
        let percentMatch = element.innerText.match(/\d+(\.\d+)?/);
        let value = percentMatch ? percentMatch[0] : "0";

        domains.push({
            name: name,
            value: value
        });
        
    });

    document.getElementById("formDomains").value = JSON.stringify(domains);

    // Recommendations
    let recommendationText = document.getElementById("recommendations").innerText.split("\n");
    recommendationText.shift(); // remove title

    document.getElementById("formRecommendations").value =
        JSON.stringify(recommendationText);

});

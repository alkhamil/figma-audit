"use strict";
function getNodeTree(node) {
    var _a, _b;
    const result = {
        id: node.id,
        name: node.name,
        type: node.type,
    };
    // TEXT node
    if (node.type === "TEXT") {
        result.characters = node.characters;
    }
    // INSTANCE node
    if (node.type === "INSTANCE") {
        result.componentId = ((_a = node.mainComponent) === null || _a === void 0 ? void 0 : _a.id) || null;
        result.componentName = ((_b = node.mainComponent) === null || _b === void 0 ? void 0 : _b.name) || null;
    }
    // size info
    if ("width" in node)
        result.width = node.width;
    if ("height" in node)
        result.height = node.height;
    // children (LIMITED for performance)
    if ("children" in node) {
        result.children = node.children
            .slice(0, 50)
            .map((child) => getNodeTree(child));
    }
    return result;
}
function getSelectedNode() {
    const selection = figma.currentPage.selection;
    if (!selection.length)
        return null;
    return selection[0];
}
function isValidNode(node) {
    if (!node)
        return false;
    return (node.type === "FRAME" ||
        node.type === "COMPONENT" ||
        node.type === "INSTANCE" ||
        node.type === "SECTION" ||
        node.type === "GROUP");
}
function getSelectedFrameName() {
    const node = getSelectedNode();
    return node ? node.name : null;
}
// show UI
figma.showUI(__html__, {
    width: 420,
    height: 600,
});
// initial state
figma.ui.postMessage({
    type: "selection-changed",
    frameName: getSelectedFrameName(),
});
// listen selection change
figma.on("selectionchange", () => {
    const node = getSelectedNode();
    console.log("SELECTED NODE TYPE:", node === null || node === void 0 ? void 0 : node.type);
    console.log("SELECTED NODE NAME:", node === null || node === void 0 ? void 0 : node.name);
    figma.ui.postMessage({
        type: "selection-changed",
        frameName: node ? node.name : null,
    });
});
async function reviewSelectedNode() {
    const node = getSelectedNode();
    // VALIDATION
    if (!isValidNode(node)) {
        figma.ui.postMessage({
            type: "audit-result",
            result: {
                error: "Node yang dipilih tidak valid. Silakan pilih FRAME, COMPONENT, INSTANCE, GROUP untuk melanjutkan audit.",
                summary: "",
                scores: {
                    ux: 0,
                    ui: 0,
                    accessibility: 0,
                    design_system: 0,
                },
                ux_issues: [],
                ui_issues: [],
                accessibility_issues: [],
                design_system_issues: [],
                recommendations: [],
            },
        });
        return;
    }
    // loading state
    figma.ui.postMessage({
        type: "loading",
    });
    if (!node)
        return;
    const payload = {
        frameName: node.name,
        selectedNode: getNodeTree(node),
    };
    try {
        const response = await fetch("http://localhost:3001/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        let parsed;
        // SAFE JSON PARSE
        try {
            parsed = JSON.parse(responseData.review);
        }
        catch (e) {
            console.log("JSON parse failed:", e);
            figma.ui.postMessage({
                type: "audit-result",
                result: {
                    summary: responseData.review,
                    scores: {
                        ux: 0,
                        ui: 0,
                        accessibility: 0,
                        design_system: 0,
                    },
                    ux_issues: [],
                    ui_issues: [],
                    accessibility_issues: [],
                    design_system_issues: [],
                    recommendations: ["AI tidak mengembalikan JSON valid"],
                },
            });
            return;
        }
        // success result
        figma.ui.postMessage({
            type: "audit-result",
            result: parsed,
        });
    }
    catch (error) {
        console.error(error);
        figma.ui.postMessage({
            type: "audit-result",
            result: {
                summary: "Backend connection failed",
                scores: {
                    ux: 0,
                    ui: 0,
                    accessibility: 0,
                    design_system: 0,
                },
                ux_issues: [],
                ui_issues: [],
                accessibility_issues: [],
                design_system_issues: [],
                recommendations: ["Cek backend server atau OpenRouter API"],
            },
        });
    }
}
// UI handler
figma.ui.onmessage = async (msg) => {
    if (msg.type === "audit") {
        await reviewSelectedNode();
    }
};

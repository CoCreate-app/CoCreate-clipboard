/********************************************************************************
 * Copyright (C) 2020 CoCreate LLC and others.
 *
 *
 * SPDX-License-Identifier: MIT
 ********************************************************************************/

import "@cocreate/element-prototype";
import { queryElements } from "@cocreate/utils";
import Actions from "@cocreate/actions";
import Observer from "@cocreate/observer";

const selector =
	"[clipboard-selector], [clipboard-closest], [clipboard-parent], [clipboard-next], [clipboard-previous]";

function init(element) {
	if (!element) {
		element = document.querySelectorAll(selector);
		for (let i = 0; i < element.length; i++) {
			initElement(element[i]);
		}
	} else {
		if (
			!(element instanceof HTMLCollection) &&
			!(element instanceof NodeList) &&
			!Array.isArray(element)
		) {
			element = [element];
		}
		for (let i = 0; i < element.length; i++) {
			if (element[i].matches(selector)) {
				initElement(element[i]);
			}
		}
	}
}

function initElement(element) {
	// Add a click event listener to trigger the clipboard action
	element.addEventListener("click", () => {
		let actions = element.getAttribute("actions");
		if (actions && !actions.includes("clipboard")) {
			queryClipboardElement(element);
		}
	});
}

function queryClipboardElement(element) {
	let elements = queryElements({ element, prefix: "clipboard" });
	if (elements === false) {
		elements = [element];
	}
	clipboard(elements);
}

async function clipboard(elements) {
	if (!elements) return;
	if (
		!(elements instanceof HTMLCollection) &&
		!(elements instanceof NodeList) &&
		!Array.isArray(elements)
	) {
		elements = [elements];
	}

	try {
		// Collect values from all elements
		let content = "";

		for (let element of elements) {
			const value = await element.getValue();
			if (value) {
				content += `${value}\n`; // Separate values by newline
			}
		}

		// Remove trailing newline
		content = content.trim();

		// Copy to clipboard
		await navigator.clipboard.writeText(content);

		console.log("Copied to clipboard:", content);

		document.dispatchEvent(
			new CustomEvent("clipboarded", {
				detail: { content }
			})
		);
	} catch (error) {
		console.error("Failed to copy to clipboard:", error);
	}
}

init();

Actions.init([
	{
		name: "clipboard",
		endEvent: "clipboarded",
		callback: (action) => {
			queryClipboardElement(action.element);
		}
	}
]);

Observer.init({
	name: "CoCreateClipboardAddedNodes",
	observe: ["addedNodes"],
	selector,
	callback(mutation) {
		initElement(mutation.target);
	}
});

Observer.init({
	name: "CoCreateClipboardObserver",
	observe: ["attributes"],
	attributeName: [
		"clipboard-selector",
		"clipboard-closest",
		"clipboard-parent",
		"clipboard-next",
		"clipboard-previous"
	],
	selector,
	callback: function (mutation) {
		initElement(mutation.target);
	}
});

export default { init, clipboard };

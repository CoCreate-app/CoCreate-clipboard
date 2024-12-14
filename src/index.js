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
		const clipboardItems = [];

		for (let element of elements) {
			let value = await element.getValue();
			const valueType = element.getAttribute("clipboard-value-type");
			if (valueType === "innerText") {
				value = value.replace(/<[^>]*>/g, "");
				new ClipboardItem({
					"text/plain": new Blob([value], {
						type: "text/plain"
					})
				});
			} else if (typeof value === "string") {
				// Handle string content as plain text
				clipboardItems.push(
					new ClipboardItem({
						"text/plain": new Blob([value], { type: "text/plain" }),
						"text/html": new Blob([value], {
							type: "text/html"
						}) // Render as code block in rich editors
					})
				);
			} else if (value instanceof Blob) {
				// Handle Blob content directly
				clipboardItems.push(
					new ClipboardItem({
						[value.type]: value
					})
				);
			} else {
				console.warn("Unsupported value type for clipboard:", value);
			}
		}

		if (clipboardItems.length > 0) {
			await navigator.clipboard.write(clipboardItems);
		} else {
			console.warn("No valid content to copy to clipboard.");
		}

		document.dispatchEvent(
			new CustomEvent("clipboarded", {
				detail: { clipboardItems }
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
